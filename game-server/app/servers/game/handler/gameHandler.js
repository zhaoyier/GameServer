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
	var gameService = this.gameService;

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
                    callback(null, {vip: res.vip})
                }
            })
        },
        function(callback){
            var serverId = gameService.queryUserServerId(userId);
            if (serverId != null) {
                callback(null, {serverId: serverId});
            } else {
                callback(null, {});
            }
        }
    ], function(error, res){
        var data = us.extend({}, res[0], res[1], res[2]);
        console.log(data);
        next(null, data);
    })
}

/**
*
*@param: 
*/
handler.quit = function(msg, session, next){
    next(null, {msg: 'hello'});
}

/**
*
*@param: 
*/
handler.join = function(msg, session, next){
	var _teamObj = this.gameService.joinTeam(msg.uid, function(error, res){
        if (!error) {
            /*加入房间*/
            if (!!res.teammate){
                var start = 0;
                async.whilst(
                    function(){ return start < res.teammate.length; },
                    function(cb){
                        this.app.rpc.game.gameRemote.query(res.teammate[start].uid, function(error, player){
                            if (error) {
                                
                            } else {
                                
                            }
                        })
                    },
                    function(error, res){

                    }
                )
            } else {
                /*新建房间*/
                next(null, {teamId: res.teamId});
                return ;
            }
            //1、查询队友和自己的信息
            //2、判断是新建房间还是加入，
            //3、如果新建房间利用next，如果加入通知队友
        } else {

        }
    });
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
