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
      'url': `http://jdata.yuanta.com.tw/z/zc/zcc/zcc_${code}.djhtm`,
      encoding: null
    };
    request(options, function (error, response, body) {
      body = iconv.decode(new Buffer(body), "big5");
      if (error) reject(error);
      var $ = cheerio.load(body);
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
      resolve(data);
    });
  });

}
module.exports = router;
