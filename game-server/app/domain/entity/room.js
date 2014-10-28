var channelUtil = require('../../util/channelUtil');
var Error = require('../../consts/code');

var MAX_MEMBER_NUM = 5

module.exports = Room;

function Room(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.playerArray = [];

}

var handler = Room.prototype;

handler.createChannel = function(){
	if(this.channel) {
		return this.channel;
	}
	var channelName = channelUtil.getTeamChannelName(this.teamId);
	this.channel = pomelo.app.get('channelService').getChannel(channelName, true);
	if(this.channel) {
		return this.channel;
	}

	return null;
}


handler.addPlayer = function(data){
	if (this.isRoomHasPosition()){
		var player = {};
		this.playerArray.push(player);
		return this.teamId;
	} 

	if (!data || typeof data !== 'object'){
		return Error.Room.DATA_ERR;
	}

	if (!this.isRoomHasPosition()){
		return Error.Room.ROOM_FULL;
	}

	if (this.isPlayerInRoom(data.uid)){
		return Error.Room.ALREADY_IN_ROOM;
	}

	var player = {uid: data.uid, vip: data.vip, hand: data.hand};
	this.playerArray.push(player);
	return Error.OK;

}

// is there a empty position in the team
handler.isRoomHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};

handler.isPlayerInRoom = function(uid){
	return true;
}

