var logic = require('../logic/xxLogic');
var poker = require('../config/poker');
var channelUtil = require('../../util/channelUtil');

var Consts = require('../../consts/consts');
var Code = require('../../consts/code');

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
	if (!param || typeof param !== 'object'){
		return Code.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Code.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(param.uid)){
		return Code.Team.ALREADY_IN_TEAM;
	}

	var hand = logic.createHandCard(this.poker);
	if (!!hand && typeof(hand) === 'object'){
		var player = {uid: param.uid, hand: hand.cards, patterns: hand.pattern, status: Code.Card.BACK};

		this.playerNum += 1;
		this.playerArray.push(player);

		return getAllTeammatesBasic(this.playerArray);
	} else {
		return null;
	}
}

handler.getTeammateHand = function(param){
	if (!param || typeof(param) !== 'object'){
		return Code.Team.DATA_ERR;
	}

	return getTeammateHand(param.uid, this.playerArray);
}

// is there a empty position in the team
handler.isTeamHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};

handler.isPlayerInTeam = function(uid){
	return true;
}

function getAllTeammatesBasic(teammates){
	var _teammatersIDS = [];
	for (var i=0; i<teammates.length; ++i){
		_teammatersIDS.push({uid: teammates[i].uid, status: teammates[i].status});
	}

	return _teammatersIDS;
}

function getTeammateHand(uid, teammates){
	for (var i=0; i<teammates.length; ++i){
		if (teammates[i].uid === uid){
			return teammates[i].hand;
		}
	}

	return null;
}

function getTeammateStatus(uid, teammates){
	for (var i=0; i<teammates.length; ++i){
		if (teammates[i].uid === uid){
			return teammates[i].status;
		}
	}

	return null;
}

