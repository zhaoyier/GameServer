var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var logDao = module.exports;

logDao.test = function(username, password, cb){
	cb(null, 'ok');
}