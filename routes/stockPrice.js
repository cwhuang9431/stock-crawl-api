var express = require('express');
var router = express.Router();
const axios = require('axios');
const CustomError = require('../helper/AppError');

const industryNames = {
  '01': '水泥工業',
  '02': '食品工業',
  '03': '塑膠工業',
  '04': '紡織纖維',
  '05': '電機機械',
  '06': '電器電纜',
  '08': '玻璃陶瓷',
  '09': '造紙工業',
  10: '鋼鐵工業',
  11: '橡膠工業',
  12: '汽車工業',
  14: '建材營造',
  15: '航運業',
  16: '觀光餐旅',
  17: '金融保險',
  18: '貿易百貨',
  19: '綜合',
  20: '其他',
  21: '化學工業',
  22: '生技醫療業',
  23: '油電燃氣業',
  24: '半導體業',
  25: '電腦及週邊設備業',
  26: '光電業',
  27: '通信網路業',
  28: '電子零組件業',
  29: '電子通路業',
  30: '資訊服務業',
  31: '其他電子業',
  32: '文化創意業',
  33: '農業科技業',
  35: '綠能環保',
  36: '數位雲端',
  37: '運動休閒',
  38: '居家生活',
  80: '管理股票',
};

const upstreamTimeout = 4000;

/**
 * @swagger
 * /StockPrice:
 *  get:
 *    description: 取得個股股價
 *    tags:
 *      - "股票價格"
 *    parameters:
 *    - name: code
 *      in: query
 *      description: 股票代號
 *      required: true
 *      type: string
 *    responses:
 *      200:
 *        description: A successful response
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              description: http status code 描述
 *            statusCode:
 *              type: string
 *              description: http status code
 *            content:
 *              type: object
 *              properties:
 *                stockName:
 *                  type: string
 *                  description: 股票名稱
 *                stockCode:
 *                  type: string
 *                  description: 股票代號
 *                data:
 *                  type: object
 *                  properties:
 *                    industry:
 *                      type: string
 *                      description: 產業及市場別
 *                    price:
 *                      type: number
 *                      format: float
 *                      description: 最新成交價，無成交時使用前一交易日收盤價
 *                    price_last:
 *                      type: number
 *                      format: float
 *                      description: 前一交易日收盤價
 *                    price_y_max:
 *                      type: number
 *                      format: float
 *                      description: 近 52 週最高，來源無資料時為 null
 *                    price_y_min:
 *                      type: number
 *                      format: float
 *                      description: 近 52 週最低，來源無資料時為 null
 *      '400':
 *        description: 參數錯誤
 *      '404':
 *        description: 抓取失敗
 */
router.get('/', async function (req, res, next) {
  const code = req.query.code;
  try {
    var data = await getData(code);
    res.json({
      message: 'success',
      statusCode: '200',
      content: data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /StockPrice/stockDayAll:
 *  get:
 *    description: 取得最新上市股票價格
 *    tags:
 *      - "股票價格"
 *    responses:
 *      200:
 *        description: A successful response
 *      '400':
 *        description: 參數錯誤
 *      '404':
 *        description: 抓取失敗
 */
router.get('/stockDayAll', async function (req, res, next) {
  try {
    var data = await getStockDayAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /StockPrice/stockDayAll_1:
 *  get:
 *    description: 取得最新上櫃股票價格
 *    tags:
 *      - "股票價格"
 *    responses:
 *      200:
 *        description: A successful response
 *      '400':
 *        description: 參數錯誤
 *      '404':
 *        description: 抓取失敗
 */
router.get('/stockDayAll_1', async function (req, res, next) {
  try {
    var data = await getStockDayAll_1();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

async function getData(code) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new CustomError(400, '參數錯誤');
  }

  const stockCode = code.trim().toUpperCase();
  if (!/^[0-9A-Z]+$/.test(stockCode)) {
    throw new CustomError(404, '抓取失敗');
  }

  let quote;
  try {
    const { data } = await axios.get('https://mis.twse.com.tw/stock/api/getStockInfo.jsp', {
      params: { ex_ch: `tse_${stockCode}.tw|otc_${stockCode}.tw` },
      timeout: upstreamTimeout,
    });
    if (!Array.isArray(data?.msgArray)) {
      throw new Error('Invalid TWSE MIS quote response');
    }
    quote = data.msgArray.find(
      (row) =>
        row?.c === stockCode &&
        typeof row.n === 'string' &&
        row.n.trim() &&
        (row.ex === 'tse' || row.ex === 'otc')
    );
  } catch (err) {
    logStockPriceError('TWSE MIS', stockCode, err);
    throw new CustomError(404, '抓取失敗');
  }
  if (!quote) {
    throw new CustomError(404, '抓取失敗');
  }

  const listed = quote.ex === 'tse';
  const market = listed ? '上市' : '上櫃';
  const industry = [industryNames[quote.i], market].filter(Boolean).join(',');
  const priceLast = parsePrice(quote.y);
  const price = parsePrice(quote.z) ?? parsePrice(quote.trade?.z) ?? priceLast;
  const { high, low } = await getYearRange(stockCode, listed ? 'TW' : 'TWO');

  return {
    stockName: quote.n.trim(),
    stockCode,
    data: { industry, price, price_last: priceLast, price_y_max: high, price_y_min: low },
  };
}

async function getYearRange(stockCode, marketSuffix) {
  try {
    const symbol = `${stockCode}.${marketSuffix}`;
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: { range: '5d', interval: '1d' },
        timeout: upstreamTimeout,
      }
    );
    const meta = data?.chart?.result?.[0]?.meta;
    if (meta?.symbol !== symbol) {
      throw new Error('Invalid Yahoo Finance chart response');
    }
    return { high: parsePrice(meta.fiftyTwoWeekHigh), low: parsePrice(meta.fiftyTwoWeekLow) };
  } catch (err) {
    logStockPriceError('Yahoo Finance', stockCode, err);
    return { high: null, low: null };
  }
}

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function logStockPriceError(source, stockCode, err) {
  console.error('Stock price upstream request failed', {
    source,
    stockCode,
    errorCode: err.code ?? null,
    errorMessage: err.message,
    upstreamStatus: err.response?.status ?? null,
  });
}

async function getStockDayAll() {
  try {
    const response = await axios.get(
      'https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_data%20json'
    );

    return response.data;
  } catch (err) {
    throw new CustomError(404, '抓取失敗');
  }
}

async function getStockDayAll_1() {
  try {
    const response = await axios.get(
      'https://www.tpex.org.tw/web/stock/aftertrading/DAILY_CLOSE_quotes/stk_quote_result.php?l=zh-tw&o=data%20json'
    );

    return response.data;
  } catch (err) {
    throw new CustomError(404, '抓取失敗');
  }
}

module.exports = router;
