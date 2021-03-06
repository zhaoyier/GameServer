var userDao = require('../../../dao/userAccount');

module.exports = function(app){
	return new AccountHandler(app, app.get('gameService'));
}

var AccountHandler = function(app, service){
	this.app = app;
	this.service = service;
}

var handler = AccountHandler.prototype;

/**
* 充值
* @param: 
**/
handler.recharge = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _tranId = msg.tranId;
	var _amount = msg.amount;
	var _from = msg.amount;

	//根据交易号验证充值
	//记录数据userId, money, from, tranId, cb
	userAccount.rechargeAccount(_userId, _amount, _from, _tranId, function(error, res){
		if (error === null) {
			return next(null, {code: 200, vip: 1, diamond: 100});
		} else {
			return next(null, {code: 201});
		}
	})
}

/**
* 钻石兑换金币
* @param: 
**/
handler.exchange = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _diamond = parseInt(msg.diamond);

	userAccount.exchangeGold(_userId, _diamond, function(error, res){
		if (error === null) {
			return next(null, {code: 200, diamond: 100, gold: 200});
		} else {
			return next(null, {code: 201});	
		}
	})	
}

/**
* 拍卖金币
* @param:
*/
handler.auctionGold = function(msg, session, next){
	var _userId = session.get('playerId');
	var _gold = parseInt(msg.gold||0);
	var _diamond = parseInt(msg.diamond||0);

	userAccount.auctionGold(_userId, _gold, _diamond, function(error, res){
		if (error === null) {
			return next(null, {code: 200, gold: 200});
		} else {
			return next(null, {code: 201});
		}
	})
}

/**
* 购买金币
* @param: 
*/
handler.buyGold = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _auctionSerial = msg.serial;
	userAccount.buyGold(_userId, _auctionSerial, function(error, res){

	})
}

/**
* 查看排行榜
* @param: 
**/
handler.rank = function(msg, session, next){
	
}


/**
* 活动数据查询
* @param: 
**/
handler.activity = function(msg, session, next){

}

/**
* 消息
* @param: 
**/
handler.message = function(msg, session, next) {

}

/**
* 奖励
* @param: 
**/
handler.award = function(msg, session, next) {

}

/**
* 商城
* @param: 
**/

handler.shop = function(msg, session, next) {

}
