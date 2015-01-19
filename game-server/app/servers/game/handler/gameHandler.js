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

	async.parallel([
        function(callback){
            //查询帐号信息
            userDao.queryUser(_userId, function(error, res){
                if (error || res.code != 200){
                    callback(null, {});
                } else {
                    callback(null, {username: res.username, uid: res.uid})
                }
            })
        },
        function(callback){
            //查询帐户信息
            userAccount.queryAccount(_userId, function(error, res){
                if (error || res.code != 200){
                    callback(null, {});
                } else {
                    callback(null, {vip: res.vip, diamond: res.diamond, gold: res.gold})
                }
            })
        },
        function(callback){
            var _serviceId = _gameService.queryUserServerId(_userId);
            if (_serviceId != null) {
                callback(null, {serviceId: _serviceId});
            } else {
                callback(null, {});
            }
        }
    ], function(error, res){
        var data = us.extend({}, res[0], res[1], res[2]);
		console.log('===============>>>>>', data);
        /*{username, vip, diamond, gold, serviceId}*/
        _gameService.enterGame(_userId, data, function(error, res){
            if (res.code === 200){
                data['code'] = 200;
                next(null, data);
            } else {
                data['code'] = 201;
                next(null, data);
            }
        })
    })
}

/**
* 进入房间
*@param: 
*/
handler.joinGame = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    _gameService.joinTeam(_userId, msg.roomType, function(error, res){
        if (!error) {
            next(null, {code: 200, teamId: res.teamId})
        } else {
            next(null, {code: 201});
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
* 
* @param: 
*/
handler.bet = function(msg, session, next){
	var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!!_userId && !!msg.amount && !!msg.type) {
        _gameService.bet(_userId, msg.amount, msg.type, function(error, res){
           if (!error) {
                next(null, {code: 200, balance: res});
            } else {
                next(null, {code: 201});
            } 
        })    
    } else {
        next(null, {code: 201});
    }    
}

/**
* 
* @param: 
*/
handler.check = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!!_userId) {
        _gameService.checkHand(_userId, function(error, res){
            if (!error) {
                next(null, {code: 200, hand: res.hand, pattern: hand.pattern});
            } else {
                next(null, {code: 201});
            }
        })
    } else {
        next(null, {code: 201});
    }
}

/**
* 
*@param: 
*/
handler.compare = function(msg, session, next){
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!msg.teammate) {
        return next(null, {code: 201});
    }

    if (!!_userId) {
        _gameService.compareHand(_userId, msg.teammate, function(error, res){
            if (!error) {
                return next(null, {code: 200, win: res.win});
            } else {
                return next (null, {code: 200});
            }
        })
    } else {
        return next(null, {code: 201});
    }
}

/**
* 放弃
*@param: 
*/
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
* 请求开始游戏
* @param: 
*/
hander.startGame = function(msg, session, next) {
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
* 请求开始游戏
* @param: 
*/
hander.restartGame = function(msg, session, next) {
    var _userId = session.get('playerId');
    var _gameService = this.gameService;

    if (!!_userId && !!_gameService) {
        _gameService.restartGame(_userId, function(error, res){
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