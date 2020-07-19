var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
const CustomError = require("../helper/AppError");

/**
 * @swagger
 * /Revenue:
 *  get:
 *    description: 取得個股每月營收，資料來源：http://jdata.yuanta.com.tw/z/zc/zch/zch_1101.djhtm
 *    tags:
 *      - "營收"
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
 *                      date: 
 *                        type: string
 *                        description: 月份
 *                      revenue: 
 *                        type: number
 *                        format: float
 *                        description: 營收(單位：仟元)
 *                      revenue_change_m: 
 *                        type: number
 *                        format: float
 *                        description: 營收月增率(單位：%)
 *                      revenue_pre_y: 
 *                        type: number
 *                        format: float
 *                        description: 去年同期營收(單位：仟元)
 *                      revenue_pre_change_y: 
 *                        type: number
 *                        format: float
 *                        description: 營收年增率(單位：%)
 *                      revenue_accu: 
 *                        type: number
 *                        format: float
 *                        description: 累計營收(單位：仟元)
 *                      revenue_accu_change: 
 *                        type: number
 *                        format: float
 *                        description: 累計營收年增率(單位：%)
 *      '400':
 *        description: 參數錯誤
 *      '404':
 *        description: 抓取失敗
 */
router.get('/', async function (req, res, next) {
  const code = req.query.code;
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

function getData(code) {
  return new Promise((resolve, reject) => {
    if (code === '' || code === undefined) {
      reject(new CustomError(400, "參數錯誤"));
    }
    var options = {
      'method': 'GET',
      'url': `http://jdata.yuanta.com.tw/z/zc/zch/zch_${code}.djhtm`,
      encoding: null,
      'headers': {
      }
    };
    request(options, function (error, response, body) {
      if (error || body === undefined) {
        reject(new CustomError(404, "抓取失敗"));
        return;
      }
      body = iconv.decode(new Buffer(body), "big5");
      var $ = cheerio.load(body);
      var re = new RegExp(/(.*)\((.*)\)/); // 尋找股票名稱與股票代號
      let stockCode, stockName;
      try {
        stockName = $("#oMainTable tr:nth-child(5)").find('td').text().match(re)[1];
        stockCode = $("#oMainTable tr:nth-child(5)").find('td').text().match(re)[2];
      } catch (err) {
        reject(new CustomError(404, "抓取失敗"));
      }
      var data = $("#oMainTable tr").slice(6).map((index, obj) => {
        return {
          date: $(obj).find('td').eq(0).text().trim(),
          revenue: parseFloat($(obj).find('td').eq(1).text().trim().replace(/,/g, '')),
          revenue_change_m: parseFloat($(obj).find('td').eq(2).text().trim().replace(/,/g, '')),
          revenue_pre_y: parseFloat($(obj).find('td').eq(3).text().trim().replace(/,/g, '')),
          revenue_pre_change_y: parseFloat($(obj).find('td').eq(4).text().trim().replace(/,/g, '')),
          revenue_accu: parseFloat($(obj).find('td').eq(5).text().trim().replace(/,/g, '')),
          revenue_accu_change: parseFloat($(obj).find('td').eq(6).text().trim().replace(/,/g, '')),
        }
      }).get();
      resolve({ stockName, stockCode, data });
    });
  });

}
module.exports = router;
