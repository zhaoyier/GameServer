var Code = require('../../../shared/code');

var GameService = function(app) {
	this.app = app;
	this.uidMap = {};
	this.roomMap = {};
}

module.exports = GameService;
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

handler.kick = function(uid, roomId){
	delete this.service.uidMap[uid];
	if (!!this.roomMap[roomId]){
		for (var i=0; i<this.roomMap[roomId].length; ++i){
			if (this.roomMap[roomId][i]['uid'] === uid){
				this.roomMap[roomId].splice(i, 1);
			}
		}
	}
	return Code.Ok;
}

handler.pushMessageToPlayer = function(){
	
}

handler.pushMessageToRoom = function(func, roomId, ){
	
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
