/**
* 队伍信息直接在这里发送
*/
var pomelo = require('pomelo');
var later = require('later');

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
	this.playerUids = [];
	this.playerArray = {};
	this.teamStatus = 0;		//是否锁定
	this.teamChannel = null;
	this.poker = [];
	this.isStart = false;

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
	if (!data || typeof data !== 'object' || !data.userId || !data.serviceId){
		return Code.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Code.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(data.userId)) {
		return Code.Team.ALREADY_IN_TEAM;
	}

	if (!this.doAddPlayer(this, data)){
		return Code.Team.SYS_ERROR;
	}

	if (!this.isPlayerInTeam(data.userId)){
		return Code.Team.SYS_ERROR;
	}

	if (!this.addPlayer2Channel(data)){
		return Code.Team.SYS_ERROR;
	}

	if (this.playerNum < MAX_MEMBER_NUM) {
		this.playerNum++;
	}

	this.updateTeamInfo();

	return Code.OK;
}

Team.prototype.doAddPlayer = function(teamObj, data){
	var _hand = logic.createHandCard(teamObj.poker);
	if (!!hand && typeof(hand) === 'object'){
		/*{username, vip, diamond, gold, serviceId}*/
		teamObj.playerArray[data.userId] = {serviceId: data.serviceId, hand: _hand.cards, pattern: _hand.pattern, status: Code.Card.BACK, 
			username: data.username, vip: data.vip, diamond: data.diamond, gold};
		return true;
	} else {
		return false;
	}
}

Team.prototype.updateTeamInfo = function(){
	var userObjDict = {};
	var users = this.playerArray;
	for (var i in users){
		var userId = users[i].userId;
		if (userId === 0) {
			continue;
		}

		userObjDict[userId] = {status: users[i].status};
	}

	if (Object.keys(userObjDict).length > 0) {
		//this.teamChannel.pushMessage('onUpdateTeam', userObjDict);
		this.teamChannel.pushMessageByUids('onUpdateTeam', userObjDict, this.playerUids);
		if (this.playerNum >= 2 && this.isStart === false) {
			setTimeout(function(){
				this.startGame();
			}, 1000);
		}
	}
}

Team.prototype.getTeammatesBasic = function(data){
	if (!data || typeof(data) != 'object') {
		return null;
	} else {
		var _player = this.playerArray[data.userId];
		if (!!_player) {
			return _player;
		} else {
			return null;
		}
	}
}

Team.prototype.startGame = function(this){
	if (this.playerNum > 2 && this.isStart === false) {
		var _sched = later.parse.recur().every(3).second();
		var _timeObj = later.setInterval(function(){
			this.startGame = true;
			this.teamChannel.pushMessage('onStartGame', {});
			_timeObj.clear();
		}, _sched);
	}
}

Team.prototype.restartGame = function() {
	this.isStart = false;
	this.poker = poker.getXXPoker();
	for (var i in this.playerArray) {
		var _hand = logic.createHandCard(this.poker);
		this.playerArray[i]['hand'] = _hand.cards;
		this.playerArray[i]['pattern'] = _hand.pattern;
	}
	setTimeout(function(){
		this.startGame();
	}, 1000);
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
	var _player = this.playerArray[userId];
	if (!!_player) {
		return true;
	} else {
		return false;
	}
}



Team.prototype.createChannel = function(){
	if (this.teamChannel) {
		return this.teamChannel;
	}

	var channelName = channelUtil.getTeamChannelName(this.teamId);
	//this.teamChannel = pomelo.app.get('channelService').getChannel(channelName, true);
	this.teamChannel = pomelo.app.get('channelService');
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
		//var res = this.teamChannel.add(data.userId, data.serverId);
		this.playerUids.push({uid:data.userId, sid:data.serviceId});
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
	this.teamChannel.pushMessage('onTeammateLeave', msg, function(error, res){
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

/**
* 
* @param: {type, userId, amount}
*/
Team.prototype.pushTeamMsg2All = function(data){
	if (!this.teamChannel) {
		return false;
	}

	var _param = {type: data.type, userId: data.userId, amount: data.amount};
	// if (data.type === ) {

	// } else if (data.type === ) {

	// } else if ()

	this.teamChannel.pushMessage('onTeamMsg', _param, null);
	return true;
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

