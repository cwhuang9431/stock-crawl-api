var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
const CustomError = require("../helper/AppError");

/**
 * @swagger
 * /Frq:
 *  get:
 *    description: 取得個股近八季財務比率表，資料來源：http://jdata.yuanta.com.tw/z/zc/zcr/zcra/zcra_1101.djhtm
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
    var dataFilter = data['data'].filter(function (item, index, array) {
      var ignoreName = [
        "獲利能力指標單位：%",
        "每股比率指標單位：% / 元",
        "成長率指標單位：%",
        "經營能力指標單位：% / 次 / 天",
        "成本費用率指標單位：% / 人",
        "償債能力指標單位：%",
        "其他單位：千元"];
      return !ignoreName.includes(item.name);
    });

    // 去除重複資料
    const distinctName = [];
    dataFilter = dataFilter.filter((item, index, array) => {
      if (!distinctName.includes(item.name)) {
        distinctName.push(item.name);
        return true;
      }
    })
    res.json(
      {
        message: "success",
        statusCode: "200",
        content: {
          stockName: data['stockName'],
          stockCode: data['stockCode'],
          data: dataFilter
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
      'url': `http://jdata.yuanta.com.tw/z/zc/zcr/zcr_${code}.djhtm`,
      encoding: null
    };
    request(options, function (error, response, body) {
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
      var data = $("#oMainTable tr").slice(1).map((index, obj) => {
        var strValue = ["期別", "種類"];
        if (strValue.includes($(obj).find('td').eq(0).text().trim())) {
          return {
            name: $(obj).find('td').eq(0).text().trim(),
            value1: $(obj).find('td').eq(1).text().trim(),
            value2: $(obj).find('td').eq(2).text().trim(),
            value3: $(obj).find('td').eq(3).text().trim(),
            value4: $(obj).find('td').eq(4).text().trim(),
            value5: $(obj).find('td').eq(5).text().trim(),
            value6: $(obj).find('td').eq(6).text().trim(),
            value7: $(obj).find('td').eq(7).text().trim(),
            value8: $(obj).find('td').eq(8).text().trim(),
          }
        } else {
          return {
            name: $(obj).find('td').eq(0).text().trim(),
            value1: parseFloat($(obj).find('td').eq(1).text().trim().replace(/,/g, '')),
            value2: parseFloat($(obj).find('td').eq(2).text().trim().replace(/,/g, '')),
            value3: parseFloat($(obj).find('td').eq(3).text().trim().replace(/,/g, '')),
            value4: parseFloat($(obj).find('td').eq(4).text().trim().replace(/,/g, '')),
            value5: parseFloat($(obj).find('td').eq(5).text().trim().replace(/,/g, '')),
            value6: parseFloat($(obj).find('td').eq(6).text().trim().replace(/,/g, '')),
            value7: parseFloat($(obj).find('td').eq(7).text().trim().replace(/,/g, '')),
            value8: parseFloat($(obj).find('td').eq(8).text().trim().replace(/,/g, '')),
          }
        }
      }).get();
      resolve({ stockName, stockCode, data });
    });
  });

}
module.exports = router;
