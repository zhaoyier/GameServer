var chatRemote = require('../remote/chatRemote');
var channelUtil = require('../../../util/channelUtil');
var Code = require('../../../config/code');
var Consts = require('../../../config/consts').Chat;

module.exports = function(app) {
	return new ChannelHandler(app, app.get('chatService'));
};

var ChannelHandler = function(app, chatService) {
	this.app = app;
	this.chatService = chatService;
};


/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
ChannelHandler.prototype.send = function(msg, session, next) {
	var target = msg.target;
	var channelName = getChannelName(msg);
	var username = session.get('playerName');
	var wuid = session.get('playerId');
	var content = setContent(msg.content);
	var param = {msg: content, from: username, target: msg.target}; 
	
	if (target === Consts.PRI){
		this.chatService.pushByPlayerName(msg.toName, content, function(err, res) {
			if(err) {
                logger.error(err.stack);
                code = Code.FAIL;
            } else if(res){
                code = res;
            } else {
                code = Code.OK;
            }   
                
            next(null, {code: code});	
		})
	} else if (target === Consts.TEAM){
		
	} else if (target === Consts.ALL){
		this.chatService.pushByChannel(channelName, param, function(err, res) {
			if(err) {
				logger.error(err.stack);
				code = Code.FAIL;
			} else if(res){
				code = res;
			} else {
				code = Code.OK;
			}
			
			next(null, {code: code});
		});	
	} else {
		next(null, {code: Code.FAIL})	
	}	

	/*var rid = session.get('rid');
	var username = session.uid.split('*')[0];
	var channelService = this.app.get('channelService');
	var param = {
		msg: msg.content,
		from: username,
		target: msg.target
	};
	channel = channelService.getChannel(rid, false);

	//the target is all users
	if(msg.target == '*') {
		channel.pushMessage('onChat', param);
	}
	//the target is specific user
	else {
		var tuid = msg.target + '*' + rid;
		var tsid = channel.getMember(tuid)['sid'];
		channelService.pushMessageByUids('onChat', param, [{
			uid: tuid,
			sid: tsid
		}]);
	}
	next(null, {
		route: msg.route
	});*/
};

var getChannelName = function(msg){
  /*var scope = msg.scope;
  if (scope === SCOPE.AREA) {
    return channelUtil.getAreaChannelName(msg.areaId);
  }*/
  return channelUtil.getGlobalChannelName();
};

function setContent(str) {
  str = str.replace(/<\/?[^>]*>/g,'');
  str = str.replace(/[ | ]*\n/g,'\n');
  return str.replace(/\n[\s| | ]*\r/g,'\n');
}
