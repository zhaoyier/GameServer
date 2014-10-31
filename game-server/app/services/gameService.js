var Code = require('../../../shared/code');
var Team = require('../domain/entity/team');
var Error = require('../consts/code');
var logger = require('pomelo-logger').getLogger('gameservice', __filename);

var GameService = function(app) {
	this.app = app;
	this.uidMap = {};
	this.teamMap = {};
	this.teamObjMap = {};
}

module.exports = GameService;
var teamId = 0;
var handler = GameService.prototype;

handler.add = function(uid, teamId){
	var sid = getSidByUid(uid, this.app);
	if (!sid){
		return Code.FA_UNKNOWN_CONNECTOR;
	}
	
	if (checkDuplicate(this, uid)){
		return Code.OK;
	}

	addRecord(this, uid, teamId);
	return Code.OK;
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

handler.joinTeam = function(uid){
	
}


handler.createTeam = function(uid){
	var teamObj = new Team(++teamId);
	var res = teamObj.addPlayer(uid);
	if (Error.OK){
		this.teamObjMap[teamObj.teamId] = teamObj;	
	} else {
		return null;
	}
	
}



handler.pushMessageToPlayer = function(){
	
}

handler.pushMessageToTeam = function(fun, teamId){
	
}


var checkDuplicate = function(service, uid, teamId) {
	return !!service.uidMap[uid];
};

var addRecord = function(service, uid, teamId, sid){
	var record = {uid: uid, teamId: teamId, sid: sid};
	service.uidMap[uid] = record;

	var players = teamMap[teamId] ? teamMap[teamId] : [];
	players.push({uid: uid, sid: sid});
	teamMap[teamId] = players;
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
