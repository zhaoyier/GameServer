/**
* 队伍信息直接在这里发送
*/
var pomelo = require('pomelo');
var later = require('later');
var async = require('async');


var poker = require('../config/poker');
var Logic = require('../logic/xxLogic');
var channelUtil = require('../../util/channelUtil');

var Consts = require('../../config/consts');
var Code = require('../../config/code');

/*
* @function: onTeamMsg
*
*/

var MAX_MEMBER_NUM = 5

module.exports = Team;

function Team(teamId, teamType){
	this.teamId = 0;
	this.teamType = 0;
	this.teamWinner = 0;
	this.playerNum = 0;
	this.activeNum = [];
	this.playerSeat = {};
	this.playerArray = {};
	this.teamStatus = 0;		//是否锁定
	this.teamChannel = null;
	this.poker = [];
	this.hasStartGame = false;
	this.lastGameTime = Date.now();
	
	var _this = this;
	var init = function() {
		_this.teamId = teamId;
		_this.teamType = teamType;
		_this.createChannel();
	}

	init();
}

var handler = Team.prototype;


/**
* @function: 新加 
* @param: 
*/
Team.prototype.onAddPlayer = function(param){
	var _self = this;
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

	if (!_self.doUpdateTeamInfo(param.userId)){
		return Code.Team.DATA_ERR;
	}

	return Code.OK;
}

/**
* 
* @param: 
*/
Team.prototype.onRemovePlayer = function(param) {
	if (!param || !param.userId || !param.serviceId) {
		return false;
	}

	var _player = this.playerArray[param.userId];
	if (!!_player) {
		if (this.playerNum > 1) {
			this.playerNum -= 1;
			removeInactivityPlayer(param.userId, this.activeNum);
			delete this.playerArray[param.userId];
		} 

		if (this.playerNum > 0) {
			pushLeaveMsg2All(param.userId, param.serviceId);
		}
		return true;
	}
	return false;
}

/**
* @function:  
* @param: {userId}
*/
Team.prototype.checkHand = function(param, callback) {
	if (!param || !param.userId) {
		return callback(201, 'ok');
	}

	var _player = this.playerArray[param.userId];
	if (!!_player) {
		_player['status'] = Code.Card.BACK;
		this.pushHandStatusMsg2All(param.userId, 0);
		return callback(null, {hand: _player.hand, pattern: _player.pattern});
	} else {
		return callback(201, 'ok');
	}
}

Team.prototype.queryTeammates = function(param, callback) {
	var _self = this;

	if (!param || !param.userId) {
		return callback(201);
	}

	var _teammates = {};
	for (var id in _self.playerArray) {
		if (id !== param.userId) {
			_teammates[id] = _self.playerArray[id];
		}
	}
	callback(null, {teammate: _teammates});
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
	var _self = this;
	var _selfInfo = _self.playerArray[param.selfId];
	var _teammateInfo = _self.playerArray[param.teammate];
	
	var _loser = 0, _winner, _compareRes = 0;
	async.series({
		checkUser: function(cb) {
			if (!_selfInfo || !_teammateInfo) {
				cb(201);
			} else {
				cb(null);
			}
		},
		checkCompare: function(cb) {
			_compareRes = Logic.getCompareSize({cards: _selfInfo.hand, pattern: _selfInfo.pattern}, {cards: _teammateInfo.hand, pattern: _teammateInfo.pattern}, true);
			if (_compareRes === -1) {
				cb(201);
			} else if (_compareRes === 0) {
				_loser = param.selfId; _winner = param.teammate; cb(null);
			} else {
				_loser = param.teammate;  _winner = param.selfId; cb(null);
			}
		},
		updateTeam: function(cb) {
			if (_loser === param.selfId) {
				_selfInfo.card = Code.Card.ABANDON;
				removeInactivityPlayer(param.selfId, this.activeNum);
			} else {
				_teammateInfo.card = Code.Card.ABANDON;
				removeInactivityPlayer(param.teammate, this.activeNum);
			}
			cb(null);
		},
		noticeTeam: function(cb) {
			if (!!_self.teamChannel) {
				//发起人和被动接受人
				var _data = {init: param.selfId, pass: param.teammate, res: _compareRes};
				this.teamChannel.pushMessage('onCompareHandMsg', _data, cb);
			} else {
				cb(201);
			}
		},
		noticeClear: function(cb) {
			if (_self.activeNum.length === 1) {
				var _data = getClearGame(_winner, _self.playerArray);
				setTimeout(function(){
					this.teamChannel.pushMessage('onClearHandMsg', _data, cb);
				}, 3000);	
			} else {
				cb(null);
			} 
		}
	}, function(error, doc) {
		if (error) {
			callback(201);
		} else {
			callback(null, {res: _compareRes, active: _self.activeNum.length});
		}
	})	
}

/**
* 
* @param:
*/
Team.prototype.onAbandonHand = function(param){
	var _self = this.playerArray[param.userId];
	if (!!_self) {
		removeInactivityPlayer(param.userId, this.activeNum);
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
	var _place = getPlayerSeat(this.playerSeat);

	this.playerSeat[_place] = param.userId;
	//var _user = teamObj.playerArray[param.userId];
	var _user = {};
	var _userId = param.userId;
	_user['userId'] = _userId;
	_user['serviceId'] = param.serviceId;
	_user['username'] = param.username;
	_user['vip'] = param.vip;
	_user['diamond'] = param.diamond;
	_user['gold'] = param.gold;
	_user['place'] = _place;	
	_user['avatar'] = !!param.avatar?param.avatar: '0';
	_user['card'] = Code.Card.BACK;
	_user['active'] = 0;
	_user['consume'] = 0;
	_user['base'] = getTeamBase(this.teamType);
	teamObj.playerArray[_userId] = _user;
	return true;
}


Team.prototype.doUpdateTeamInfo = function(userId){
	var _self = this;
	var _userInfo = _self.playerArray[userId];
	
	if (!_userInfo) {
		return false;
	}

	if (Object.keys(_self.playerArray).length > 1) {
		_self.teamChannel.pushMessage('onAddPlayerMsg', _userInfo);
	}	

	return true;
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

Team.prototype.checkTeamPlayer = function(param) {
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
 * @function: 准备开始
 * @param: 
 * **/
Team.prototype.prepareGame = function(param, callback) {
	var _userId = param.userId;
	if (!_userId) {
		return callback(201);
	}

	this.playerArray[_userId].active = true;
	return callback(null, 'ok');
}

/**
 * function: 判断开始条件/人数/时间/状态 
 * @param: 
 * **/
Team.prototype.startGame = function(param, callback){
	var _timeDiff = Date.now()-this.lastGameTime;

	if (_timeDiff <= 5000) {
		return callback(201);
	} else if (this.hasStartGame === true) {
		return callback(201);
	}else if (this.playerNum >= 2 && this.hasStartGame === false) {
		this.hasStartGame = true;
		this.poker = pokey.getXXPoker();
		for (var userId in this.playerArray) {
			if (this.playerArray[userId].active == true) {
				this.activeNum.push(userId);
				var _hand = Logic.createHandCard(this.poker);
				this.playerArray[userId]['hand'] = _hand.cards;
				this.playerArray[userId]['pattern'] = _hand.pattern;
			} else {
				this.playerArray[userId]['hand'] = [];
				this.playerArray[userId]['pattern'] = 0;
			}
		}
		this.teamChannel.pushMessage('onStartGameMsg', {}, callback);	
	} else {
		return callback(201);
	}
}

/**
 * @function: 计算加
 * @param: 
 * */
Team.prototype.getRaiseAmount = function(param, callback) {
	var _userId = param.userId;
	var _active = param.active;
	var _teamType = this.teamType;
	var _user = this.playerArray[_userId];	
	
	if (_teamType === 1) {
		var _amount = _user.base+100;
		callback(null, {roomType: _teamType, amount: _amount});
	} else {
		callback(201, 0);
	}
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

/**
 * @function: 判断活跃玩家数量是否等于二 
 * @param:
 * */
Team.prototype.checkAllBetPlayer = function(param, callback){
	var _allPlayers = this.playerArray;
	var _counter = 0, _activeUser;;

	for (var _id in _allPlayers) {
		if (_allPlayers[_id].active === 1) {
			if (_id != param.userId) _activeUser = _id;
			_counter += 1;
		}
	}

	if (_counter  === 2) {
		callback(null, {userId: _activeUser});
	} else {
		callback(201);
	}
}

Team.prototype.createChannel = function(){
	if (this.teamChannel) {
		return this.teamChannel;
	}

	var channelName = channelUtil.getTeamChannelName(this.teamId);
	this.teamChannel = pomelo.app.get('channelService').getChannel(channelName, true);
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
		//this.playerUids.push({uid:param.userId, sid:param.serviceId});
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

	var _msg = {win: _initiative, lose: _passivity, status: _status};
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

function getTeamBase(teamType) {
	return 100;
}

function getClearGame(winner, players) {
	return {win: winner};	
}

function removeInactivityPlayer(userId, activeArray) {
	for (var i=0; i<activeArray.length; ++i) {
		if (activeArray[i] === userId) {
			activeArray.splice(i, 1);	
		}
	}
}	
