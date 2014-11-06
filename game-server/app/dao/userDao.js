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
				utils.invokeCallback(cb, null, {code: 200, username: res[0]});
				return ;
			} else {
				logger.error('');
				utils.invokeCallback(cb, null, {code: 201});
			}			
		}
	})
}

userDao.rechargeAccount = function(userId, money, cb){
	var sql = 'select * from Account where uid = ?';

	pomelo.app.get('dbclient').query(sql, [userId], function(error, res){
		if (error !== null) {

		} else if (!!res && res.length === 1){
			var recharge = res[0].recharge+money;
			var vip = getUserVip(recharge);
			var diamond = res[0].diamond+getUserRechargeDiamond(money, res.length);
			sql = 'update Account set vip = ?, diamond = ?, recharge = ? where uid = ?';
			pomelo.app.get('dbclient').query(sql, [vip, diamond, recharge, userId], function(error, res){
				if (error !== null){

				} else {
					utils.invokeCallback(cb, null, {code: 200, diamond: diamond});
				}
			})
		} else {
			var vip = getUserVip(money);
			var diamond = getUserRechargeDiamond(money, 0);
			sql = 'update Account set vip = ?, diamond = ?, recharge = ? where uid = ?';
			pomelo.app.get('dbclient').query(sql, [vip, diamond, money, userId], function(error, res){
				if (error !== null){

				} else {
					utils.invokeCallback(cb, null, {code: 200, diamond: diamond});
					return 0;
				}
			})
		}
	})
}

userDao.queryAccount = function(userId, cb){
	var sql = 'select * from Account where uid = ?';

	pomelo.app.get('dbclient').query(sql, [parseInt(userId)], function(error, res){
		if (error !== null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);
		} else if (!!res && res.length === 1){
			utils.invokeCallback(cb, null, {code: 200, vip: res[0].vip, diamond: res[0].diamond, gold: res[0].gold});
		} else {
			utils.invokeCallback(cb, null, {code: 201});
		}
	})
}

userDao.consumeAccountDiamond = function(userId, diamond, cb){
	var sql = 'select * from Account where uid = ?';
	
	pomelo.app.get('dbclient').query(sql, [userId], function(error, res){
		if (error !== null) {

		} else if (!!res && res.length === 1){
			if (res[0].diamond >= diamond) {
				var prime = res[0].diamond;
				var remain = res[0].diamond - diamond;
				sql = 'update Account set diamond = diamond - ? where uid = ?';
				pomelo.app.get('dbclient').query(sql, [diamond, userId], function(error, res){
					if (error !== null) {

					} else {
						console.log(' ====>', res);
						accountLog('diamond', {prime: prime, change: diamond, remain: remain});
						utils.invokeCallback(cb, null, {code: 200, diamond: remain});	
					}				
				})
			} else {
				utils.invokeCallback(cb, null, {code: 201});
			}
		}
	})
}

userDao.consumeAccountGold = function(userId, gold, cb){
	var sql = 'select * from Account where uid = ?';
	
	pomelo.app.get('dbclient').query(sql, [userId], function(error, res){
		if (error !== null) {

		} else if (!!res && res.length === 1){
			if (res[0].gold >= gold) {
				var prime = res[0].gold;
				var remain = res[0].gold - gold;
				sql = 'update Account set gold = gold - ? where uid = ?';
				pomelo.app.get('dbclient').query(sql, [gold, userId], function(error, res){
					if (error !== null) {
						
					} else {
						console.log(' ====>', res);
						accountLog('gold', {prime: prime, change: gold, remain: remain});
						utils.invokeCallback(cb, null, {code: 200, gold: remain});	
					}				
				})
			} else {
				utils.invokeCallback(cb, null, {code: 201});
			}
		}
	})
}


/***********************************/
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
/*********************************************/
function getUserVip (amount) {
	return 1;
}

function getUserRechargeDiamond(amount, options){
	if (!!options && options === 0) {
		return parseInt(amount)*2;
	} else {
		return amount+100;
	}
}

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

