var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
const CustomError = require("../helper/AppError");

/**
 * @swagger
 * /Cfs:
 *  get:
 *    description: 取得個股近八年現金流量表，資料來源：http://jdata.yuanta.com.tw/z/zc/zc3/zc3a_1101.djhtm
 *    tags:
 *      - "財務報表"
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
 *              $ref: "#/definitions/Statements"
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
      'url': `http://jdata.yuanta.com.tw/z/zc/zc3/zc3a_${code}.djhtm`,
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
        stockName = $("#oMainTable tr:nth-child(1)").find('td').text().match(re)[1];
        stockCode = $("#oMainTable tr:nth-child(1)").find('td').text().match(re)[2];
      } catch (err) {
        reject(new CustomError(404, "抓取失敗"));
      }
      var data = $("#oMainTable .table-row").map((index, obj) => {
        var strValue = ["期別", "種類"];
        if (strValue.includes($(obj).find('span').eq(0).text().trim())) {
          return {
            name: $(obj).find('span').eq(0).text().trim(),
            value1: $(obj).find('span').eq(1).text().trim(),
            value2: $(obj).find('span').eq(2).text().trim(),
            value3: $(obj).find('span').eq(3).text().trim(),
            value4: $(obj).find('span').eq(4).text().trim(),
            value5: $(obj).find('span').eq(5).text().trim(),
            value6: $(obj).find('span').eq(6).text().trim(),
            value7: $(obj).find('span').eq(7).text().trim(),
            value8: $(obj).find('span').eq(8).text().trim(),
          }
        } else {
          return {
            name: $(obj).find('span').eq(0).text().trim(),
            value1: parseFloat($(obj).find('span').eq(1).text().trim().replace(/,/g, '')),
            value2: parseFloat($(obj).find('span').eq(2).text().trim().replace(/,/g, '')),
            value3: parseFloat($(obj).find('span').eq(3).text().trim().replace(/,/g, '')),
            value4: parseFloat($(obj).find('span').eq(4).text().trim().replace(/,/g, '')),
            value5: parseFloat($(obj).find('span').eq(5).text().trim().replace(/,/g, '')),
            value6: parseFloat($(obj).find('span').eq(6).text().trim().replace(/,/g, '')),
            value7: parseFloat($(obj).find('span').eq(7).text().trim().replace(/,/g, '')),
            value8: parseFloat($(obj).find('span').eq(8).text().trim().replace(/,/g, '')),
          }
        }
      }).get();
      resolve({ stockName, stockCode, data });
    });
  });

}
module.exports = router;
