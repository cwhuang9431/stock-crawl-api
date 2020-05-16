var express = require('express');
var router = express.Router();
const request = require("request");
const cheerio = require("cheerio");

router.get('/', async function (req, res, next) {
  const code = req.query.code
  try {
    var data = await getData(code);
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
      'url': `http://jdata.yuanta.com.tw/z/zc/zch/zch_${code}.djhtm`,
      'headers': {
      }
    };
    request(options, function (error, response, body) {
      if (error) reject(error);
      var $ = cheerio.load(body);
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
      resolve(data);
    });
  });

}
module.exports = router;
