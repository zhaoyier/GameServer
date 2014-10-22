var self = this;

self.blackList = ['192.168.100.1', '192.168.100.2', '10.96.29.250'];

module.exports.blackListFun = function(cb) {
	console.log("++++++++++:\t", self.blackList);
	cb(null, self.blackList);
};

