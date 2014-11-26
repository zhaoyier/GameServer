var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var userDao = module.exports;


userDao.createUser = function(username, password, cb){
	var sql = 'select * from Users where username = ?';
	pomelo.app.get('dbclient').query(sql, [username], function(error, res){
		if (error !== null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);
		} else {
			sql = 'insert into Users(username, password, create_time) values(?,?,?)';
			pomelo.app.get('dbclient').query(sql, [username, password], function(error, res){
				if (error !== null){
					logger.error('');
					utils.invokeCallback(cb, error, null);
				} else {
					utils.invokeCallback(cb, null, {code: 200, userId: res.insertId});
				}
			})
		}
	})
}

userDao.authUser = function(username, password, cb){
	var sql = 'select * from Users where username = ? and password = ?';
	var args = [username, password];

	pomelo.app.get('dbclient').query(sql, args, function(error, res){
		if (error !== null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);
		} else {
			if (!!res && res.length === 1){
				utils.invokeCallback(cb, null, {code: 200, userId: res[0].uid});
				return ;
			} else {
				utils.invokeCallback(cb, null, {code: 200, userId: 0});
			} 
		}
	})
}

userDao.queryUser = function(userId, cb){
	var sql = 'select * from Users where uid = ?';

	pomelo.app.get('dbclient').query(sql, [userId], function(error, res){
		if (error !== null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);
		} else {
			if (!!res && res.length === 1){
				utils.invokeCallback(cb, null, {code: 200, username:res[0].username});
				return ;
			} else {
				logger.error('');
				utils.invokeCallback(cb, null, {code: 201});
			}			
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

