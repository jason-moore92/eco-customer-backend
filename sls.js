require("dotenv").config();

var path = require('path');
var bodyParser = require('body-parser');
const express = require("express");
const cors = require('cors');
const mongoose = require("./middlewares/mongo/mongoose");
const rawBody = require("./middlewares/raw_body");
var routes = require('./Routes/Routes');
const app = express();
const sls = require("serverless-http");
var message = require('./localization/en.json');
var AWSXRay = require('aws-xray-sdk');
const XRayExpress = AWSXRay.express;
const errorHandler = require('./Utiles/errorHandler');
const Sentry = require("@sentry/node");
// const Tracing = require("@sentry/tracing");
// var dateFormat = require('dateformat');

const consoleSetup = require("./console/setup");

AWSXRay.captureHTTPsGlobal(require('http')); 
AWSXRay.captureHTTPsGlobal(require('https'));


Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: false }),
    // new Tracing.Integrations.Express({
    //   app,
    // }),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler({
  user: ["id", "email", "firstName","lastName", "mobile"]
}));
// app.use(Sentry.Handlers.tracingHandler());
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
AWS.config.update({region: process.env.DEFAULT_AWS_REGION || 'us-west-2'});
app.use(XRayExpress.openSegment('tm-users'));
app.use(rawBody);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept,auth");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Content-Type', 'application/json',);
  next();
});
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

routes(app);

app.use(XRayExpress.closeSegment());
app.use(Sentry.Handlers.errorHandler());

app.use(errorHandler);

const baseHandler = sls(app, {
  basePath: "/default"
});
module.exports.handler = async (event, context) => {
  process.env.TZ = "Asia/Kolkata";
  //Note:: if event is invoked by cloudwatch scheduler.
  if (event.resources && event.resources[0] && event.resources[0].includes('warmer')) { //original is tmusers-qa-warmer
    console.log('Warming...');
    return {
      message: "lambda warned"
    }
  }

  let client = await mongoose.connect();

  let consoleResult = await consoleSetup(event, context);
  if(consoleResult){
    return consoleResult;
  }

  let result;
  try {
    process.env.PATH += `:/opt/bin/`;
    process.env.FONTCONFIG_PATH = `${process.env.LAMBDA_TASK_ROOT}/fonts`
    process.env.LD_LIBRARY_PATH += `:${process.env.LAMBDA_TASK_ROOT}/fonts`
    process.env.AWS_XRAY_DEBUG_MODE  = true;
    result = await baseHandler(event, context);
  } catch (e) {
    result = {
      statusCode: 500,
      body: JSON.stringify({
        "message": "SLS: Internal server error."
      })
    };
    console.log(e)
  }
  // client.connection.close();

  if (result) {
    result.headers["XRAY-trace-id"] = process.env._X_AMZN_TRACE_ID;
  }

  return result;
};