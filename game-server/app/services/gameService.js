var underscore = require('underscore');

var Team = require('../domain/entity/team');
var Code = require('../consts/code');
var Const = require('../consts/consts');
var dispatcher = require('../util/dispatcher');

var userDao = require('../dao/userDao');
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
* 创建房间
* @param: 
*/
handler.createTeam = function(userId, roomType){
	var _teamObj = new Team(++teamId);
	var _data = {};

	var _player = queryUserRecord(this, userId);
	if (!!_player) {
		_data = underscore.extend({}, {userId: userId, roomType: roomType}, _player);
	} else {
		_data = {userId: userId, serviceId: this.queryUserServerId(userId), roomType: roomType};
	}

	var _status = _teamObj.onAddPlayer(_data);
	console.log('create team ====>>', _status);
	
	if (_status === 200) {
		this.teamMap[userId] = _teamObj.teamId;
		this.teamObjMap[_teamObj.teamId] = _teamObj;
		return _teamObj.teamId;
	} else {
		return 0;
	}
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
		var _player = queryUserRecord(this, userId);
		if (!!_player) {
			_data = underscore.extend({}, {userId: userId, roomType: roomType}, _player);
		} else {
			_data = {userId: userId, serviceId: this.queryUserServerId(userId), roomType: roomType};
		}

		var _status = _teamObj.onAddPlayer(_data);
		if (_status === 200) {
			return callback(null, {teamId: _teamObj.teamId});
		} else {
			console.log('join team=================>>', _status);
			return callback(201);
		}		
	} else {
		var _teamId = this.createTeam(userId, roomType);
		if (_teamId != 0) {
			callback(null, {teamId: _teamId});
		} else {
			console.log('join team=================>>', _teamId);
			callback(201);
		}
	}
}

/**
* leave team
* @param: 
*/
handler.leaveTeam = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	if (!!_teamObj) {
		var _teamId = _teamObj.teamId;
		delete this.uidMap[userId];
		delete this.teamMap[userId];
		delete this.teamObjMap[_teamId];
		var _status = _teamObj.onRemovePlayer({userId: userId, serviceId: this.queryUserServerId(userId)});
		if (_status === 200) {
			return callback(null, 'ok');
		} else {
			return callback(201);
		}		
	} else {
		return callback(201);
	}

}

/**
* 查询队友信息
* @param: 
*/
handler.queryTeammateInfo = function(userId, teammate, callback){	
	var _teamObj = queryUserTeamObj(this, userId);
	if (!!_teamObj && !!_teamObj.getTeammatesBasic({userId: teammate})) {
		callback(null, {});
	} else {
		callback(201);
	}
}

/**
* 
* @param: userId, amount
*/
handler.bet = function(userId, amount, type, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	var _player = queryUserRecord(this, userId);
	if (!_teamObj || !_player) {
		return callback(201);
	}

	if (_player.gold < amount) {
		return callback(201);
	}

	updateUserAccount(this, type, userId, amount, function(error, res){
		if (!error) {
			var _ret = _teamObj.onBetHand({userId: userId, amount: amount, type: type});
			if (!!_ret) {
				return callback(null, 'ok');
			} else {
				return callback(201);
			}
		} else {
			return callback(201);
		}
	})
}

/**
* 
* @param: 
*/
handler.checkHand = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	if (!!_teamObj) {
		var _hand = _teamObj.onCheckSelfHand(userId, callback);
		if (!!_hand) {
			return callback(null, _hand);
		} else {
			return callback(201)
		}
	} else {
		return callback(201);
	}
}

/**
* 
* @param: 
*/
handler.compareHand = function(userId, teammate, callback){
	var _teamObj = queryUserTeamObj(this, userId);
	if (!_teamObj) {
		return callback(201);
	} 

	if (!_teamObj.getTeammatesBasic({userId: teammate})){
		return callback(202);
	}

	var _ret = _teamObj.onCompareHand({userId: userId, teammate: teammate}, function(error, res){
		if (!error) {
			return callback(error, {status: res.status, active: res.number});
		} else {
			return callback(203);
		}
	});
	if (_ret != null) {
		return callback(null, {win: 1});
	} else {
		return callback(null, {win: 0});
	}
}

/**
* 
* @param: 
*/
handler.abandonHand = function(userId, callback){
	var _teamObj = queryUserTeamObj(this, userId);
	if (!_teamObj) {
		return callback(201);
	}

	var _ret = _teamObj.onAbandonHand({userId: userId});
	if (_ret) {
		return callback(null);
	} else {
		return callback(201);
	}
}


handler.queryUserServerId = function(userId){
	console.log('===================>>>3232', userId);
	return getServerIdByUserId(userId.toString(), this.app);
}

var addUserRecord = function(service, userId, data){
	service.uidMap[userId] = data;
}

var queryUserRecord = function(service, userId){
	var _user = service.uidMap[userId];
	if (!!_user) {
		//callback(null, _user);
		return _user;
	} else {
		return null;
	}
}

var updateUserAccount = function(service, type, userId, amount, callback){
	var _player = service.uidMap[userId];
	if (!!_player) {
		if (type === Const.Account.BET_GOLD) {
			userDao.consumeAccountGold(userId, amount, function(error, res) {
				if (res.code === 200) {
					service.uidMap[userId]['gold'] -= amount;
					return callback(null, service.uidMap[userId]['gold']);
				} else {
					return callback(201);
				}
			})
		} else {
			return callback(201);
		}
	} else {
		return callback(201);
	}
}

var addTeamRecord = function(service, userId, data){

}

var queryUserTeamObj = function(service, userId) {
	var _teamId = this.teamMap[userId];
	if (!!_teamId) {
		var _teamObj = this.teamObjMap[_teamId];
		if (!!_teamObj) {
			return _teamObj;
		} else {
			return null;
		}
	} else {
		return null;
	}
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

