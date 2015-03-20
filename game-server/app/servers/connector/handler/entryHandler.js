var async = require('async');

var Code = require('../../../consts/code');
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
	var username = msg.username, password = msg.password;
	var self = this;
	//authAccount
	var _userId=0;
	async.series({
		one: function(cb) {
			userDao.authUser(username, password, function(error, doc) {
				if (!error) _userId = doc.userId;
				cb(error);
			})
		},
		two: function(cb) {
			self.app.get('sessionService').kick(_userId, function(error, doc){
				cb(error, doc);
			})
		},
		three: function(cb) {
			session.bind(_userId, cb);
		},
		four: function(cb){
			session.set('playerName', username);
			session.set('playerId', _userId);
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(cb);
		},
		five: function(cb){
			self.app.rpc.chat.chatRemote.add(session, _userId, username, channelUtil.getGlobalChannelName(), function(error, doc){
				cb(error, doc);
			})
		}
	}, function(error, doc) {
		if (error) {
			next(null, {code: 201});
		} else {
			next(null, {code: 200, userId: _userId});
		}
	})
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
