var tokenService = require('./token');

var timestamp = Date.now();
console.log(timestamp);
var token = tokenService.create('zhaoyier', timestamp, 'test');
console.log(token);
