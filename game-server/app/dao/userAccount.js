var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var userAccount = module.exports;

userAccount.queryAccount = function(userId, cb){
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


userAccount.rechargeAccount = function(userId, money, from, tranId, cb){
	var _sql = 'select * from Account where uid = ?';

	pomelo.app.get('dbclient').query(_sql, [userId], function(error, res){
		if (error !== null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);

		} else if (!!res && res.length === 1){
			var _recharge = res[0].recharge+money;
			var _vip = getUserVip(_recharge);
			var _diamond = res[0].diamond+getUserRechargeDiamond(money, 0);
			_sql = 'update Account set vip = ?, diamond = ?, recharge = ? where uid = ?';
			pomelo.app.get('dbclient').query(_sql, [_vip, _diamond, _recharge, userId], function(error, res){
				if (error !== null) {
					utils.invokeCallback(cb, error, null);
				} else {
					_sql = 'insert into Recharge(uid, recharge, from, tranId) values(?, ?, ?, ?)';
					pomelo.app.get('dbclient').query(_sql, [userId, money, from, tranId], function(error, res){
						utils.invokeCallback(cb, null, {code: 200, diamond: _diamond});
					})
				}
			})

		} else {
			var _recharge = res[0].recharge+money;
			var _vip = getUserVip(_recharge);
			var _diamond = res[0].diamond+getUserRechargeDiamond(money, 0);
			_sql = 'insert into Account(uid, vip, diamond, recharge) values(?, ?, ?, ?)';
			pomelo.app.get('dbclient').query(_sql, [userId, _vip, _diamond, _recharge], function(error, res){
				if (error !== null) {
					utils.invokeCallback(cb, error, null);
				} else {
					_sql = 'insert into Recharge(uid, recharge, from, tranId) values(?, ?, ?, ?)';
					pomelo.app.get('dbclient').query(_sql, [userId, money, from, tranId], function(error, res){
						utils.invokeCallback(cb, null, {code: 200, diamond: _diamond});
					})
				}
			})
		}
	})
}

userAccount.exchangeGold = function(userId, diamond, cb) {
	var _sql = 'select * from Account where uid = ?';
	pomelo.app.get('dbclient').query(_sql, [userId], function(error, res){
		if (error != null) {
			logger.error('');
			utils.invokeCallback(cb, error, null);
		} else if (!!res && res.length === 1) {
			if (res[0].diamond < diamond) {
				return utils.invokeCallback(cb, 201, null);
			} else {
				var _gold = res[0].gold+diamond*10000;
				_sql = 'update Account set diamond = diamond - ? , gold = gold + ? where uid = ?';
				pomelo.app.get('dbclient').query(_sql, [diamond, _gold, userId], function(error, res){
					return utils.invokeCallback(cb, null, {code: 200, gold: _gold});
				})
			}
		} else {
			return utils.invokeCallback(cb, null, {code: 202});
		}
	})
}

/**
* 拍卖金币
* @param: 
*/
userAccount.auctionGold = function(userId, gold, diamond, cb){
	var _sql = 'select * from Account where uid = ?';
	var _param = [userId];

	execSql(_sql, _param, function(error, query){
		if (error === null) {
			var _gold = query[0].gold;
			if (query[0].gold < gold) {
				return utils.invokeCallback(cb, 201, {code: 201});
			}

			_sql = 'update Account set gold = gold - ? where uid = ?';
			execSql(_sql, [gold, userId], function(error, update){
				if (error != null) {
					return utils.invokeCallback(cb, 201, {code: 201});
				}

				_sql = 'insert into AuctionGold(uid, diamond, gold) values(?,?,?)';
				execSql(_sql, [userId, diamond, gold], function(error, insert){
					if (error != null) {
						return utils.invokeCallback(cb, 201, {code: 201});
					}

					return utils.invokeCallback(cb, null, {code: 200, gold: (_gold-gold)});
				})
			})
		} else {
			return utils.invokeCallback(cb, null, {code:201});
		}
	})
}

/**
* 购买金币
* @param: 
*/
userAccount.buyGold = function(userId, serial, cb){
	var _sql = 'select * from Account where uid = ?';
	execSql(_sql, [userId], function(error, self){
		if (error === null) {
			var _selfDiamond = self[0].diamond;
			_sql = 'select * from AuctionGold where id = ?';
			execSql(_sql, [serial], function(error, auction){
				if (error != null) {
					return utils.invokeCallback(cb, 201, {code: 201});
				}

				if (auction[0].diamond <= _selfDiamond)
			})
		}
	})

	async.waterfall([
			function(callback){
				var _sql = 'select * from Account where uid = ?';
				execSql(_sql, [userId], cb);
			}, function(self, callback){
				if (!!self && self.length === 1) {
					var _sql = 'select * from AuctionGold where id = ?';
					execSql(_sql, [serial], function(error, auction){
						if (error)
					})
				} else {
					callback(201);
				}
			}

		], function(error, res){

		})

}

userAccount.consumeAccountDiamond = function(userId, diamond, cb){
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

userAccount.consumeAccountGold = function(userId, gold, cb){
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

/**
* 充值
* @param: 
*/
userAccount.rechargeDiamond = function(uid, amount, channel, trans, cb){
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
userAccount.exchangeDiamond = function(uid, amount, cb){
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

function execSql(sql, param, callback){
	pomelo.app.get('dbclient').query(sql, param, function(error, res){
		callback(error, res);
	})
}

function getUserRechargeDiamond(amount, options){
	if (!!options && options === 0) {
		return parseInt(amount)*2;
	} else {
		return amount+100;
	}
}

function getUserVip (amount) {
	return 1;
}

function getExchangeGold(diamond){
	if (!!diamond) {
		return diamond*10000;
	} else {
		return 
	}
}

function getAuctionGold(gold){
	return gold;
}

function getAuctionDiamond(diamond){
	return diamond;
}
