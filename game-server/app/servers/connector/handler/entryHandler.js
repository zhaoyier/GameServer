var async = require('async');

var Code = require('../../../consts/code');
var userDao = require('../../../dao/userDao');
var channelUtil = require('../../../util/channelUtil');
var logger = require('pomelo-logger').getLogger('game_server', __filename);

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
		
		if(!this.app){
			logger.error(app);
		}
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var username = msg.username, password = msg.password;
	var self = this;
	//authAccount
	var uid, players;
	async.waterfall([
		function(cb){
			//userDao.authAccount(username, password, cb);	
			userDao.authAccount('zhaoyier', '111111', cb);	
		},
		function(res, cb){
			uid = res.wuid
			if (parseInt(uid) === 0) {
				cb(Code.Entry.ERROR_USER_PWD, null);
			} else {
				self.app.get('sessionService').kick(uid, cb);
			}
		},function(cb){
			session.bind(uid, cb);
		},function(cb){
			session.set('playerName', username);
			session.set('playerId', uid);
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(cb);
		},function(cb){
			//self.app.rpc.chat.chatRemote.add(session, username, self.app.get('serverId'), 'aa', true, cb);
			self.app.rpc.chat.chatRemote.add(session, uid, username, channelUtil.getGlobalChannelName(), cb);
		}
	], function(error, results){
		console.log('-----------:\t', error, results);
		next(null, {users: players});
	})

	/*var self = this;
	var rid = msg.rid;
	var uid = msg.username + '*' + rid
	var sessionService = self.app.get('sessionService');


	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(uid);
	session.set('rid', rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	console.log('+++++++++++:\t', uid, self.app.get('serverId'), rid);
	*///put user into channel
	//self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
	/*self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
		next(null, {
			users:users
		});
	});*/
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};
