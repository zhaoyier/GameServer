/**
* 房间的信息不在本脚本中通知，只返回自己信息
*/

var async = require('async');
var us = require('underscore');

var userDao = require('../../../dao/userDao');
var userAccount = require('../../../dao/userAccount');

module.exports = function(app) {
    return new GameHandler(app, app.get('gameService'));
};

var GameHandler = function(app, gameService) {
    this.app = app;
    this.gameService = gameService;
};

var handler = GameHandler.prototype;

/**
* 进入游戏查询用户基本信息
*@param: {}
*/
handler.queryUserBasic = function(msg, session, next){
    var _userId = session.get('playerId');
	var _gameService = this.gameService;
	_userId = !!_userId?_userId:10000001;
	
	var _user, _account, _serviceId, _data;
	async.series({
		one: function(callback) {
			userDao.queryUser(_userId, function(error, doc) {
				if (!error) _user = doc;
				callback(error, 'ok');
			})
		},
		two: function(callback) {
			userAccount.queryAccount(_userId, function(error, doc) {
				if (!error) _account = doc;
				callback(error, 'ok');
			})
		},
		three: function(callback) {
			_serviceId = _gameService.queryUserServiceId(_userId);
			if (!!_serviceId) {
				callback(null, 'ok');
			} else {
				callback(201, 'ok');
			} 
		},
		four: function(callback) {
			_data = us.extend({}, _user, _account, {serviceId: _serviceId});
			_gameService.enterGame(_userId, _data, function(error, doc) {
				callback(error, 'ok');
			});
		}
	}, function(error, doc) {
		//console.log("====>>>10101:\t", error, doc, _data);
		if (error) {
			next(null, {code: 201});
		} else {
			next(null, _data);
		}
	})

}

/**
* 进入房间
*@param: 
*/
handler.joinGame = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;
	_userId = !!_userId?_userId:10000001;

    _gameService.joinTeam(_userId, msg.roomType, function(error, res){
		console.log("======>>>99:\t", error, res, typeof(next));
        if (!error) {
		    return next(null, {code: 200, teamId: res.teamId, place: res.place})
        } else {
            return next(null, {code: 201});
        }
    })
}

/**
 * @function: 
 *
 * */
handler.queryTeammates = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;

	_gameService.queryTeammatesHand(_userId, function(error, doc) {
		if (error) {
			return next(null, {code: 201});
		} else {
			return next(null, {code: 200, teammate: doc.teammates});
		}
	})	
}

/**
* 退出房间
* @param:
*/
handler.leaveTeam = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    _gameService.leaveTeam(_userId, function(error, res){
        if (!error) {
            next (null, {code: 200});
        } else {
            next(null, {code: 200});
        }
    })
}

/**
* 查询队友信息
*/
handler.queryTeammateInfo = function(msg, session, next){   
    var _userId = session.get('playerId');
    var _gameService = this.gameService;
    
    _gameService.queryTeammateInfo(_userId, msg.teammate, function(error, res){
        if (!error) {
            next(null, {code: 200});
        } else {
            next(null, {code: 201});
        }
    }) 
}

/**
* @function: 下 
* @param:
* @number: 2 
*/
handler.bet = function(msg, session, next){
	var _userId = session.get('playerId');
    var _gameService = this.gameService;
	_userId = !!_userId?_userId:10000001;
	
    if (!!_userId && !!msg.amount) {
        _gameService.betHand(_userId, msg.amount, msg.type, msg.channel, function(error, doc){
           if (!error) {
                next(null, {code: 200, balance: doc.amount});
            } else {
                next(null, {code: error});
            } 
        })    
    } else {
        next(null, {code: 210});
    }    
}

/**
* @function: kan
* @param:
* @number: 4
* */
handler.check = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

	console.log('====>>>44:\t', _userId, !!_userId);	
    if (!!_userId) {
        _gameService.checkHand(_userId, function(error, doc){
			console.log('=====>>>00:\t', _userId, error, doc);
            if (!error) {
                next(null, {code: 200, hand: doc.hand, pattern: doc.pattern});
            } else {
                next(null, {code: 201});
            }
        })
    } else {
        next(null, {code: 201});
    }
}

/**
 * @function: jia
 * @param: main(房间类型), sub(事件类型)
 * @number: 3
 * */
handler.raise = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;
	
	_gameService.raiseHandler(_userId, msg.active, function(error, doc) {
		if (!error) {
			next(null, {code: 200, balance: doc.balance, amount: doc.amount});
		} else {
			next(null, {code: 201});
		}
	})
}

/**
* @function: 
* @param: 
* @number: 5
* */
handler.compare = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!msg.teammate) {
        return next(null, {code: 201});
    }

    if (!!_userId && !!_gameService) {
        _gameService.compareHand(_userId, msg.teammate, function(error, doc){
            if (!error) {
                return next(null, {code: 200, res: doc.res, active: doc.active});
            } else {
                return next (null, {code: 201});
            }
        })
    } else {
        return next(null, {code: 201});
    }
}

/**
 * @funciton: 结算
 * @param: 
 * */
handler.clear = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;
	
	if (!!_userId && !!_gameService) {
		_gameService.clearHand(_userId, function(error, doc) {
			
		})	
	} else {
		return next(null, {code: 201});
	}
}

/**
* @function: 放弃
* @param: 
* @number: 6
* */
handler.abandon = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!!_userId) {
        _gameService.abandonHand(_userId, function(error, res){
            if (!error) {
                return next (null, {code: 200});
            } else {
                return next (null, {code: 201});
            }
        })
    } else {
        return next(null, {code: 201})
    }

}

/**
 * @function: 
 * @param: 
 * @number: 1
 * */
handler.allBet = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;
	
	if (!!_userId && !!_gameService) {
		_gameService.allBetHandler(_userId, function(error, doc) {
			if (!error) {
				return next(null, {code: 200, balance: doc.balance, amount: doc.amount, room: doc.roomType});
			} else {
				return next(null, {code: 202});
			}
		})	
	} else {
		return next(null, {code: 201});
	}
}
/**
* 请求开始游戏
* @param: 
*/
handler.startGame = function(msg, session, next) {
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!!_userId && !!_gameService) {
        _gameService.startGame(_userId, function(error, res){
            if (!error) {
                return next(null, {code: 200});
            } else {
                return next(null, {code: 201});
            }
        })
    } else {
        return next(null, {code: 201});
    }
}

/**
 * @function: 准备
 * @param:
 * **/
handler.prepare = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;
	_userId = !!_userId?_userId:10000001;

	console.log('====>>>11:\t', !!_userId, !!_gameService)	
	if (!!_userId && !!_gameService) {
		_gameService.prepareGame(_userId, function(error, doc) {
			if (!error) {
				next(null, {code: 200})
			} else {
				next(null, {code: 201});
			}
		})
	} else {
		next(null, {code: 201})
	}
}

/**
 * @function: 换桌
 * @param: 
 * */
handler.change = function(msg, session, next) {
	var _userId = session.get('playerId');
	var _gameService = this.gameService;
	
	if (!!_userId && !!_gameService) {
		_gameService.changeTeam(_userId, function(error, doc) {
			if (!error) {
				next(null, {code: 200, teamId: doc.teamId, place: doc.place});
			} else {
				next(null, {code: 201});
			}	
		})
	} else {
		next(null, {code: 202});
	}
}

/**
* 查看排行榜
* @param: 
**/
handler.rank = function(msg, session, next){
}


/**
* 活动数据查询
* @param: 
**/
handler.activity = function(msg, session, next){

}

/**
* 消息
* @param: 
**/
handler.message = function(msg, session, next) {

}

/**
* 奖励
* @param: 
**/
handler.award = function(msg, session, next) {

}

/**
* 商城
* @param: 
**/

handler.shop = function(msg, session, next) {

}
