var underscore = require('underscore');

var Code = require('../../../shared/code');
var Team = require('../domain/entity/team');
var Error = require('../consts/code');
var dispatcher = require('../util/dispatcher');
//var logger = require('pomelo-logger').getLogger('gameservice', __filename);

var GameService = function(app) {
	this.app = app;
	//this.app = null;
	this.uidMap = {};
	this.teamMap = {};
	this.teamObjMap = {};
}

module.exports = GameService;
var teamId = 0;
var handler = GameService.prototype;


/**
* 进入游戏，记录玩家信息
* @param: {}
*/
handler.enterGame = function(userId, data, callback){
	if (!!userId && !!data && typeof(callback) === 'function'){
		addUserRecord(this, userId, data);
		callback(null, {code: 200});
	} else {
		callback(null, {code: 201});
	}
}

/**
* 查询玩家基本信息
* @param: 
*/
// handler.queryUserBasic = function(userId, callback){
// 	var _user = this.uidMap[userId];
// 	if (!!_user) {
// 		callback(null, _user);
// 	} else {
// 		callback(201);
// 	}
// }

/**
* 创建房间
* @param: 
*/
handler.createTeam = function(userId, roomType){
	var _teamObj = new Team(++teamId);
	var _data = {};
	queryUserRecord(this, userId, function(error, res){
		if (!error) {
			_data = underscore.extend({}, {userId: userId, roomType: roomType}, res);
		} else {
			_data = {userId: userId, serviceId: this.queryUserServerId(userId), roomType: roomType};
		}

		var _status = _teamObj.addPlayer(_data);
	
		if (_status === 200) {
			this.teamMap[userId] = _teamObj.teamId;
			this.teamObjMap[_teamObj.teamId] = _teamObj;
			return _teamObj.teamId;
		} else {
			return 0;
		}

	})	
}

/**
* 选择房间进入游戏
* @param: 
*/
handler.joinTeam = function(userId, roomType, callback){
	var _index = 0;
	for (var index in this.teamObjMap){
		if (this.teamObjMap[index].isTeamHasPosition()){
			_index = index;
		}
	}

	/*创建房间or加入房间*/
	if (_index != 0) {
		var _teamObj = this.teamObjMap[_index], _data = {};
		queryUserRecord(this, userId, function(error, res){
			if (!error) {
				_data = underscore.extend({}, {userId: userId, roomType: roomType}, res);
			} else {
				_data = {userId: userId, serviceId: this.queryUserServerId(userId), roomType: roomType};
			}

			var _status = _teamObj.addPlayer({userId: userId, serverId: this.queryUserServerId(userId), roomType: roomType, });
			if (_status === 200) {
				callback(null, {teamId: _teamObj.teamId});
			} else {
				callback(201);
			}			
		})		
	} else {
		var _teamId = this.createTeam(userId, roomType);
		if (_teamId != 0) {
			callback(null, {teamId: _teamId});
		} else {
			callback(201);
		}
	}

}

/**
* 查询队友信息
* @param: 
*/

handler.queryTeammateInfo = function(userId, teammate, callback){	
	var _teamId = this.teamMap[userId];
	if (!!_teamId) {
		var _teamObj = this.teamObjMap[_teamId];
		if (!!_teamObj && !!_teamObj.getTeammatesBasic({userId: teammate})) {
			callback(null, {});
		}
		callback(201);
	} else {
		callback(201);
	}

}

handler.leave = function(userId){
	var record = this.uidMap[userId];
	if (record && !!this.teamMap[record.teamId]){
		delete this.uidMap[userId];
		for (var i=0; i<this.teamMap[record.teamId].length; ++i){
			if (this.teamMap[record.teamId][i]['uid'] === userId){
				this.teamMap[record.teamId].splice(i, 1);
			}		
		}
	} else {
		log('leave', {uid: userId});
	}
}

handler.kick = function(userId, teamId){
	delete this.uidMap[uid];
	if (!!this.teamMap[teamId]){
		for (var i=0; i<this.teamMap[teamId].length; ++i){
			if (this.teamMap[teamId][i]['uid'] === uid){
				this.teamMap[teamId].splice(i, 1);
			}
		}
	} else {
		log('kick', {uid: userId});
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


var checkDuplicate = function(service, userId, teamId) {
	return !!service.uidMap[userId];
};

var addUserRecord = function(service, userId, data){
	service.uidMap[userId] = data;
}

var queryUserRecord = function(service, userId, callback){
	var _user = service.uidMap[userId];
	if (!!_user) {
		callback(null, _user);
	} else {
		callback(201);
	}
}

var addTeamRecord = function(service, userId, data){

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

