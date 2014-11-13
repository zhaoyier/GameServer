var underscore = require('underscore');

var Code = require('../../../shared/code');
var Team = require('../domain/entity/team');
var Error = require('../consts/code');
var dispatcher = require('../util/dispatcher');
//var logger = require('pomelo-logger').getLogger('gameservice', __filename);

var GameService = function(app) {
	//this.app = app;
	this.app = null;
	this.uidMap = {};
	this.teamMap = {};
	this.teamObjMap = {};
}

module.exports = GameService;
var teamId = 0;
var handler = GameService.prototype;


/**
* 进入游戏，记录玩家信息
* @param: 
*/
handler.enterGame = function(userId, data, cb){
	if (!!userId && !!data && typeof(cb) === 'function'){
		addUserRecord(this, userId, data);
		cb(null, {code: 200});
	} else {
		cb(null, {code: 201});
	}
}

/**
* 查询玩家基本信息
* @param: 
*/
handler.queryUserBasic = function(userId, cb){
	var _user = this.uidMap[userId];
	if (!!_user) {
		cb(null, _user);
	} else {
		cb(201);
	}
}

/**
* 创建房间
* @param: 
*/
handler.createTeam = function(userId, cb){
	var _teamObj = new Team(++teamId);
	var res = _teamObj.addPlayer({userId: userId});
	if (Error.OK){
		this.teamMap[userId] = _teamObj.teamId;
		this.teamObjMap[_teamObj.teamId] = _teamObj;
		cb(null, {teamId: _teamObj.teamId, teammates: res});
	} else {
		cb(201);
	}
}

/**
* 选择房间进入游戏
* @param: 
*/
handler.joinTeam = function(userId, callback){
	var _teamObj = null;
	for (var _id in this.teamObjMap){
		if (this.teamObjMap[_id].isTeamHasPosition()){
			_teamObj = this.teamObjMap[_id];
		}
	}

	/*创建房间or加入房间*/
	if (_teamObj != null) {
		var _teammates = _teamObj.addPlayer({userId: userId});
		callback(null, {teamId: _teamObj.teamId, teammates: _teammates});
	} else {
		_teamObj = this.createTeam(userId, function(error, res){
			if (!error) {
				callback(null, {teamId: res.teamId, teammates: res.teammates});
			} else {
				callback(201);
			}
		})
	}

}

/**
* 检查是否为队友
* @param: 
*/

handler.checkTeammate = function(userId, teammate){	
	var _teamId = this.teamMap[userId];
	if (!!_teamId){
		var _teamObj = this.teamObjMap[_teamId];
		if (!!_teamObj){

		} else {

		}
	}
}

handler.leave = function(uid){
	var record = this.uidMap[uid];
	if (record && !!this.teamMap[record.teamId]){
		delete this.uidMap[uid];
		for (var i=0; i<this.teamMap[record.teamId].length; ++i){
			if (this.teamMap[record.teamId][i]['uid'] === uid){
				this.teamMap[record.teamId].splice(i, 1);
			}		
		}
	} else {
		log('leave', {uid: uid});
	}
}

handler.kick = function(uid, teamId){
	delete this.uidMap[uid];
	if (!!this.teamMap[teamId]){
		for (var i=0; i<this.teamMap[teamId].length; ++i){
			if (this.teamMap[teamId][i]['uid'] === uid){
				this.teamMap[teamId].splice(i, 1);
			}
		}
	} else {
		log('kick', {uid: uid});
	}
	return Code.Ok;
}


handler.pushMessageToPlayer = function(){
	
}

handler.pushMessageToTeam = function(fun, teamId){
	
}

handler.queryUserServerId = function(userId){
	return getServerIdByUserId(userId, this.app);
}


var checkDuplicate = function(service, uid, teamId) {
	return !!service.uidMap[uid];
};

var addUserRecord = function(service, uid, data){
	service.uidMap[uid] = data;
}

var addTeamRecord = function(service, uid, data){

}

var log = function(fun, msg){
	var timestamp = new Date();
	//logger.error(timestamp+':'+fun+':'+msg);
}

/**
* Get the connector server id assosiated with the uid
**/
var getServerIdByUserId = function(userId, app) {
  var connector = dispatcher.dispatch(userId, app.getServersByType('connector'));
  if(connector) {
    return connector.id;
  }
  return null;
};

