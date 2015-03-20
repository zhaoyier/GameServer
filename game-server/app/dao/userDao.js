var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var userDao = module.exports;

userDao.createUser = function(username, password, callback){
	var _dbclient = pomelo.app.get('dbclient');		

	var _userId = 0;
	async.series({
		account: function(cb) {
			_dbclient.game_mark.findAndModify({mark: 'account'}, [['_id', 'asc']], {$inc: {base: 1}}, {}, function(error, doc) {
				if (!error) _userId = doc.base;
				cb(null, 'ok');
			})
		},
		createUser: function(cb) {
			_dbclient.game_user.save({_id: _userId, name: username, pwd: password, ct: Date.now()}, {w:1}, function(error, doc) {
				cb(error);
			})
		},
		createAccount: function(cb) {
			_dbclient.game_account.save({_id: _userId, vip:0, recharge: 0, diamond: 0, gold: 0, ct: Date.now()}, {w:1}, function(error, doc) {
				cb(error);
			})
		}
	}, function(error, doc) {
		utils.invokeCallback(callback, null, {code: 200, userId: _userId})
	})	
}

userDao.authUser = function(username, password, cb){
	var _dbclient = pomelo.app.get('dbclient');		

	_dbclient.game_user.findOne({name: username, pwd: password}, function(error, doc) {
		if (error) {
			utils.invokeCallback(cb, error, null);
		} else {
			utils.invokeCallback(cb, error, {code: 200, userId: doc._id});
		}
	})
}

userDao.queryUser = function(userId, cb){
	var _dbclient = pomelo.app.get('dbclient');		
	
	_dbclient.game_user.findOne({_id: userId}, function(error, doc) {
		if (error) {
			utils.invokeCallback(cb, error, null);
		} else {
			utils.invokeCallback(cb, error, {code: 200, userId: doc._id, username: doc.name});
		}
	})
}



/**
* 钻石获得
*
*/
userDao.acquireDiamond = function(uid, diamond, way, cb){
	
}

userDao.acquireGold = function(uid, gold, way, cb){


}

var log = function(fun, msg){
	var timestamp = new Date();
	logger.error(timestamp+':'+fun+':'+msg);
}

var getRechargeScale = function(amount){
	return amount;
}

var getExchangeScale = function(amount){
	return amount;
}
/*********************************************/



function log(fun, msg){
	var timestamp = new Date();
	logger.error(timestamp+':'+fun+':'+msg);
}

function accountLog(options, data){
	if (options === 'recharge') {

	} else if (options === 'exchange'){

	} else if (options === 'consume') {

	} else {
		log('accountLog', '');
	}
}

