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
	var url2 = 'mongodb://'+mongoConfig.host2+':'+mongoConfig.port2+'/'+mongoConfig.database2;

	MongoClient.connect(url, function(error, db) {
		assert.equal(null, error);
		async.series({
			game_db: function(cb) {
				collectGameDB(url, mongodb, function(error, doc) {
					cb(error, 'ok');
				});
			},
			game_log: function(cb) {
				collectGameLog(url, mongodb, function(error, doc) {
					cb(null, 'ok');
				});	
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

function collectGameDB(url, mongodb, callback) {
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
			},
			auction_log: function(cb) {
				db.collection('auction_log', function(error, coll) {
					if (!error) mongodb.auction_log = coll;
					cb(null, 'ok');
				})
			}
		}, function(error, doc){
			if (error) {
				callback(201, {});
			} else {
				callback(null, mongodb);
			}
		})
	})
}

function collectGameLog(url, mongodb, callback) {
	MongoClient.connect(url, function(error, db) {
		async.series({
			consume_diamond: function(cb) {
				db.collection('consume_diamond_log', function(error, coll){
					if (!error) mongodb.consume_diamond_log = coll;
					cb (null, 'ok');
				})
			},
			consume_gold: function(cb) {
				db.collection('consume_gold_log', function(error, coll){
					if (!error) mongodb.consume_gold_log = coll;
					cb (null, 'ok');
				})
			}
		}, function(error, doc) {
			if (error) {
				callback(201, mongodb);
			} else {
				callback(null, mongodb);
			}
		})
	})
}
