var dispatcher = require('../../../util/dispatcher');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next step callback
 *
 */
handler.queryEntry = function(msg, session, next) {
	var _rid = msg.rid;
	if(!_rid) {
		next(null, {
			code: 500
		});
		return;
	}
	// get all connectors
	var _connectors = this.app.getServersByType('connector');
	if(!_connectors || _connectors.length === 0) {
		next(null, {
			code: 500
		});
		return;
	}

	//var ip = session.__session__.__socket__.remoteAddress.ip;
	//console.log('************:\t', ip);

	// select connector, because more than one connector existed.
	var _res = dispatcher.dispatch(_rid, _connectors);
	next(null, {
		code: 200,
		host: _res.host,
		port: _res.clientPort
	});
};
