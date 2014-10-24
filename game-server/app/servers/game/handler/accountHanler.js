module.exports = function(app){
	return new AccountHandler(app, app.get('gameService'));
}

var AccountHandler = function(app, service){
	this.app = app;
	this.service = service;
}

var handler = AccountHandler.prototype;

handler.test = function(msg, session, next){
	next(null, {msg: 'hello'});
}

handler.query = function(msg, session, next){
	next(null, {msg: 'hello'});
}

handler.recharge = function(msg, session, next){
	next(null, {msg: 'hello'});
}

handler.pay = function(msg, session, next){
	next(null, {msg: 'hello'});
}
