var game = require('./gameService');

var service = new game();

service.joinTeam(100, function(error, res) {
	// body...
	console.log('=========>>>>>:\t', res);
})
