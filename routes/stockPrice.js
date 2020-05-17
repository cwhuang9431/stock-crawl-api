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
      'method': 'POST',
      'url': `https://pchome.megatime.com.tw/stock/sid${code}.html`,
      'headers': {
      },
      'form': {
        'is_check': '1'
      }
    };
    request(options, function (error, response, body) {
      if (error) reject(error);
      var $ = cheerio.load(body);
      var name = $(".corp-name").text().trim();
      var industry = $("span.txt").text().trim();
      var price = parseFloat($("#stock_info_data_a span:nth-child(1)").text().trim());
      var price_last = parseFloat($("#stock_info_data_b td:nth-child(10)").text().trim());
      var price_y_max = parseFloat($("#bttb > table:nth-child(1) > tbody > tr:nth-child(8) > td:nth-child(5)").text().trim());
      var price_y_min = parseFloat($("#bttb > table:nth-child(1) > tbody > tr:nth-child(8) > td:nth-child(6)").text().trim());
      resolve({ name, industry, price, price_last, price_y_max, price_y_min });
    });
  });

}
module.exports = router;
