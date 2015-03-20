var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var async = require('async');
// mysql CRUD
var sqlclient = module.exports;


/**
 * init database
 **/
sqlclient.init = function(app, callback) {
	var mongoConfig = app.get('dbconfig');
	var mongodb = {};
	var url = 'mongodb://'+mongoConfig.host+':'+mongoConfig.port+'/'+mongoConfig.database;
	MongoClient.connect(url, function(error, db) {
		assert.equal(null, error);
		async.series({
			game_user: function(cb){
				db.collection('game_user', function(error, coll){
					if (!error) mongodb.game_user = coll;
					cb(null, 'ok');
				})
			},
			game_account: function(cb) {
				db.collection('game_account', function(error, coll){
					if (!error) mongodb.game_account = coll;
					cb(null, 'ok');
				})
			},
			game_recharge: function(cb) {
				db.collection('game_recharge', function(error, coll){
					if (!error) mongodb.game_recharge = coll;
					cb(null, 'ok');
				})
			},
			game_mark: function(cb) {
				db.collection('game_mark', function(error, coll){
					if (!error) mongodb.game_mark = coll;
					cb(null, 'ok');
				})
			},
			game_exchange: function(cb){
				db.collection('game_exchange', function(error, coll){
					if (!error) mongodb.game_exchange = coll;
					cb(null, 'ok');
				})
			},
			game_auction: function(cb){
				db.collection('game_auction', function(error, coll){
					if (!error) mongodb.game_auction = coll;
					cb(null, 'ok');
				})
			}
		}, function(error, doc){
			if (!error) {
				callback(null, mongodb);
			} else {
				callback(201, {});
			}
		})
	})
};

/**
 * shutdown database
 **/
sqlclient.shutdown = function(app) {
	
};
