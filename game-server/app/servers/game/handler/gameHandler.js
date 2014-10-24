module.exports = function(app) {
    return new GameHandler(app, app.get('gameService'));
};

var GameHandler = function(app, gameService) {
    this.app = app;
    this.gameService = gameService;
};

GameHandler.prototype.sendi = function(msg, session, next) {
	console.log("**********:\t", 'i am here');
	next(null, {msg: 'hello'})
},

GameHandler.prototype.query = function(msg, session, next){
	console.log("**********:\t", 'i am here');
	next(null, {msg: 'hello'});
}
