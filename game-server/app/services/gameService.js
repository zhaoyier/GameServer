var Code = require('../../../shared/code');
var Team = require('../domain/entity/room');
var logger = require('pomelo-logger').getLogger('gameservice', __filename);

var GameService = function(app) {
	this.app = app;
	this.uidMap = {};
	this.roomMap = {};
	this.roomObjMap = {};
}

module.exports = GameService;
var roomId = 0;
var handler = GameService.prototype;

handler.add = function(uid, roomId){
	var sid = getSidByUid(uid, this.app);
	if (!sid){
		return Code.FA_UNKNOWN_CONNECTOR;
	}
	
	if (checkDuplicate(this, uid)){
		return Code.OK;
	}

	addRecord(this, uid, roomId);
	return Code.OK;
}

handler.leave = function(uid){
	var record = this.uidMap[uid];
	if (record && !!this.roomMap[record.roomId]){
		delete this.uidMap[uid];
		for (var i=0; i<this.roomMap[record.roomId].length; ++i){
			if (this.roomMap[record.roomId][i]['uid'] === uid){
				this.roomMap[record.roomId].splice(i, 1);
			}
		}
	} else {
		log('leave', {uid: uid});
	}
}

handler.kick = function(uid, roomId){
	delete this.uidMap[uid];
	if (!!this.roomMap[roomId]){
		for (var i=0; i<this.roomMap[roomId].length; ++i){
			if (this.roomMap[roomId][i]['uid'] === uid){
				this.roomMap[roomId].splice(i, 1);
			}
		}
	} else {
		log('kick', {uid: uid});
	}
	return Code.Ok;
}

handler.selectRoom = function(uid){
	var isSelect = false;
	for (var roomId in roomObjMap){
		if (roomObjMap[roomId].isRoomHasPosition()){
			isSelect = true;
			return roomObjMap[roomId];
		}
	}

	if (!isSelect){
		var roomObj = createRoom(uid);
		return roomObj;
	}
}


handler.createRoom = function(uid){
	var roomObj = new Room(++roomId);
	var res = roomObj.addPlayer(uid);
	this.roomObjMap[roomObj.roomId] = roomObj;

}



handler.pushMessageToPlayer = function(){
	
}

handler.pushMessageToRoom = function(fun, roomId){
	
}


var checkDuplicate = function(service, uid, roomId) {
	return !!service.uidMap[uid];
};

var addRecord = function(service, uid, roomId, sid){
	var record = {uid: uid, roomId: roomId, sid: sid};
	service.uidMap[uid] = record;

	var players = roomMap[roomId] ? roomMap[roomId] : [];
	players.push({uid: uid, sid: sid});
	roomMap[roomId] = players;
}

var log = function(fun, msg){
	var timestamp = new Date();
	logger.error(timestamp+':'+fun+':'+msg);
}

/**
* Get the connector server id assosiated with the uid
**/
var getSidByUid = function(uid, app) {
  var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
  if(connector) {
    return connector.id;
  }
  return null;
};
