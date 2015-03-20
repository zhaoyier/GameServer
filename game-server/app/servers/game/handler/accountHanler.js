var userAccount = require('../../../dao/userAccount');

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
	var _from = msg.from;

	//根据交易号验证充值
	//记录数据userId, money, from, tranId, cb
	userAccount.rechargeAccount(_userId, _amount, _from, _tranId, function(error, doc){
		if (error === null) {
			return next(null, {code: 200, vip: doc.vip, diamond: doc.diamond});
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
		if (error === null && res.code === 200) {
			return next(null, {code: 200, diamond: res.diamond, gold: res.gold});
		} else {
			return next(null, {code: 201});	
		}
	})	
}

/**
* 拍卖金币
* @param:
*/
handler.auction = function(msg, session, next){
	var _userId = session.get('playerId');
	var _gold = parseInt(msg.gold||0);
	var _diamond = parseInt(msg.diamond||0);

	userAccount.auctionGold(_userId, _gold, _diamond, function(error, res){
		if (error === null && res.code === 200) {
			return next(null, {code: 200, gold: res.gold});
		} else {
			return next(null, {code: 201});
		}
	})
}

/**
* 购买金币
* @param: 
*/
handler.purchase = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _auctionSerial = msg.serial;

	userAccount.purchaseGold(_userId, _auctionSerial, function(error, res){
		if (error === null && res.code === 200) {
			return next(null, {code: 200, diamond: res.diamond, gold: res.gold})
		} else {
			return next(null, {code: 201});
		}
		
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
