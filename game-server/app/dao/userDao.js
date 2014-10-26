var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var userDao = module.exports;

/**
* auth user account by username and password
* @param {String} username
* @param {String} passwd
* @param {function} cb
*/
userDao.authAccount = function(username, password, cb){
	var sql = 'select * from Users where username = ? and password = ?';
	var args = [username, password];

	pomelo.app.get('dbclient').query(sql,args,function(error, res) {
		if (error !== null) {
			logger.error('authAccount select:\t', error);
			utils.invokeCallback(cb, error, null);
		} else {
			if (!!res && res.length === 1) {
				utils.invokeCallback(cb, null, {uid: res[0].uid, username: res[0].username});
			} else {
				utils.invokeCallback(cb, null, {uid: 0, username: username});
			}
		}
	});
},

userDao.createAccount = function(username, password, cb){
	var sql = 'select * from login where username = ?';
	var args = [username];

	pomelo.app.get('dbclient').query(sql, args, function(error, res){
		if (error !== null) {
			logger.error('createAccount select:\t', error);
			utils.invokeCallback(cb, error, null);
		} else {
			if (!!res && res.length >= 1) {
				utils.invokeCallback(cb, null, {});
			} else {
				sql = 'insert into login(username, password, login_time) values(?,?,?)';
				args = [username, password, 'now()'];
				pomelo.app.get('dbclient').query(sql, args, function(error, res){
					if (error !== null) {
						logger.error('createAccount insert:\t', error);
						utils.invokeCallback(cb, error, null);
					} else {
						utils.invokeCallback(cb, null, {wuid: res.insertId, username: username})
					}
				})
			}
		}
	})
}

userDao.queryUser = function(uid, cb){
	async.parallel([
		function(callback){
			var sql = 'select username from Users where uid = ?';
			pomelo.app.get('dbclient').query(sql, [uid], function(error, res){
				if (error !== null){

				} else {
					callback(null, res);
				}
			})
		},
		function(callback){
			var sql = 'select * from UsersBasic where uid = ?';
			pomelo.app.get('dbclient').query(sql, [uid], function(error, res){
				if (error !== null){

				} else {
					callback(null, res);
				}
			})	
		},
		function(callback){
			var sql = 'select * from Account where uid = ?'；
			pomelo.app.get('dbclient').query(sql, [uid], function(error, res){
				if (error !== null){

				} else {
					callback(null, res);
				}
			})
		},
		function(callback){
			var sql = 'select * from GameRecord where uid = ?';
			pomelo.app.get('dbclient').query(sql, [uid], function(error, res){
				if (error !== null){

				} else {
					callback(null, res);
				}
			})
		}
	], function(error, res){
		if (!error){
			var data = {};
			cb(null, data);
		} else {

		}
	})
}

/**
* 充值
* 
*/
userDao.rechargeDiamond = function(uid, amount, channel, trans, cb){
	var diamond = getRechargeScale(amount);
	var sql = 'update Account set diamond = diamond+? where uid = ?';
	var args = [diamond, uid];
	pomelo.app.get('dbclient').query(sql, args, function(error, res){
		if (error !== null) {
			log('rechargeDiamond 1 update', error.message);
			utils.invokeCallback(cb, error.message, null);
		} else {
			sql = 'insert into AccountLog(uid, channel, affcode, currency, amount, transaction) values(?,?,?,?,?)';
			args = [uid, channel, consts.Affcode.RECHARGE, consts.Currency.DIAMOND, amount, trans];
			pomelo.app.get('dbclient').query(sql, args, function(error, res){
				if (error !== null) {
					log('rechargeDiamond 1 update', error.message);
					utils.invokeCallback(cb, error.message, null);
				} else {
					utils.invokeCallback(cb, error.message, null);
				}
			});
		}
	});
}

/**
* 钻石兑换
*
*/
userDao.exchangeDiamond = function(uid, amount, cb){
	var sql = 'select diamond function Account where uid = ?';
	pomelo.app.get('dbclient').query(sql, [uid], function(error, res){
		if (error !== null){
			log('exchangeDiamond 1 select', error.message);
			utils.invokeCallback(cb, error.message, null);
		} else if (res.length > 0 && res[0].diamond > amount){
			var gold = getExchangeScale(amount);
			sql = 'update Account set diamond = diamond - ?, gold = gold+? where uid = ?';
			var args = [amount, gold, uid];
			pomelo.app.get('dbclient').query(sql, args, function(error, res){
				if (error !== null) {
					log('exchangeDiamond 2 update', error.message);
					utils.invokeCallback(cb, error.message, null);
				} else {
					utils.invokeCallback(cb, null, {diamond: amount, gold: gold});
				}
			})
		} else {
			utils.invokeCallback(cb, Code.INSUFFICIENT_BALANCE, null);
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