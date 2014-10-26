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
