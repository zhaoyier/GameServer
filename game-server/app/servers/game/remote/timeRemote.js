var async = require('async');
var us = require('underscore');

var userDao = require('../../../dao/userDao');
var dispatcher = require('../../../util/dispatcher');

module.exports = function(app) {
	return new GameRemote(app, app.get('gameService'));
};

var GameRemote = function(app, gameService) {
	this.app = app;
	this.gameService = gameService;
	this.userMap = {};
};

var handler = GameRemote.prototype;

handler.enter = function(userId, cb){
	async.parallel([
		function(callback){
			//查询帐号信息
			userDao.queryUser(userId, function(error, res){
				if (error !== null || res.code !== 200) {
					callback(null, {username: ''})
				} else {
					callback(null, {username: res.username})
				}
			})
		},
		function(callback){
			//查询帐户信息
			userDao.queryAccount(userId, function(error, res){
				if (error !== null || res.code !== 200) {
					callback(null, {vip: 0, diamond: 0, gold: 0})
				} else {
					callback(null, {vip: res.vip, diamond: res.diamond, gold: res.gold});
				}
			})
		},
		function(callback){
			//查询server id
			//var sid = getSidByUserId(userId, this.app);
			var sid = this.gameService.queryUserServerId(userId, this.app);
			if (sid === null) {
				callback(null, {sid: ''});
			} else {
				callback(null, {sid: sid});
			} 
		},
	], function(error, res){
		console.log('enter ===>', res);
		this.userMap[userId] = res;
	})
}

handler.update = function(param, cb){
	//更新玩家基本信息
}

handler.query = function(userId, cb){
	//查询玩家基本信息
	if (!!userId){
		var player = this.userMap[userId];
		if (!!player){
			cb(null, player);
			return ;
		}
	}

	cb(201);
}

/**
* Get the connector server id assosiated with the userId
**/
var getSidByUserId = function(userId, app) {
  var connector = dispatcher.dispatch(userId, app.getServersByType('connector'));
  if(connector) {
    return connector.id;
  }
  return null;
};
