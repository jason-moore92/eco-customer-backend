# Authentication API with NodeJS and Mongo DB



Hello! This is a small project that demonstrates how to build an Authentication API with NodeJS (ExpressJS) and MongoDB.

# Requirements
  - [Nodejs](https://nodejs.org) - 8.x or greater version
  - [NPM](https://www.npmjs.com/get-npm) - 5.x or greater version

## Notes
1. Run crons using `node .\console.js {{cron_name}}`
2. Invoke lamnda with console: aws `lambda invoke --function-name tmusers-qa --invocation-type RequestResponse  --payload '{"cmd": "test", "args":{"k1":"v1","k2":"v2"}}' invoke_res.json`
  
## Steps to Setup

1. Install dependencies

```bash
npm install
```

2. Change your MongoDB URL on ./config/config.js

```bash
bd_string: 'YOUR_DB_URL_HERE'
```
3. Run 

```bash
node app.js
```


## TODO

1. Rather than exluding the files in serverless, keep js files in src dir
2. Use node-prune, mod-clean and move dev files to devDependencies so that in npm install prod size will be less (Not required in case of webpack)
3. Optimization for mongodb connection opening for every request. (cached variable method as mentioned in `https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/`)
4. In sls mode, try to get the request_id and sent it response in case of error, support team can get it to developer to debug.

## Commands

1. Upload zip directly `aws lambda update-function-code --function-name  tmusers-qa --zip-file fileb://.serverless\tm-users.zip --publish`

2. ~~Or upload to s3 `aws s3 cp .serverless\tm-users.zip s3://tmusers-qa-meta/manual/tm-users-v3.zip` and `aws lambda update-function-code --function-name  tmusers-qa --s3-bucket tmusers-qa-meta --s3-key manual/tm-users-v3.zip --publish`~~
   1. Since, file is now reduced to 11mb using wwebpack we can zip and upload directly.

3. `aws lambda update-function-code --function-name  tmusers-qa --zip-file fileb://dist\dist.zip --publish`


## Problems

1. It seems, `module.exports` not working but to change it to `export default`, need to change many files but rather keep the `sourceType: "unambiguous",` in line 141 of file `serverless-bundle/src/webpack.config.js`, if the author wont accept it just create a clone in our jira and install it from our jira.
2. Lambda mongodb connection, it is failing occasionally and getting sometimes `https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Ftmusers-qa/log-events/2021$252F06$252F15$252F$255B$2524LATEST$255Df0d6d436d7c34573af6d392c6fe68150`
3. Since default stage is defined, we need to remove default in api path `https://github.com/dougmoscrop/serverless-http/issues/86`. this is acheived by providing the basePath for sls app options.


#######