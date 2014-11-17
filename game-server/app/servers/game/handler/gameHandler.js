/**
* 房间的信息不在本脚本中通知，只返回自己信息
*/

var async = require('async');
var us = require('underscore');

var userDao = require('../../../dao/userDao');

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
handler.enter = function(msg, session, next){
    var _userId = session.get('playerId');
	var _gameService = this.gameService;

	async.parallel([
        function(callback){
            //查询帐号信息
            userDao.queryUser(_userId, function(error, res){
                if (error || res.code != 200){
                    callback(null, {});
                } else {
                    callback(null, {username: res.username})
                }
            })
        },
        function(callback){
            //查询帐户信息
            userDao.queryAccount(_userId, function(error, res){
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
    var _gameService = this.gameService;

    _gameService.joinTeam(msg.userId, msg.roomType, function(error, res){
        if (!error) {
            next(null, {code: 200, teamId: res.teamId})
        } else {
            next(null, {code: 201});
        }
    })
}

/**
* 查询队友信息
*/
handler.queryTeammateInfo = function(msg, session, next){   
    var _userId = session.get('playerId');
    var _gameService = this.gameService;
    
    _gameService.queryTeammateInfo(_userId, msg.userId, function(error, res){
        if (!error) {
            next(null, {code: 200});
        } else {
            next(null, {code: 201});
        }
    }) 
}

/**
*
*@param: 
*/
handler.bet = function(msg, session, next){
	 
}

/**
*
*@param: 
*/
handler.check = function(msg, session, next){

}

/**
*
*@param: 
*/
handler.addBet = function(msg, session, next){

}

/**
*
*@param: 
*/
handler.compare = function(msg, session, next){


}

/**
*
*@param: 
*/
handler.abandon = function(msg, session, next){


}