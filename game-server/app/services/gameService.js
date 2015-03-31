var underscore = require('underscore');
var async = require('async');
var later = require('later');


var Team = require('../domain/entity/team');
var Code = require('../config/code');
var Const = require('../config/consts');
var dispatcher = require('../util/dispatcher');

var userAccount = require('../dao/userAccount');
//var logger = require('pomelo-logger').getLogger('gameservice', __filename);

var GameService = function(app) {
	this.app = app;
	//this.app = null;
	this.uidMap = {};
	this.teamMap = {};
	this.teamObjMap = {};
}

module.exports = GameService;
var teamId = 0;
var handler = GameService.prototype;


/**
* 进入游戏，记录玩家信息
* @param: {}
*/
handler.enterGame = function(userId, data, callback){
	if (!!userId && !!data && typeof(callback) === 'function'){
		addUserRecord(this, userId, data);
		callback(null, {code: 200});
	} else {
		callback(null, {code: 201});
	}
}

/**
* 选择房间进入游戏
* @param: 
*/
handler.joinTeam = function(userId, roomType, callback){
	var _self = this;
	var _teamId = -1, _teamObj;
	async.series({
		query: function(cb) {
			for (var i in _self.teamObjMap) {
				if (this.teamObjMap[i].isTeamHasPosition()) {
					_teamId = i;
				}
			}
			cb(null);
		},
		create: function(cb) {
			if (_teamId === -1) {
				_teamObj = _self.createTeam(userId, roomType);			
			}
			cb(null);
		},
		join: function(cb) {
			if (_teamId != -1) {
				_teamObj = _self.teamObjMap[_teamId];
				var _data = {};
				var _user = queryUserRecord(_self, userId);
				if (!!_user) {
					_data = underscore.extend({}, {userId: userId, roomType: roomType}, _user);
				} else {
					_data = underscore.extend({}, {userId: userId, serviceId: _self.queryUserServiceId(userId), roomType: roomType});
				}
				
				var _status = _teamObj.onAddPlayer(_data);
				if (_status === 200) {
					_self.teamMap[userId] = _teamObj.teamId;
					_self.teamObjMap[_teamObj.teamId] = _teamObj;
				} 
			}
			cb(null);
		}
	}, function(error, doc) {
		if (!!_teamObj) {
			callback(null, {teamId: _teamObj.teamId, place: _teamObj.playerArray[userId].place});
		} else {
			callback(202);
		}
	})	
}

/**
* 创建房间
* @param: 
*/
handler.createTeam = function(userId, roomType) {
	var _self = this;
	var _teamObj = new Team(++teamId, roomType);
	var _data = {};
	
	var _user = queryUserRecord(_self, userId);
	if (!!_user) {
		_data = underscore.extend({}, {userId: userId, roomType: roomType}, _user);
	} else {
		_data = underscore.extend({}, {userId: userId, serviceId: _self.queryUserServiceId(userId), roomType: roomType})
	}

	var _status = _teamObj.onAddPlayer(_data);
	if (_status === 200) {
		_self.teamMap[userId] = _teamObj.teamId;
		_self.teamObjMap[_teamObj.teamId] = _teamObj;
		return _teamObj;
	} else {
		return null;
	}
}
/**
 * @function: 进入房间查询队友信息
 * @param
 * */
handler.queryTeammatesHand = function(userId, callback) {
	var _self = this;
	var _teamObj = queryUserTeamObj(_self, userId);
	
	if (!!_teamObj) {
		_teamObj.queryTeammates(userId, callback);
	} else {
		callback(201)
	}
}

handler.changeTeam = function(userId, roomType) {
	var _self = this;
	var _teamOldId = 0, _teamNewId = 0, _teamObj;

	async.series({
		queryTeam: function(cb) {
			_teamObj = queryUserTeamObj(this, userId);
			if (!!_teamObj) {
				_teamOldId = _teamObj.teamId;
				cb(null);
			} else {
				cb(201);
			}
		},
		queryId: function(cb) {
			for (var i in _self.teamObjMap) {
				if (_self.teamObjMap[i].isTeamHasPosition() && _teamOldId != _self.teamObjMap[i]) {
					_teamNewId = i;
				}
			}
			cb(null);
		},
		createTeam: function(cb) {
			if (_teamNewId === 0) {
				_teamObj = _self.createTeam(userId, roomType);
			}
			cb(null);
		},
		joinTeam: function(cb) {
			if (_teamNewId != 0) {
				_teamObj = _self.teamObjMap[_teamNewId];
				var _data = {};
				var _user = queryUserRecord(_self, userId);
				if (!!_user) {
					_data = underscore.extend({}, {userId: userId, roomType: roomType}, _user);
				} else {
					_data = underscore.extend({}, {userId: userId, serviceId: _self.queryUserServiceId(userId), roomType: roomType});
				}
				var _status = _teamObj.onAddPlayer(_data);
				if (_status === 200) {
					_self.teamMap[userId] = _teamObj.teamId;
					_self.teamObjMap[_teamObj.teamId] = _teamObj;
				}
			}
			cb(null);
		}
	}, function(error, doc) {
		if (!!_teamObj) {
			callback(null, {teamId: _teamObj.teamId, place: _teamObj.playerArray[userId].place});
		} else {
			callback(202);
		}
	})	
}

/**
* leave team
* @param: 
*/
handler.leaveTeam = function(userId, callback) {
	var _self = this;
	var _teamObj = queryUserTeamObj(_self, userId);
	if (!_teamObj) {
		return callback(201);
	}

	var _teamId = _teamObj.teamId;
	var _teamNum = _teamObj.getPlayerNum();
	
	delete _self.uidMap[userId];
	delete _self.teamMap[userId];	

	if (_teamNum === 1) {
		delete this.teamObjMap[_teamId];
	} else {
		var _status = _teamObj.onRemovePlayer({userId: userId, serviceId: _self.queryUserServiceId(userId)});
		if (_teamObj.onRemovePlayer({userId: userId, serviceId: _self.queryUserServiceId(userId)})) {
			return callback(null);
		} else {
			return callback(201);
		}
	}
}

/**
*  
* @param: 
*/
handler.startGame = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	if (!!_teamObj) {
		_teamObj.startGame({userId: userId}, function(error, res){
			callback(error, res);
		})
	} else {
		callback(201);
	}
}

/**
 * @function: 
 * @param: 
 * **/
handler.prepareGame = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	if (!!_teamObj) {
		_teamObj.prepareGame({userId: userId}, function(error, doc) {
			callback(error, doc);
		})
	} else {
		callback(201);
	}
}

/**
* 查询队友信息
* @param: 
*/
handler.queryTeammateInfo = function(userId, teammate, callback){	
	var _teamObj = queryUserTeamObj(this, userId);
	//if (!!_teamObj && !!_teamObj.getTeammatesBasic({userId: teammate})) {
		callback(null, {});
	//} else {
	//	callback(201);
	//}
}

/**
* 
* @param: userId, amount
*/
handler.betHand = function(userId, amount, type, channel, callback) {
	if (!userId || !amount || (typeof callback != 'function')) {
		return callback(201);
	}

	var _teamObj = queryUserTeamObj(this, userId);
	var _userBasic = queryUserRecord(this, userId);

	if (!_teamObj || !_userBasic) {
		return callback(202);
	}

	if (type === 0 && _userBasic.gold < amount) {
		return callback(203);
	}

	if (type === 1 && _userBasic.diamond < amount) {
		return callback(204);
	}

	var _amount = 0;
	async.series({
		consume: function(cb) {
			if (type === 0) {
				userAccount.consumeGold(userId, amount, channel, function(error, doc) {
					if (doc.code === 200) {
						_amount = doc.gold;
						cb(null, 'ok');
					} else {
						cb(205, 'ok');
					}
				})
			} else if (type === 1) {
				userAccount.consumeDiamond(userId, amount, channel, function(error, doc) {
					if (doc.code === 200) {
						_amount = doc.gold;
						cb(null, 'ok');
					} else {
						cb(206, 'ok');
					}
				})
			}
		},
		update: function(cb) {
			if (type === 0) {
				_teamObj.playerArray[userId].consume += amount;
				_teamObj.playerArray[userId].gold -= amount;
			} else if (type === 1) {
				_teamObj.playerArray[userId].consume += amount;
				_teamObj.playerArray[userId].diamond -= amount;
			}
			cb(null, 'ok');
		}
	}, function(error, doc) {
		if (error) {
			callback(null,  {amount: _amount});
		} else {
			callback(207);
		}
	})
}

/**
 * @function: 
 * @param:
 * */
handler.raiseHandler = function(userId, active, callback) {
	if (!userId || !active || (typeof(callback) != 'function')) {
		return callback(201, 'ok');
	}
	
	var _teamObj = queryUserTeamObj(this, userId);
	var _userBasic = queryUserRecord(this, userId);

	if (!_teamObj) {
		return callback(201, 'ok');
	}
	
	var _basic, _amount;
	async.series({
		calc: function(cb) {
			_teamObj.getRaiseAmount({userId: userId, active: active}, function(error, doc) {
				if (!error) _basic = doc;
				cb(error, 'ok');
			})
		},
		check: function(cb) {
			if (_basic.roomType === 0) {
				userAccount.consumeGold(userId, _basic.amount, 'aa', function(error, doc) {
					if (!error && doc.code == 200) _amount = doc.gold;
					cb(((doc.code==200)?null:doc.code), 'ok');			
				})			
			} else {
				userAccount.consumeDiamond(userId, _basic.amount, 'bb', function(error, doc) {
					if (!error && doc.code == 200) _amount = doc.diamond;
					cb(((doc.code==200)?null:doc.code), 'ok');			
				})
			}
		},
		update: function(cb) {
			if (_basic.roomType === 0) {
				_teamObj.playerArray[userId].consume += amount;
				_teamObj.playerArray[userId].gold -= amount;
			} else {
				_teamObj.playerArray[userId].consume += amount;
				_teamObj.playerArray[userId].diamond -= amount;
			}
		}	
	}, function(error, doc) {
		if (error) {
			callback(202);
		} else {
			callback(null, {balance: _amount, amount: _basic.amount});
		}
	})
}

/**
* @function: 
* @param: 
*/
handler.checkHand = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	
	if (!!_teamObj) {
		_teamObj.checkHand({userId: userId}, function(error, doc) {
			callback(error, doc);
		})
	} else {
		return callback(201);
	}
}

/**
* 
* @param: 
*/
handler.compareHand = function(userId, teammate, callback){
	var _teamObj = queryUserTeamObj(this, userId);
	if (!_teamObj) {
		return callback(201);
	} 

	var _res;
	async.series({
		checkUser: function(cb) {
			var _user = _teamObj.checkTeamPlayer({userId: teammate});
			var _error = !!_userId?null:201;
			cb(_error);
		},
		compare: function(cb) {
			_teamObj.onCompareHand({selfId: userId, teammate: teammate}, function(error, doc) {
				if (!error) _res = doc.res;
				cb(error);	
			})
		},
	}, function(error, doc) {
		if (error) {
			callback(201);
		} else {
			callback(null, _res);
		}
	})
}

/**
* 
* @param: 
*/
handler.abandonHand = function(userId, callback){
	var _teamObj = queryUserTeamObj(this, userId);
	if (!_teamObj) {
		return callback(201);
	}

	var _ret = _teamObj.onAbandonHand({userId: userId});
	if (_ret) {
		return callback(null);
	} else {
		return callback(201);
	}
}

/**
 * @function: 
 * @param: 
 * */
handler.allBetHandler = function(userId, callback) {
	var _teamObj = queryUserTeamObj(this, userId);
	if (!_teamObj) {
		return callback(202);
	}

	var _teammateId, _selfAccount, _teammateAccount, _amount;
	var _minAmount;
	async.series({
		checkPlayer: function(cb) {
			_teamObj.checkAllBetPlayer({userId: userId}, function(error, doc) {
				if (!error) _teammateId = doc.userId;
				cb(error, 'ok');
			})
		},
		querySelf: function(cb) {
			userAccount.queryAccount(userId, function(error, doc) {
				if (!error && doc.code === 200) _selfAccount = doc;
				cb((doc.code==200)?null:doc.code, 'ok');
			})	
		},
		queryTeammate: function(cb) {
			userAccount.queryAccount(_teammateId, function(error, doc) {
				if (!error && doc.code === 200) _teammateAccount = doc;
				cb((doc.code==200)?null:doc.code, 'ok');
			})
		},//扣除
		deductAmount: function(cb) {
			if (_teamObj.teamId === 0) {
				_minAmount = (_selfAccount.gold>_teammateAccount.gold) ? _teammateAccount.gold : _selfAccount.gold;
				userAccount.consumeGold(userId, _minAmount, 'aa', function(error, doc) {
					if (!error && doc.code == 200) _amount = doc.gold;
					cb(((doc.code==200)?null:doc.code), 'ok');			
				})
			} else {
				_minAmount = (_selfAccount.diamond>_teammateAccount.diamond) ? _teammateAccount.diamond : _selfAccount.diamond;
				userAccount.consumeDiamond(userId, _mindAmount, 'bb', function(error, doc) {
					if (!error && doc.code == 200) _amount = doc.diamond;
					cb(((doc.code==200)?null:doc.code), 'ok');			
				})
			}
		},
		updateAmount: function(cb) {
			if (_teamObj.teamType === 0) {
				_teamObj.playerArray[userId].consume += _minAmount;
				_teamObj.playerArray[userId].gold -= _minAmount;
			} else {
				_teamObj.playerArray[userId].consume += _minAmount;
				_teamObj.playerArray[userId].gold -= _minAmount;
			}
			cb(null);
		}
	}, function(error, doc) {
		if (error) {
			callback(201);
		} else {
			callback(null, {balance: _amount, amount: _minAmount, roomType: _teamObj.teamType});
		}	
	})	
}

handler.queryUserServiceId = function(userId){
	if (!!userId) {
		return getServerIdByUserId(userId.toString(), this.app);
	} else {
		return null;
	}
}

var addUserRecord = function(service, userId, data){
	service.uidMap[userId] = data;
}

var queryUserRecord = function(service, userId){
	var _user = service.uidMap[userId];
	if (!!_user) {
		//callback(null, _user);
		return _user;
	} else {
		return null;
	}
}

var updateUserAccount = function(service, type, userId, amount, callback){
	var _player = service.uidMap[userId];
	if (!!_player) {
		if (type === Const.Account.BET_GOLD) {
			userAccount.consumeAccountGold(userId, amount, function(error, res) {
				if (res.code === 200) {
					service.uidMap[userId]['gold'] -= amount;
					return callback(null, service.uidMap[userId]['gold']);
				} else {
					return callback(201);
				}
			})
		} else {
			return callback(201);
		}
	} else {
		return callback(201);
	}
}

var addTeamRecord = function(service, userId, data){

}

var queryUserTeamObj = function(service, userId) {
	var _teamId = service.teamMap[userId];
	if (!!_teamId) {
		//var _teamObj = this.teamObjMap[_teamId];
		var _teamObj = service.teamObjMap[_teamId];
		if (!!_teamObj) {
			return _teamObj;
		} else {
			return null;
		}
	} else {
		return null;
	}
}

var log = function(fun, msg){
	var timestamp = new Date();
	//logger.error(timestamp+':'+fun+':'+msg);
}

/**
* Get the connector server id assosiated with the uid
**/
var getServerIdByUserId = function(userId, app) {
  var connector = dispatcher.dispatch(userId, app.getServersByType('connector'));
  if(connector) {
    return connector.id;
  }
  return null;
};


var getConsumeAmount = funciton(roomType, betType, cardStatus) {
	if (roomType === 0) {
		return 100;
	} else if (roomType === 1) {
		return 100;
	} else if (roomType === 2) {
		return 100;
	}
}
