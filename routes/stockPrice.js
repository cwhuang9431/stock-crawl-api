var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const CustomError = require("../helper/AppError");



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
  const code = req.query.code
  try {
    var data = await getData(code);
    res.json(
      {
        message: "success",
        statusCode: "200",
        content: data
      }
    );
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /StockPrice/stockDayAll:
 *  get:
 *    description: 取得最新上市櫃股票價格
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
function getData(code) {
  return new Promise((resolve, reject) => {
    if (code === '' || code === undefined) {
      reject(new CustomError(400, "參數錯誤"));
    }
    var options = {
      'method': 'POST',
      'url': `https://pchome.megatime.com.tw/stock/sid${code}.html`,
      'headers': {
      },
      'form': {
        'is_check': '1'
      }
    };
    request(options, function (error, response, body) {
      if (error || body === undefined) {
        reject(new CustomError(404, "抓取失敗"));
        return;
      }
      var $ = cheerio.load(body);
      var name = $(".corp-name").text().trim();
      var re = new RegExp(/(.*)\((.*)\)/); // 尋找股票名稱與股票代號
      let stockCode, stockName;
      try {
        stockName = name.match(re)[1].replace("　", "").trim();
        stockCode = name.match(re)[2];
      } catch (err) {
        reject(new CustomError(404, "抓取失敗"));
      }
      var industry = $("span.txt").text().trim().replace(/\n/g,",").replace(/[\s]+/g,"");
      var price = parseFloat($("#stock_info_data_a span:nth-child(1)").text().trim());
      var price_last = parseFloat($("#stock_info_data_b td:nth-child(10)").text().trim());
      var price_y_max = parseFloat($("#bttb > table:nth-child(1) > tbody > tr:nth-child(9) > td:nth-child(5)").text().trim());
      var price_y_min = parseFloat($("#bttb > table:nth-child(1) > tbody > tr:nth-child(9) > td:nth-child(6)").text().trim());
      resolve({ stockName, stockCode, data: { industry, price, price_last, price_y_max, price_y_min } });
    });
  });

}
function getStockDayAll() {
  return new Promise((resolve, reject) => {
    var options = {
      'method': 'GET',
      'url': `https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_data%20json`,
      'headers': {
      },
    };
    request(options, function (error, response, body) {
      if (error || body === undefined) {
        reject(new CustomError(404, "抓取失敗"));
        return;
      }
      resolve(JSON.parse(body));
    });
  });

}
module.exports = router;
