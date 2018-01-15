const AWS = require('aws-sdk');
const log = console.log;
const dynamodb = new AWS.DynamoDB({region: 'us-east-1'});
const { login } = require('./users');
const get = require('lodash/fp/get');
const s3 = new AWS.S3();

const Server = require('lambda-restify').default;
const restify = require('restify');
const fs = require('fs');
const fileType = require('file-type');
const corsMiddleware = require('restify-cors-middleware')
 

const server = new Server();
// var server = restify.createServer();
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.bodyParser());

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['API-Token'],
    exposeHeaders: ['API-Token-Expiry']
  })
   
  server.pre(cors.preflight)
  server.use(cors.actual)

// server.pre(function(req, res, next) {
//     log("pre, url:", req.href());
//     next()
// })

// server.use(function(req, res, next) {
//     log("use, url:", req.href());
//     next()
// })

// server.get('/trackit', function(req, res) {
    
//     res.json({result: true, data: 'pong default'});
// });

server.get('/trackit/ping', (req, res) => {
    log("req.authorization:", req.authorization);
    res.send(200, {result: true, data: 'pong'});
});

// server.post('/trackit/ping', (req, res) => {
//     log("/trackit/ping POST");
//     res.send(200, {result: true, data: 'pong'});
// });

server.post('/trackit/login', (req, res) => {
    log("req.authorization:", req.authorization);
    const username = get('authorization.basic.username', req);
    const password = get('authorization.basic.password', req);
    login(dynamodb, username, password)
    .then(result => result.matchWith({
        Ok: ({value}) => res.send({result: true, data: {user: value.username}}),
        Error: ({value}) => res.send(401, {result: false, error: value})
    }))
    .catch(error => {
        res.send(500, {result: false, error})
    });
});

server.post('/trackit/upload', (req, res) => {

    //get the image data from upload
    const fileBuffer = Buffer.from(req.body['image'], 'base64');
    const fileTypeInfo = fileType(fileBuffer);
    log("fileTypeInfo:", fileTypeInfo);
    // fs.writeFile('image.jpg', fileBuffer, error =>
    //     error ? res.send(500, {result: false, error})
    //     : res.send({result: true, data: req.body['image']}));
    const params = {
        Body: fileBuffer, 
        Bucket: "trackitimages", 
        Key: "datimage.jpg"
    };
    s3.putObject(params, (err, data) => error =>
        error ? res.send(500, {result: false, error})
        : res.send({result: true, data: 'image uploaded successfully'}));
    
});

exports.handler = (event, context, callback) => {
    server.handleLambdaEvent(event, context, callback);
};

// server.listen(8080, function() {
//     console.log('%s listening at %s', server.name, server.url);
//   });