var userDao = require('../../../userDao');

module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
	this.uidMap = {};
};

var handler = GameRemote.prototype;

handler.enter = function(uid, sid，cb){
	//查询玩家基本信息username, vip等
}

handler.update = function(param, cb){
	//更新玩家基本信息
}

handler.query = function(uid, cb){
	//查询玩家基本信息
	if (!!uid){
		var player = this.uidMap[uid];
		if (!!player){
			cb(null, player);
			return ;
		}
	}

	cb(201);
}