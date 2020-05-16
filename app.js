var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
