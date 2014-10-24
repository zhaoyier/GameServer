var pomelo = require('pomelo');
var sync = require('pomelo-sync-plugin');
var dispatcher = require('./app/util/dispatcher');
var blackList = require('./app/util/blackList');
var routeUtil = require('./app/util/routeUtil.js');
var abuseFilter = require('./app/servers/chat/filter/abuseFilter');
var ChatService = require('./app/services/chatService');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'chatofpomelo-websocket');

app.configure('production|development', function(){
	app.before(pomelo.filters.toobusy()); //避免大量请求造成服务器压力
	app.enable('systemMonitor');//开启监控
	
	// proxy configures
	app.set('proxyConfig', {
		cacheMsg: true,
		interval: 30,
		lazyConnection: true
	});	
	
	// remote configures
	app.set('remoteConfig', {
		cacheMsg: true,
		interval: 30
	});

	app.set('connectorConfig', {
    	blacklistFun: blackList.blackListFun
	});

	app.route('game', routeUtil.gameRoute);
	app.route('connector', routeUtil.connectorRoute);

	app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
	app.filter(pomelo.filters.timeout());
	
})

// app configuration
app.configure('production|development', 'connector', function(){
	var dictionary = app.components['__dictionary__'];
	var dict = null;
	if(!!dictionary){
    	dict = dictionary.getDict();
	}

	app.set('connectorConfig',{   
		connector : pomelo.connectors.hybridconnector,
		heartbeat : 30, 
		useDict : true,
		//useProtobuf : true,
		blacklistFun: blackList.blackListFun,
		handshake : function(msg, cb){
			cb(null, {});
		}   
	});
});

app.configure('production|development', 'gate', function(){
	app.set('connectorConfig',{
		connector : pomelo.connectors.hybridconnector,
		//useDict: true,

		// enable useProto
		//useProtobuf: true
	});
});

app.configure('production|development', 'chat', function() {
	app.filter(abuseFilter());
	app.set('chatService', new ChatService(app));
});

/*app.configure('production|development', 'game', function() {

})*/

// Configure database
app.configure('production|development', 'auth|connector|master', function() {
	var dbclient = require('./app/dao/mysql/mysql').init(app);
	app.set('dbclient', dbclient);
	app.use(sync, {sync: {path:__dirname + '/app/dao/mapping', dbclient: dbclient}});
})
// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});
