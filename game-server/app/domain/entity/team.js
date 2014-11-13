/**
* 队伍信息直接在这里发送
*/

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
	this.teamChannel = null;
	this.poker = [];

	var _this = this;
	var init = function() {
		_this.teamId = teamId;
		_this.poker = poker.getXXPoker();
		_this.createChannel();
	}

	init();
}

var handler = Team.prototype;

Team.prototype.addPlayer = function(data){
	if (!data || typeof data !== 'object' || !data.userId){
		return Code.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Code.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(data.userId)){
		return Code.Team.ALREADY_IN_TEAM;
	}
	
	var hand = logic.createHandCard(this.poker);
	if (!!hand && typeof(hand) === 'object'){
		var player = {userId: data.userId, hand: hand.cards, patterns: hand.pattern, status: Code.Card.BACK};

		this.playerNum += 1;
		this.playerArray.push(player);
		return getAllTeammatesBasic(this.playerArray);
	} else {
		return null;
	}
}

Team.prototype.getTeammateHand = function(data){
	if (!data || typeof(data) !== 'object'){
		return Code.Team.DATA_ERR;
	}

	return getTeammateHand(data.userId, this.playerArray);
}

Team.prototype.getPlayerNum = function(){
	return this.playerNum;
}

Team.prototype.getTeammates = function(){
	return this.playerArray;
}

// is there a empty position in the team
Team.prototype.isTeamHasPosition = function() {
  return this.getPlayerNum() < MAX_MEMBER_NUM;
};

Team.prototype.isPlayerInTeam = function(userId){
	return false;
}



Team.prototype.createChannel = function(){
	if (this.teamChannel) {
		return this.teamChannel;
	}

	var channelName = channelUtil.getTeamChannelName(this.teamId);
	//this.teamChannel = pomelo.app.get('channelService').getChannel(channelName, true);
	if (this.teamChannel){
		return this.teamChannel;
	}

	return null;
}


/**
* @param: {userId, serverId}
*
*/
Team.prototype.addPlayer2Channel = function(data){
	if (!this.teamChannel){
		return false;
	}

	if (data) {
		this.teamChannel.add(data.userId, data.serverId);
		 return true;
	}

	return false;
}

/**
* 
* @param: {userId, serverId}
* 
*/
Team.prototype.removePlayerFromChannel = function(data){
	if (!this.teamChannel){
		return false;
	}

	if (data) {
		this.teamChannel.leave(data.userId, data.serverId);
		return true;
	}
	return false;
}

/**
* 
* @param: {userId, serverId}
* 
*/
Team.prototype.pushLeaveMsg2All = function(userId){
	var ret = {result: Code.OK};
	if (!this.teamChannel){
		cb(null, ret);
	}

	var msg = {userId: userId};
	this.teamChannel.pushMessage('onTeammateLeave', msg, function(error, _){
		cb(null, ret);
	})
}

Team.prototype.pushChatMsg2All = function(data){
	if (!this.teamChannel){
		return false;
	}

	var userId = data.userId;
	if (!this.isPlayerInTeam(userId)) {
		return false;
	}

	this.teamChannel.pushMessage('onChat', data, null);
}

Team.prototype.pushDynamicMsg2All = function(data){
	if (!this.teamChannel) {
		return false;
	}


	this.teamChannel.pushMessage('onDynamicMsg', data, null);
}

function getAllTeammatesBasic(teammates){
	var _teammatersIDS = [];
	for (var i=0; i<teammates.length; ++i){
		_teammatersIDS.push({userId: teammates[i].userId, status: teammates[i].status});
	}

	return _teammatersIDS;
}

function getTeammateHand(userId, teammates){
	for (var i=0; i<teammates.length; ++i){
		if (teammates[i].userId === userId){
			return teammates[i].hand;
		}
	}

	return null;
}

function getTeammateStatus(userId, teammates){
	for (var i=0; i<teammates.length; ++i){
		if (teammates[i].userId === userId){
			return teammates[i].status;
		}
	}

	return null;
}

