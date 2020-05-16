var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');

router.get('/', async function (req, res, next) {
  const code = req.query.code
  try {
    var data = await getData(code);
    // 忽略一些欄位
    // var data = data.filter(function (item, index, array) {
    //   var ignoreName = ["種類"];
    //   return !ignoreName.includes(item.name);
    // });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

function getData(code) {
  if (code === '') throw new Error("code not found");
  return new Promise((resolve, reject) => {
    var options = {
      'method': 'GET',
      'url': `http://jdata.yuanta.com.tw/z/zc/zcq/zcq_${code}.djhtm`,
      encoding: null
    };
    request(options, function (error, response, body) {
      body = iconv.decode(new Buffer(body), "big5");
      if (error) reject(error);
      var $ = cheerio.load(body);
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
      resolve(data);
    });
  });

}
module.exports = router;
