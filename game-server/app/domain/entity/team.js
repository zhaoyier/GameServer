var channelUtil = require('../../util/channelUtil');
var Error = require('../../consts/code');

var MAX_MEMBER_NUM = 5

module.exports = Team;

function Team(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.playerArray = [];

}

var handler = Team.prototype;

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

handler.createChannel = function() {
  if(this.channel) {
    return this.channel;
  }
  var channelName = channelUtil.getTeamChannelName(this.teamId);
  this.channel = pomelo.app.get('channelService').getChannel(channelName, true);
  if(this.channel) {
    return this.channel;
  }
  return null;
};


handler.addPlayer = function(data){
	if (this.isTeamHasPosition()){
		var player = {};
		this.playerArray.push(player);
		return this.teamId;
	} 

	if (!data || typeof data !== 'object'){
		return Error.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Error.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(data.uid)){
		return Error.Team.ALREADY_IN_TEAM;
	}

	var player = {uid: data.uid, vip: data.vip, hand: data.hand};
	this.playerArray.push(player);
	return Error.OK;

}

// is there a empty position in the team
handler.isTeamHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};

handler.isPlayerInTeam = function(uid){
	return true;
}

