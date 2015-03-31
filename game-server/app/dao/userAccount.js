var async = require('async');
var pomelo = require('pomelo');
var ObjectId = require('mongodb').ObjectID;

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../config/consts');
var Code = require('../config/code').Account;

var userAccount = module.exports;

userAccount.queryAccount = function(userId, callback){
	var _dbclient = pomelo.app.get('dbclient');
	_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
		if (error) {
			utils.invokeCallback(callback, null, {code: 201});
		} else{
			utils.invokeCallback(callback, null, {code: 200, vip: doc.vip, diamond: doc.diamond, gold: doc.gold});
		}
	})	
}


userAccount.rechargeAccount = function(userId, recharge, channel, tranId, callback){
	userId = !!userId?userId:10000001;
	
	var _dbclient = pomelo.app.get('dbclient');
	var _account = {}, _user = {};
	async.series({
		recharge: function(cb){
			_dbclient.game_recharge.insert({uid: userId, recharge: parseInt(recharge), channel: channel, tranId: tranId}, {w:1}, function(error, doc){
				cb(error, 'ok');
			})
		},
		query: function(cb) {
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (!error) _account = doc;
				cb(error, 'ok');
			})
		},
		update: function(cb){
			if (!_account) return cb(201);
			
			_user.recharge = parseInt(_account.recharge)+parseInt(recharge);
			_user.vip = getUserVip(_user.recharge);
			_user.diamond = parseInt(_account.diamond)+getUserRechargeDiamond(recharge);

			_dbclient.game_account.update({_id: userId}, {$set: {recharge: _user.recharge, vip: _user.vip, diamond: _user.diamond}}, function(error, doc) {
				cb(error, 'ok');
			})
		}
	}, function(error, doc) {
		if (error !== undefined || error) {
			utils.invokeCallback(callback, null, {code: 201});
		} else {
			utils.invokeCallback(callback, null, {code: 200, diamond: _user.diamond, vip: _user.vip, gold: _account.gold});
		}
	})
}

/**
 * @function: 交易金币
 * @param: 
 * */
userAccount.exchangeGold = function(userId, diamond, callback) {
	userId = !!userId?userId:10000001;
	
	var _dbclient = pomelo.app.get('dbclient');
	var _account = {}, _diamond = 0, _gold = 0, _exchange = 0;

	async.series({
		query: function(cb){
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (error) {
					cb(error);
				} else if (doc.diamond < diamond) {
					cb(201);
				} else {
					_account = doc;
					cb(null, 'ok');
				}
			})
		},
		update: function(cb){
			_diamond = parseInt(_account.diamond) - parseInt(diamond);
			_exchange = parseInt(diamond)*1000;
			_gold = parseInt(_account.gold)+_exchange;

			_dbclient.game_account.update({_id: userId}, {$set: {diamond: _diamond}, $inc: {gold: _exchange}}, function(error, doc) {
				cb(error, doc);
			})
		},
		record: function(cb){
			_dbclient.game_exchange.insert({uid: userId, diamond: _diamond, gold: _gold, ct: Date.now()}, {w:1}, cb)
		}
	}, function(error, doc) {
		if (error) {
			return utils.invokeCallback(callback, null, {code: 201});	
		} else {
			return utils.invokeCallback(callback, null, {code: 200, diamond: _diamond, gold: _gold});
		}
	})
}

/**
* 拍卖金币
* @param: 
*/
userAccount.auctionGold = function(userId, gold, diamond, callback){
	userId = !!userId?userId:10000001;
	var _dbclient = pomelo.app.get('dbclient');
	var _account, _user, _gold;
	
	async.series({
		check: function(cb) {
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (error) {
					cb(error);
				} else if (doc.gold < gold) {
					cb(201);
				} else {
					_account = doc;
					cb(null, 'ok');
				}
			})			
		},
		query: function(cb) {
			_dbclient.game_user.findOne({_id: userId}, {name:1}, function(error, doc) {
				if (!error) _user = doc;
				cb(error, 'ok');
			})
		},
		auction: function(cb) {
			_dbclient.game_auction.save({uid: userId, name: _user.name, gold: gold, diamond: diamond, status:0, ct: Date.now()}, {w:1}, function(error, doc) {
				cb(error, 'ok');
			})
		},
		update: function(cb) {
			_gold = parseInt(_account.gold)-parseInt(gold);
			_dbclient.game_account.update({_id: userId}, {$inc: {gold: _gold}}, function(error, doc) {
				cb(error, 'ok');
			})
		}
	}, function(error, doc) {
		if (error) {
			return utils.invokeCallback(callback, null, {code: 201});
		} else {
			return utils.invokeCallback(callback, null, {code: 200, gold: _gold});
		}
	})
}

/**
* 购买金币
* @param: 
*/
userAccount.purchaseGold = function(userId, serial, callback){
	userId = !!userId?userId:10000002;
	var _dbclient = pomelo.app.get('dbclient');
	
	var _auction, _self, _selfDiamond;
	async.series({
		query: function(cb) {
			_dbclient.game_auction.findOne({_id: ObjectId(serial.toString())}, function(error, doc) {
				if (!error && !!doc) _auction = doc;
				cb(error, 'ok');
			})
		},
		check: function(cb) {
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (!error && !!doc && doc.diamond >= _auction.diamond) {
					_self = doc;
					cb(error, 'ok');
				} else {
					cb(201, 'ok');
				}
			})
		},
		deduct: function(cb) {
			_selfDiamond = parseInt(_self.diamond) - parseInt(_auction.diamond);
			
			_dbclient.game_account.update({_id: userId}, {$set: {diamond: _selfDiamond}, $inc: {gold: _auction.gold}}, function(error, doc) {
				cb(error, 'ok');
			})
		},
		auction: function(cb) {
			var _diamond = parseInt(_auction.diamond) - getAuctionDiamondTax(_auction.diamond);
			_dbclient.game_account.update({_id: _auction.uid}, {$inc: {diamond: _diamond}}, function(error, doc) {
				cb(error, 'ok');
			})
		},
		record: function(cb){
			_dbclient.game_auction.update({_id: ObjectId(serial.toString())}, {$set: {auctor: _self._id, status: 1, at: Date.now()}}, function(error, doc) {
				cb(error, 'ok');
			})
		}
	}, function(error, doc) {
		if (error) {
			return utils.invokeCallback(callback, null, {code: 201});
		} else {
			var _gold = _self.gold + _auction.gold;
			return utils.invokeCallback(callback, null, {code: 200, diamond: _selfDiamond, gold: _gold});
		}
	})
}

userAccount.consumeDiamond = function(userId, diamond, channel, callback){
	userId = !!userId?userId:10000001;
	var _dbclient = pomelo.app.get('dbclient');

	var _account, _diamond;

	async.series({
		check: function(cb) {
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (!error && !!doc && doc.diamond >= diamond) {
					_account = doc;
					cb(error, 'ok');
				} else {
					cb(201, 'ok');
				}
			})
		},
		update: function(cb) {
			_diamond = _account.diamond - diamond;
			_dbclient.game_account.update({_id: userId}, {$set: {diamond: _diamond}}, function(error, doc) {
				cb(null, 'ok');
			})
		},
		log: function(cb) {
			_dbclient.consume_diamond_log.save({uid: userId, c: 0, a: diamond, ch: channel, ct: Date.now()}, {w:1}, function(error, doc) {
				cb(null, 'ok');
			})
		}
	}, function(error, doc) {
		if (error) {
			utils.invokeCallback(callback, null, {code: 201});
		} else {
			utils.invokeCallback(callback, null, {code: 200, diamond: _diamond});
		}
	})
}

userAccount.consumeGold = function(userId, gold, channel, callback){
	userId = !!userId?userId:10000001;
	var _dbclient = pomelo.app.get('dbclient');

	var _account, _gold;

	async.series({
		check: function(cb) {
			_dbclient.game_account.findOne({_id: userId}, function(error, doc) {
				if (!error && !!doc && doc.gold >= gold) {
					_account = doc;
					cb(error, 'ok');
				} else {
					cb(201, 'ok');
				}
			})
		},
		update: function(cb) {
			_gold = _account.gold - gold;
			_dbclient.game_account.update({_id: userId}, {$set: {gold: _gold}}, function(error, doc) {
				cb(null, 'ok');
			})
		},
		log: function(cb) {
			_dbclient.consume_gold_log.save({uid: userId, c: 0, a: gold, ch: channel, ct: Date.now()}, {w:1}, function(error, doc) {
				cb(null, 'ok');
			})
		}
	}, function(error, doc) {
		if (error) {
			utils.invokeCallback(callback, null, {code: 201});
		} else {
			utils.invokeCallback(callback, null, {code: 200, gold: _gold});
		}
	});
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
		return parseInt(amount)+100;
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

function getAuctionGoldTax(gold){
	return 100;
}

function getAuctionDiamond(diamond){
	return diamond;
}

function getAuctionDiamondTax(diamond){
	return parseInt(diamond*0.05);
}

