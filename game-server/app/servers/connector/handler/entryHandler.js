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
handler.enter = function(msg, session, next) {
	var username = msg.username, password = msg.password;
	var self = this;
	//authAccount
	var uid, player;
	async.waterfall([
		function(cb){
			console.log('===================enter>>>:\t', username, password)
			userDao.authUser(username, password, cb);	
			//userDao.authUser('zhaoyier', '111111', cb);	
		},
		function(res, cb){
			player = res;
			uid = res.userId
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
			self.app.rpc.chat.chatRemote.add(session, uid, username, channelUtil.getGlobalChannelName(), cb);
		}
	], function(error, results){
		console.log('-----------:\t', error, results, player);
		next(null, {username: 'zhaoyier', userId: player.userId});
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
