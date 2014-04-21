var winston = require('winston');
var mkdirp = require('mkdirp');
var path = require('path');

mkdirp.sync(path.resolve(__dirname, '../logs'));

//
// Configure the logger for `category1`
//
winston.loggers.add('defaultlogger', {
    console: {
        colorize: 'true'
    }
    , file: { filename: 'logs/express-delivery.log', timestamp: true, maxsize: 1024 * 1024, json: false }
});

//
// Configure the logger for `category2`
//
//winston.loggers.add('maillogger', {
//    mail: {
//        to: 'jacob.he@corp.globalmarket.com'
//        , host: 'smtp.corp.globalmarket.com'
//        , port: 25
//        , username: 'jacob.he@corp.globalmarket.com'
//        , password: 'zsu02hebo'
//    }
//});
//winston.loggers.add('mongologger', {
//    MongoDB: { db: 'gmoa', silent: true }
//});

module.exports.defaultlogger = winston.loggers.get('defaultlogger');
//module.exports.mongologger = winston.loggers.get('mongologger');
