/**
* 队伍信息直接在这里发送
*/
var pomelo = require('pomelo');
var later = require('later');
var async = require('async');


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
	this.startTime = 0;
	this.playerNum = 0;
	this.activeNum = 0;
	this.playerUids = [];
	this.playerSeat = {};
	this.playerArray = {};
	this.teamStatus = 0;		//是否锁定
	this.teamChannel = null;
	this.poker = [];
	this.isOnGame = false;

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
Team.prototype.onAddPlayer = function(param){
	if (!param || !param.userId || !param.serviceId){
		return Code.Team.DATA_ERR;
	}

	if (!this.isTeamHasPosition()){
		return Code.Team.TEAM_FULL;
	}

	if (this.isPlayerInTeam(param.userId)) {
		return Code.Team.ALREADY_IN_TEAM;
	}

	if (!this.doAddPlayer(this, param)){
		return Code.Team.SYS_ERROR;
	}

	if (!this.isPlayerInTeam(param.userId)){
		return Code.Team.SYS_ERROR;
	}

	if (!this.addPlayer2Channel(param)){
		return Code.Team.SYS_ERROR;
	}

	if (this.playerNum < MAX_MEMBER_NUM) {
		this.playerNum++;
	}

	this.doUpdateTeamInfo(param.userId);

	return Code.OK;
}

/**
* 
* @param: 
*/
Team.prototype.onRemovePlayer = function(param) {
	if (!param || !param.userId || !param.serviceId) {
		return 201;
	}

	var _player = this.playerArray[param.userId];
	if (!!_player) {
		if (this.playerNum >= 1) {
			this.playerNum -= 1;
			this.activeNum -= 1;
		} else {
			this.playerNum = 0;
		}

		delete this.playerArray[param.userId];
		pushLeaveMsg2All(param.userId, param.serviceId);
	} else {
		return 201;
	}
}

/**
* 
* @param: {userId}
*/
Team.prototype.onCheckSelfHand = function(param) {
	if (!param || !param.userId) {
		return null;
	}

	var _player = this.playerArray[param.userId];
	if (!!_player) {
		_player['status'] = Code.Card.BACK;
		this.pushHandStatusMsg2All(param.userId, 0);
		return {hand: _player.hand, pattern: _player.pattern};
	} else {
		return null;
	}
}

/**
* function: 处理押注
* @param: {userId, amount, type}
*/
Team.prototype.onBetHand = function(param) {
	if (!param || !param.userId) {
		return false;
	}

	var _player = this.playerArray[param.userId];
	if (!!_player) {
		if (_player.status != Code.Code.ABANDON) {
			var _status = (!!_player.status) ? Const.TeamMsg.CHECK_BET : Const.TeamMsg.BACK_BET;
			this.pushBetHandMsg2All(param.userId, param.type, param.amount);
			return true;
		}
	}

	return false;
}

/**
* 
* @param: 
*/
Team.prototype.onCompareHand = function(param, callback){
	var _self = this.playerArray[param.userId];
	var _teammate = this.playerArray[param.teammate];
	if (!!_self && !!_teammate) {
		var _ret = Logic.getCompareSize({cards: _self.hand, pattern: _self.pattern}, {cards: _teammate.hand, pattern: _teammate.pattern}, true);
		this.pushCompareHandMsg2All(param.userId, param.teammate, _ret, function(error, res){
			callback(null, {status: _ret, number: this.activeNum});
		});		
	} else {
		callback(203);
	}		
}

/**
* 
* @param:
*/
Team.prototype.onAbandonHand = function(param){
	var _self = this.playerArray[param.userId];
	if (!!_self) {
		this.activeNum -= 1;
		_self.status = Conde.Card.ABANDON;
		var _ret = this.pushHandStatusMsg2All(param.userId, 1);
		return _ret;
	} else {
		return false;
	}	
}

/**
*
* @param: 
*/
Team.prototype.doAddPlayer = function(teamObj, param){
	var _playerSeat = getPlayerSeat(this.playerSeat);
	var _hand = Logic.createHandCard(teamObj.poker);
	if (!!_hand && typeof(_hand) === 'object'){
		/*{username, vip, diamond, gold, serviceId}*/
		this.playerSeat[_playerSeat] = param.userId;
		teamObj.playerArray[param.userId] = {serviceId: param.serviceId, hand: _hand.cards, pattern: _hand.pattern, status: Code.Card.BACK, 
			username: param.username, vip: param.vip, diamond: param.diamond, gold: param.gold, seat: _playerSeat};
		return true;
	} else {
		return false;
	}
}


Team.prototype.doUpdateTeamInfo = function(userId){
	var userObjDict = {};
	var users = this.playerArray;
	for (var i in users){
		if (i != 0) {
			user = users[i];
			userObjDict[i] = {userId: i, status: user.status, username: user.username, vip: user.vip, diamond: user.diamond, gold: user.gold, seat: user.seat};
		}
	}

	if (Object.keys(userObjDict).length > 0) {
		this.teamChannel.pushMessage('onAddPlayerMsg', userObjDict);
		//setTimeout(function(){
		//this.startGame();
		//}, 1000);
	}
}

/**
* 
* @param: 
*/
Team.prototype.getTeammatesBasic = function(param){
	if (!param || typeof(param) != 'object') {
		return null;
	} else {
		var _player = this.playerArray[param.userId];
		if (!!_player) {
			return _player;
		} else {
			return null;
		}
	}
}

/**
* function: 
* @param: 
* 
*/
/*function startGame(_gameService){
	console.log('========>>>1111', _gameService.startTime, _gameService.playerNum, _gameService.isOnGame);
	var now = Date.now();
	if (_gameService.startTime === 0) {
		//第一次开始游戏
		if (_gameService.playerNum >= 2 && _gameService.isOnGame === false) {
			setTimeout(function(){
				_gameService.isOnGame = true;
				_gameServic.activeNum = _gameService.playerNum;
				_gameServic.teamChannel.pushMessage('onStartGameMsg', {});
			}, 1000);
		}
	} else {
		var _sched = later.parse.recur().every(5).second();
		var _timeObj = later.setInterval(function(){
			var _timeDiff = Date.now()-_gameService.startTime;
			if (_timeDiff >= 4000 && _gameService.playerNum >= 2 && _gameService.isOnGame === false) {
				_timeObj.clear();
				_gameService.isOnGame = true;
				_gameService.activeNum = _gameService.playerNum;
				_gameService.teamChannel.pushMessage('onStartGameMsg', {});
			}
		}, _sched);
	}
}*/

Team.prototype.startGame = function(param, callback){
	console.log('============================>>>startTime:\t', this.startTime, '//', this.isOnGame);
	if (this.startTime === 0) {
		if (this.playerNum >= 1 && this.isOnGame === false) {
			this.isOnGame = true;
			this.activeNum = this.playerNum;
			this.teamChannel.pushMessage('onStartGameMsg', {name: 'zhao'}, callback);
		}
	} else {
		var _timeDiff = Date.now()-this.startTime;
		if (_timeDiff >= 4000 && this.playerNum >= 2 && this.isOnGame === false) {
			//console.log('user request start game ======>>>', param.userId);
			this.isOnGame = true;
			this.activeNum = this.playerNum;
			this.teamChannel.pushMessage('onStartGameMsg', {name: 'zhao'}, callback);
		}
	}	
}

Team.prototype.restartGame = function(param, callback){
	this.isOnGame = false;
	this.poker = poker.getXXPoker();
	for (var i in this.playerArray) {
		var _hand = Logic.createHandCard(this.poker);
		this.playerArray[i]['hand'] = _hand.cards;
		this.playerArray[i]['pattern'] = _hand.pattern;
	}

	this.startGame(param, callback);
}

Team.prototype.getTeammateHand = function(param){
	if (!param || typeof(param) !== 'object'){
		return Code.Team.DATA_ERR;
	}

	return getTeammateHand(param.userId, this.playerArray);
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
Team.prototype.addPlayer2Channel = function(param){
	if (!this.teamChannel){
		return false;
	}

	if (param) {
		var res = this.teamChannel.add(param.userId, param.serviceId);
		this.playerUids.push({uid:param.userId, sid:param.serviceId});
		return true;
	}

	return false;
}

/**
* 
* @param: {userId, serviceId}
* 
*/
Team.prototype.removePlayerFromChannel = function(param){
	if (!this.teamChannel){
		return false;
	}

	if (param) {
		this.teamChannel.leave(param.userId, param.serviceId);
		return true;
	}
	return false;
}

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

Team.prototype.pushChatMsg2All = function(param){
	if (!this.teamChannel){
		return false;
	}

	var userId = param.userId;
	if (!this.isPlayerInTeam(userId)) {
		return false;
	}

	this.teamChannel.pushMessage('onChat', param, null);
}

/**
* 通知卡牌信息
* @param: {type, userId, amount}
*/
Team.prototype.pushTeamMsg2All = function(type, userId, amount){
	if (!this.teamChannel) {
		return false;
	}

	var _param = {type: type, userId: userId, amount: amount};
	 if (param.type === Const.TeamMsg.COMPARE_HAND) {

	 } else {
	 	_param = {type: type, userId:userId}
	 }

	this.teamChannel.pushMessage('onTeamMsg', _param, null);
	return true;
}

/**
* 通知卡牌状态信息
* @param: {type, userId, amount}
*/
Team.prototype.pushHandStatusMsg2All = function(_userId, _status){
	if (!this.teamChannel) {
		return false;
	}

	var _msg = {userId: _userId, status: _status};

	this.teamChannel.pushMessage('onNoticeHandMsg', _msg);
	return true;
}


/**
* 通知押注信息
* @param: {type, userId, amount}
*/
Team.prototype.pushBetHandMsg2All = function(_userId, _type, _amount){
	if (!this.teamChannel) {
		return false;
	}

	var _msg = {userId: _userId, type: _type, amount: _amount}

	this.teamChannel.pushMessage('onBetHandMsg', _msg);
	return true;
}

/**
* 通知比较卡牌信息
* @param: {type, userId, amount}
*/
Team.prototype.pushCompareHandMsg2All = function(_initiative, _passivity, _status, callback){
	if (!this.teamChannel) {
		return false;
	}

	var _msg = {initiative: _initiative, passivity: _passivity, status: _status};
	this.teamChannel.pushMessage('onCompareHandMsg', _msg, callback);
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

function getPlayerSeat(playerSeat){
	if (!playerSeat || playerSeat.length >= MAX_MEMBER_NUM){
		return MAX_MEMBER_NUM;
	}

	for (var i=0; i<MAX_MEMBER_NUM; ++i) {
		var _player = playerSeat[i];
		if (!_player) {
			return i;
		}
	}
}

