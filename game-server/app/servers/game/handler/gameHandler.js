module.exports = function(app) {
    return new GameHandler(app, app.get('gameService'));
};

var GameHandler = function(app, gameService) {
    this.app = app;
    this.gameService = gameService;
};

var handler = GameHandler.prototype;

GameHandler.prototype.query = function(msg, session, next){
	console.log("**********:\t", 'i am here');
	next(null, {msg: 'hello'});
}

handler.enter = function(msg, session, next){
	next(null, {msg: 'hello'});
}

handler.quit = function(msg, session, next){
	next(null, {msg: 'hello'});
}


