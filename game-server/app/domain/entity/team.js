/**
* 队伍信息直接在这里发送
*/
var pomelo = require('pomelo');
var later = require('later');


var poker = require('../config/poker');
var Logic = require('../logic/xxLogic');
var channelUtil = require('../../util/channelUtil');

var Consts = require('../../consts/consts');
var Code = require('../../consts/code');

/*
* @function: onTeamMsg
*
*/

var MAX_MEMBER_NUM = 5

module.exports = Team;

function Team(teamId){
	this.teamId = 0;
	this.playerNum = 0;
	this.playerUids = [];
	this.playerSerial = {};
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


/**
* 
* @param: 
*/
Team.prototype.onAddPlayer = function(data){
	console.log('+++++++++++++>>>', data, !data, !data.userId, !data.serviceId)	
	if (!data || !data.userId || !data.serviceId){
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

	this.doUpdateTeamInfo();

	return Code.OK;
}

/**
* 
* @param: 
*/
Team.prototype.onRemovePlayer = function(data) {
	if (!data || !data.userId || !data.serviceId) {
		return 201;
	}

	var _player = this.playerArray[data.userId];
	if (!!_player) {
		if (this.playerNum >= 1) {
			this.playerNum--;
		} else {
			this.playerNum = 0;
		}

		pushLeaveMsg2All(data.userId, data.serviceId);

		delete this.playerArray[data.userId];

	} else {
		return 201;
	}
}

/**
* 
* @param: {userId}
*/
Team.prototype.onCheckSelfHand = function(data) {
	if (!data || !data.userId) {
		return null;
	}

	var _player = this.playerArray[data.userId];
	if (!!_player) {
		_player['status'] = Code.Card.BACK;
		this.pushTeamMsg2All(Const.TeamMsg.CHECK_HAND, data.userId, 0);
		return {hand: _player.hand, pattern: _player.pattern};
	} else {
		return null;
	}
}

/**
*
* @param: {userId, amount}
*/
Team.prototype.onBet = function(data) {
	if (!data || !data.userId) {
		return false;
	}

	var _player = this.playerArray[data.userId];
	if (!!_player) {
		if (_player.status != Code.Code.ABANDON) {
			var _status = (!!_player.status) ? Const.TeamMsg.CHECK_BET : Const.TeamMsg.BACK_BET;
			this.pushTeamMsg2All(_status, data.userId, data.amount);
			return true;
		}
	}

	return false;
}

/**
*
* @param: 
*/
Team.prototype.onCompareHand = function(data){
	var _self = this.playerArray[data.userId];
	var _teammate = this.playerArray[data.teammate];
	if (!!_self && !!_teammate) {
		var _ret = Logic.getCompareSize({cards: _self.hand, pattern: _self.pattern}, {cards: _teammate.hand, pattern: _teammate.pattern}, true);
		this.pushTeamMsg2All(Const.TeamMsg.COMPARE_HAND, data.userId, {userId:data.teammate, win: (!!_ret ? 1: 0)});
		return !!_ret ? false : true;
	} else {
		return null;
	}		
}

/**
*
* @param: 
*/
Team.prototype.doAddPlayer = function(teamObj, data){
	var _hand = Logic.createHandCard(teamObj.poker);
	if (!!_hand && typeof(_hand) === 'object'){
		console.log('hand11--------->>', _hand, !!_hand, typeof(_hand));
		/*{username, vip, diamond, gold, serviceId}*/
		teamObj.playerArray[data.userId] = {serviceId: data.serviceId, hand: _hand.cards, pattern: _hand.pattern, status: Code.Card.BACK, 
			username: data.username, vip: data.vip, diamond: data.diamond, gold: data.gold};
		return true;
	} else {
		return false;
	}
}

Team.prototype.doUpdateTeamInfo = function(){
	var userObjDict = {};
	var users = this.playerArray;
	for (var i in users){
		if (i === 0) {
			continue;
		}

		userObjDict[i] = {status: users[i].status};
	}

	if (Object.keys(userObjDict).length > 0) {
		this.teamChannel.pushMessage('onUpdateTeam', userObjDict);
		//this.teamChannel.pushMessageByUids('onUpdateTeam', userObjDict, this.playerUids);
		/*if (this.playerNum >= 2 && this.isStart === false) {
			setTimeout(function(){
				this.startGame();
			}, 1000);
		}*/
	}
}

/**
* 
* @param:
*/
Team.prototype.compareHand = function(data) {

}

/**
* 
* @param: 
*/
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

Team.prototype.startGame = function(){
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
		var _hand = Logic.createHandCard(this.poker);
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
	this.teamChannel = pomelo.app.get('channelService').getChannel(channelName, true);
	//this.teamChannel = pomelo.app.get('channelService');
	if (this.teamChannel){
		return this.teamChannel;
	}

	return null;
}


/**
* @param: {userId, serviceId}
*
*/
Team.prototype.addPlayer2Channel = function(data){
	if (!this.teamChannel){
		return false;
	}

	if (data) {
		var res = this.teamChannel.add(data.userId, data.serviceId);
		//this.playerUids.push({uid:data.userId, sid:data.serviceId});
		return true;
	}

	return false;
}

/**
* 
* @param: {userId, serviceId}
* 
*/
/*Team.prototype.removePlayerFromChannel = function(data){
	if (!this.teamChannel){
		return false;
	}

	if (data) {
		this.teamChannel.leave(data.userId, data.serviceId);
		return true;
	}
	return false;
}*/

/**
* 
* @param: {userId, serviceId}
* 
*/
Team.prototype.pushLeaveMsg2All = function(userId, serviceId){
	if (!userId || !serviceId) {
		return false;
	}

	if (!this.teamChannel){
		return false;
	}

	var _param = {userId: userId};
	this.teamChannel.pushMessage('onTeammateLeave', _param, function(error, res){
		this.teamChannel.leave(userId, serviceId);
		return true;
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
Team.prototype.pushTeamMsg2All = function(type, userId, amount){
	if (!this.teamChannel) {
		return false;
	}

	var _param = {type: type, userId: userId, amount: amount};
	 if (data.type === Const.TeamMsg.COMPARE_HAND) {

	 } else {
	 	_param = {type: type, userId:userId}
	 }

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

function getPlayerSerial(playerSerial){
	if (!playerSerial || playerSerial.length >= MAX_MEMBER_NUM){
		return MAX_MEMBER_NUM;
	}

	for (var i=0; i<MAX_MEMBER_NUM; ++i) {
		var _player = playerSerial[i];
		if (!_player) {
			return i;
		}
	}
}

