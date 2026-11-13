var express = require('express');
var router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const CustomError = require('../helper/AppError');

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
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      industry:
 *                        type: string
 *                        description: 產業資訊
 *                      price:
 *                        type: number
 *                        format: float
 *                        description: 最新價格
 *                      price_last:
 *                        type: number
 *                        format: float
 *                        description: 昨日收盤
 *                      price_y_max:
 *                        type: number
 *                        format: float
 *                        description: 一年內最高
 *                      price_y_min:
 *                        type: number
 *                        format: float
 *                        description: 一年內最低
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
  if (!code) {
    throw new CustomError(400, '參數錯誤');
  }

  let upstreamStatus = null;
  let corpNameMatched = null;

  try {
    const response = await axios.post(
      `https://pchome.megatime.com.tw/stock/sid${code}.html`,
      new URLSearchParams({
        is_check: '1',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    upstreamStatus = response.status;
    const $ = cheerio.load(response.data);

    const name = $('.corp-name').text().trim();
    const nameMatch = name.match(/(.*)\((.*)\)/);
    corpNameMatched = nameMatch !== null;
    if (!nameMatch) {
      throw new Error('PChome .corp-name did not match the expected stock name and code format');
    }

    const stockName = nameMatch[1].replace('　', '').trim();
    const stockCode = nameMatch[2];

    const industry = $('span.txt').text().trim().replace(/\n/g, ',').replace(/[\s]+/g, '');

    const price = parseFloat($('#stock_info_data_a span:nth-child(1)').text().trim());
    const price_last = parseFloat($('#stock_info_data_b td:nth-child(10)').text().trim());
    const price_y_max = parseFloat(
      $('#bttb > table:nth-child(1) > tbody > tr:nth-child(9) > td:nth-child(5)').text().trim()
    );
    const price_y_min = parseFloat(
      $('#bttb > table:nth-child(1) > tbody > tr:nth-child(9) > td:nth-child(6)').text().trim()
    );

    return {
      stockName,
      stockCode,
      data: { industry, price, price_last, price_y_max, price_y_min },
    };
  } catch (err) {
    console.error('PChome stock price fetch failed', {
      stockCode: code,
      errorCode: err.code ?? null,
      errorMessage: err.message,
      upstreamStatus: err.response?.status ?? upstreamStatus,
      corpNameMatched,
    });
    throw new CustomError(404, '抓取失敗');
  }
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
