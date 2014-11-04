var async = require('async'); 

module.exports = function(app) {
    return new GameHandler(app, app.get('gameService'));
};

var GameHandler = function(app, gameService) {
    this.app = app;
    this.gameService = gameService;
};

var handler = GameHandler.prototype;

/**
*
*@param: 
*/
GameHandler.prototype.query = function(msg, session, next){
    console.log("**********:\t", 'i am here');
    next(null, {msg: 'hello'});
}

/**
*
*@param: 
*/
handler.enter = function(msg, session, next){
	var uid = session.get('playerId');
	
    next(null, {msg: 'hello'});
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
