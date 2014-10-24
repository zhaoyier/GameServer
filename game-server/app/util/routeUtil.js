var dispatcher = require('./dispatcher'); 

var exp = module.exports;

exp.connectorRoute = function(session, msg, app, cb){
	if (!session){
		cb(new Error(''));
		return ;
	}

	if (!session.frontentId){
		cb(new Error(''));
		return ;
	}
	
	cb(null, session.frontendId);
}

exp.gameRoute = function(session, msg, app, cb){
	var gameServers = app.getServersByType('game');
	if (!gameServers || gameServers.length === 0) {
		cb(new Error('can not find game servers'));
		return ;
	}
	var uid = session.get('playerId');
	var res = dispatcher.dispatch(parseInt(uid), gameServers);
	cb(null, res.id);
}

/*
var chatRoute = function(session, msg, app, cb) {
  var chatServers = app.getServersByType('chat');

    if(!chatServers || chatServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }   

    var res = dispatcher.dispatch(session.get('rid'), chatServers);

    cb(null, res.id);
};*/
