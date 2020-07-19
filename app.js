var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swaggerJSDoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');

const APPError = require("./helper/AppError");

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "Stock API",
      description: "各式有關股票、投資的api",
      contact: {
        "name": "程式農夫",
        "url": "https://cwhuang9431.github.io/",
        "email": "cwhuang9431@gmail.com"
      },
      servers: ["https://crawl-api-server.herokuapp.com/"]
    }
  },
  apis: ['app.js', './routes/*.js']
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

var indexRouter = require('./routes/index');
var revenueRouter = require('./routes/revenue');
var isqRouter = require('./routes/isq');
var isRouter = require('./routes/is');
var bsqRouter = require('./routes/bsq');
var bsRouter = require('./routes/bs');
var frqRouter = require('./routes/frq');
var frRouter = require('./routes/fr');
var cfsqRouter = require('./routes/cfsq');
var cfsRouter = require('./routes/cfs');
var dividendRouter = require('./routes/dividend');
var stockPriceRouter = require('./routes/stockPrice');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 新增所有都可以跨域存取
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  next();
})

app.use('/', indexRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // api doc 
app.use('/revenue', revenueRouter);
app.use('/isq', isqRouter);
app.use('/is', isRouter);
app.use('/bsq', bsqRouter);
app.use('/bs', bsRouter);
app.use('/frq', frqRouter);
app.use('/fr', frRouter);
app.use('/cfsq', cfsqRouter);
app.use('/cfs', cfsRouter);
app.use('/dividend', dividendRouter);
app.use('/stockPrice', stockPriceRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status).json({
    message: err.message,
    statusCode: err.status
  });
});


/**
 * @swagger
 * definitions:
 *   Statements:
 *     type: object
 *     properties:
 *       message:
 *         type: string
 *         description: http status code 描述
 *       statusCode:
 *         type: string
 *         description: http status code
 *       content:
 *         type: object
 *         properties:
 *           stockName:
 *             type: string
 *             description: 股票名稱
 *           stockCode:
 *             type: string
 *             description: 股票代號
 *           data:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name: 
 *                   type: string
 *                   description: 欄位名稱
 *                 value1: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value2: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value3: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value4: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value5: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value6: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value7: 
 *                   type: string
 *                   description: 第N欄資料
 *                 value8: 
 *                   type: string
 *                   description: 第N欄資料
 */
module.exports = app;