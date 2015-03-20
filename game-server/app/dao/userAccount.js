var async = require('async');
var pomelo = require('pomelo');

var logger = require('pomelo-logger').getLogger('dao',__filename);
var utils = require('../util/utils');
var consts = require('../consts/consts');
var Code = require('../consts/code').Account;

var userAccount = module.exports;

userAccount.queryAccount = function(userId, callback){
	var _dbclient = pomelo.app.get('dbclient');
	_dbclient.game_account.findOnd({_id: userId}, function(error, doc) {
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
			_dbclient.game_auction.save({uid: userId, name: _user.name, gold: gold, diamond: diamond}, {w:1}, function(error, doc) {
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
		console.log('==========>>>', error, doc);
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

				if (auction[0].diamond <= _selfDiamond){
					return utils.invokeCallback(cb, 201, {code: 201});
				}
			})
		}
	})

	var _self, _other;
	async.waterfall([
		function(callback){
			var _sql = 'select * from Account where uid = ? and status = 0';
			execSql(_sql, [userId], cb);
		}, function(self, callback){
			_self = self;
			var _sql = 'select * from AuctionGold where id = ?';
			execSql(_sql, [serial], callback);
		},
		function(auction, callback){
			if (_self.length === 1 && auction.length === 1){
				if (_self[0].diamond >= auction[0].diamond) {
					_self[0].diamond -= auction[0].diamond;
					_self[0].gold += getAuctionGold(auction[0].gold);
					_other = auction;
					dealAuctionData({userId: auction[0].saler, diamond: auction[0].diamond}, {userId: userId, gold: auction[0].gold, diamond: auction[0].diamond}, serial, callback);
				} else {
					callback(202);
				}
			} else {
				callback(203);
			}
		}
	], function(error, res){
		if (error === null) {
			//自己的钻石和金币，别人的ID和钻石
			var _data = {self: {diamond: _self[0].diamond, gold: _self[0].gold}, other: {userId: _other[0].userId, diamond: getAuctionDiamond(_other[0].diamond)}}; 
			cb(null, _data);
		} else {
			cb(201);
		}
	})
}

function dealAuctionData(saler, buyer, serial, cb){
	async.waterfall([
		function(callback) {
			var _diamond = getAuctionDiamond(saler.diamond);
			var _sql = 'update Account set diamond = diamond+? where uid = ?';
			execSql(_sql, [_diamond, saler.userId], callback);
		}, function(res, callback){
			var _diamond = buyer.diamond;
			var _gold = getAuctionGold(buyer.gold);
			var _userId = buyer.userId;
			var _sql = 'update Account set diamond = diamond-?, gold = gold+? where uid = ?';
			execSql(_sql, [_diamond, _gold, _userId], callback);
		}, function(res, callback){
			var _sql = 'update AuctionGold set status = 1 where id = ?';
			execSql(_sql, [serial], callback);
		}
	], function(error, res){
		if (error === null) {
			callback(null, res);
		} else {
			callback(201);
		}
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
	return 100;
}

