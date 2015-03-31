var async = require('async');

var Code = require('../../../config/code');
var userDao = require('../../../dao/userDao');
var channelUtil = require('../../../util/channelUtil');
var logger = require('pomelo-logger').getLogger('gameservice', __filename);

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
handler.entry = function(msg, session, next) {
	var _username = msg.username, _password = msg.password;
	var self = this;
	//authAccount
	var _userId=0;

	async.waterfall([
		function(callback) {
			userDao.authUser(_username, _password, function(error, doc) {
				if (!error) _userId = doc.userId;
				callback(error);
			})
		},
		function(callback) {
			self.app.get('sessionService').kick(_userId, callback);
		},
		function(callback) {
			session.bind(_userId, callback);
		},
		function(callback) {
			session.set('playerName', _username);
			session.set('playerId', _userId);
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(callback);
		},
		function(callback) {
			self.app.rpc.chat.chatRemote.add(session, _userId, _username, channelUtil.getGlobalChannelName(), callback);
		}
	], function(error, doc) {
		if (error) {
			next(null, {code: 201});
		} else {
			next(null, {code: 200, userId: _userId});
		}
	});
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
	//app.rpc.chat.chatRemote.kick(session, {playerId: session.get('playerId'), serverId: app.get('serverId'), instanceId: session.get('instanceId')}, function(error){
	//	if(!!err){
	//		console.log('***>>:\t user leave error!');
	//	}
	//});
	app.rpc.chat.chatRemote.kick(session, session._userId, null);
};
