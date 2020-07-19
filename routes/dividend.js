var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
const CustomError = require("../helper/AppError");

/**
 * @swagger
 * /Dividend:
 *  get:
 *    description: 取得個股近八年綜合損益表，資料來源：http://jdata.yuanta.com.tw/z/zc/zcc/zcc_1101.djhtm
 *    tags:
 *      - "基本資料"
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
 *                        description: 股利所屬年度
 *                      cashA: 
 *                        type: number
 *                        format: float
 *                        description: 現金股利-盈餘發放
 *                      cashB: 
 *                        type: number
 *                        format: float
 *                        description: 現金股利-公積發放
 *                      cashSum: 
 *                        type: number
 *                        format: float
 *                        description: 現金股利-小計
 *                      divA: 
 *                        type: number
 *                        format: float
 *                        description: 股票股利-盈餘發放
 *                      divB: 
 *                        type: number
 *                        format: float
 *                        description: 股票股利-公積發放
 *                      divSum: 
 *                        type: number
 *                        format: float
 *                        description: 股票股利-小計
 *                      total: 
 *                        type: number
 *                        format: float
 *                        description: 合計
 *      '400':
 *        description: 參數錯誤
 *      '404':
 *        description: 抓取失敗
 */
router.get('/', async function (req, res, next) {
  const code = req.query.code
  try {
    var data = await getData(code);
    // 忽略一些欄位
    // var data = data.filter(function (item, index, array) {
    //   var ignoreName = ["種類"];
    //   return !ignoreName.includes(item.name);
    // });
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
      'url': `http://jdata.yuanta.com.tw/z/zc/zcc/zcc_${code}.djhtm`,
      encoding: null
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
        stockName = $(".t0 tr:nth-child(1)").find('td').text().match(re)[1];
        stockCode = $(".t0 tr:nth-child(1)").find('td').text().match(re)[2];
      } catch (err) {
        reject(new CustomError(404, "抓取失敗"));
      }
      var data = $(".t0 tr").slice(4).map((index, obj) => {
        return {
          date: $(obj).find('td').eq(0).text().trim(),
          cashA: parseFloat($(obj).find('td').eq(1).text().trim().replace(/,/g, '')),
          cashB: parseFloat($(obj).find('td').eq(2).text().trim().replace(/,/g, '')),
          cashSum: parseFloat($(obj).find('td').eq(3).text().trim().replace(/,/g, '')),
          divA: parseFloat($(obj).find('td').eq(4).text().trim().replace(/,/g, '')),
          divB: parseFloat($(obj).find('td').eq(5).text().trim().replace(/,/g, '')),
          divSum: parseFloat($(obj).find('td').eq(6).text().trim().replace(/,/g, '')),
          total: parseFloat($(obj).find('td').eq(7).text().trim().replace(/,/g, '')),
        }
      }).get();
      resolve({ stockName, stockCode, data });
    });
  });

}
module.exports = router;
