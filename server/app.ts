var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cors = require("cors");

var APIRouter = require("./routes/main");

var app = express.Application = express();
import mongoose from 'mongoose';

const MONGO_PATH      = '127.0.0.1:27017/dss_proxy';
const MONGO_USER     = 'dss';
const MONGO_PASSWORD = 'dss';

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", APIRouter);

app.use(function(req: any, res: any, next:any) {
  res.status(404);
  res.send({ error: 'Not found' });

});

app.listen(5000, function () {
  mongoose.connect(
    `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`,
    {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log('App is listening on port 5000!');
});

module.exports = app;
