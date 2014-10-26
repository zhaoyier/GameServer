var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');

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

userDao.recharge = function(uid, transId, type, amount, cb){
	
}

