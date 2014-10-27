var channelUtil = require('../../util/channelUtil');

var MAX_MEMBER_NUM = 5

module.exports = Room;

function Room(teamId){
	this.teamId = 0;
	this.playerNum = 0;
}

Room.prototype.createChannel = function(){
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


Room.prototype.addPlayer = function(data){

}

// is there a empty position in the team
Room.prototype.isRoomHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};
