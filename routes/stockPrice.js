var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const CustomError = require("../helper/AppError");
const iconv = require('iconv-lite');

/**
 * @swagger
 * /StockPrice:
 *  get:
 *    description: 取得個股每月營收，資料來源：https://pchome.megatime.com.tw/stock/sid1101.html
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
 *        description: 抓取失敗 */
router.get('/', async function (req, res, next) {
  const code = req.query.code
  try {
    var data = await getData(code);
    var priceData = await getPrice(code);
    res.json(
      {
        message: "success",
        statusCode: "200",
        content: {
          stockName: priceData.Name,
          stockCode: priceData.ID,
          data: {
            industry: data.industry,
            price: parseFloat(priceData.P),
            price_last: parseFloat(priceData.PC),
            price_y_max: 0,
            price_y_min: 0
          }
        }
      }
    );
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
      'method': 'GET',
      'url': `https://djinfo.cathaysec.com.tw/Z/ZC/ZCS/ZCS.DJHTM?A=${code}`,
      encoding: null
    };
    request(options, function (error, response, body) {
      if (error || body === undefined) {
        reject(new CustomError(404, "抓取失敗"));
        return;
      }
      body = iconv.decode(body, "big5");
      var $ = cheerio.load(body);
      var industry = $(".t3t1").text().trim().trim().replace(/\n/g,"");
      resolve({ industry });
    });
  });
}

function getPrice(code) {
  return new Promise((resolve, reject) => {
    if (code === '' || code === undefined) {
      reject(new CustomError(400, "參數錯誤"));
    }
    var options = {
      'method': 'GET',
      'url': `https://djinfo.cathaysec.com.tw/z/GetStkRTDataJSON.djjson?B=${code}`,
      encoding: null
    }
    request(options, function (error, response, body) {
      if (error || body === undefined) {
        reject(new CustomError(404, "抓取失敗"));
        return;
      }
      body = iconv.decode(body, "big5");
      resolve(JSON.parse(body));
    });
  });
}
module.exports = router;
