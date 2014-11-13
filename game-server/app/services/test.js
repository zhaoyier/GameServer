var game = require('./gameService');

var service = new game();

service.joinTeam(100, function(error, res) {
	service.joinTeam(101, function(error, res){
		var values = service.checkTeammate(100, 101);
		// body...
		console.log('=========>>>>>:\t', res, values);
	})
	
})
