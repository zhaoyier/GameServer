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
*@param: 
*/
handler.enter = function(msg, session, next){
    var userId = session.get('playerId');
	var _gameService = this.gameService;

	async.parallel([
        function(callback){
            //查询帐号信息
            userDao.queryUser(userId, function(error, res){
                if (error || res.code != 200){
                    callback(null, {});
                } else {
                    callback(null, {username: res.username})
                }
            })
        },
        function(callback){
            //查询帐户信息
            userDao.queryAccount(userId, function(error, res){
                if (error || res.code != 200){
                    callback(null, {});
                } else {
                    callback(null, {vip: res.vip, diamond: res.diamond, gold: res.gold})
                }
            })
        },
        function(callback){
            var serverId = _gameService.queryUserServerId(userId);
            if (serverId != null) {
                callback(null, {serverId: serverId});
            } else {
                callback(null, {});
            }
        }
    ], function(error, res){
        var data = us.extend({}, res[0], res[1], res[2]);
        _gameService.enterGame(userId, data, function(error, res){
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

	var _teamObj = _gameService.joinTeam(msg.userId, function(error, res){
        if (!error && !!res.teammates){
            //加入房间, 查询所有队友信息, 返回客户端
            var start = 0, _teamId = res.teamId, _teammates = [];
            async.whilst(
                function(){return start < res.teammates.length; },
                function(cb){
                    _gameService.queryUserBasic(res.teammates[start].userId, function(error, user){
                        if (!error && !!user){
                            _teammates.push(user);
                        }
                        ++start;
                        cb(null, 'ok');
                    })
                }, 
                function(error, res){
                    next(null, {code: 200, teamId: _teamId, teammates: _teammates});
                }
            )
        } else if (!error){
            //创建房间
            next(null, {code: 200, teamId: res.teamId})
        } else {
            //出现错误
            next(null, {code: 201});
        }
    });

}

/**
* 查询队友信息
*/
handler.queryTeammate = function(msg, session, next){
    //判断是否为队友
    var userId = session.get('playerId');
    var gameService = this.gameService;
    
    //查询队友信息

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