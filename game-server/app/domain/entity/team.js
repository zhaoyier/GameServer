var logic = require('../logic/xxLogic');
var poker = require('../config/poker');
var channelUtil = require('../../util/channelUtil');

var Consts = require('../../consts/consts');
var Error = require('../../consts/code');

var MAX_MEMBER_NUM = 5

module.exports = Team;

function Team(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.playerArray = [];
	this.teamStatus = 0;		//是否锁定
	this.poker = poker.getXXPoker();
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


handler.addPlayer = function(param){
	if (this.isTeamHasPosition()){
		var player = {};
		this.playerArray.push(player);
		return this.teamId;
	} 

	if (!param || typeof param !== 'object'){
		return Error.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Error.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(param.uid)){
		return Error.Team.ALREADY_IN_TEAM;
	}

	var hand = logic.createHandCard(this.poker);
	if (!!hand && typeof(hand) === 'object'){
		var player = {uid: param.uid, hand: hand.cards, patterns: hand.pattern, status: Code.Card.BACK};
	} else {
		return null;
	}
	
	//var player = {uid: data.uid, vip: data.vip, hand: data.hand};
	//this.playerArray.push(player);
	//return Error.OK;

}

// is there a empty position in the team
handler.isTeamHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};

handler.isPlayerInTeam = function(uid){
	return true;
}

