var userDao = require('');

module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
	this.uidMap = {};
};

var handler = GameRemote.prototype;

handler.enter = function(uid){
	//查询玩家基本信息username, vip等
}

handler.update = function(param){
	//更新玩家基本信息
}

handler.query = function(uid, callback){
	//查询玩家基本信息
	if (!!uid){
		var player = this.uidMap[uid];
		if (!!player){
			callback(null, player);
			return ;
		}
	}

	callback(201);
}