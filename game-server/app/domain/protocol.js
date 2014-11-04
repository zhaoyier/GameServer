TeamInfo:{
	var teamID = 0;
	var playerNum = 0;
	var playerArray = [];
	var teamStatus = 0;		//团队锁定
},

TeamMember: {
	var uid = 0;
	var hand = [];
	var handStatus = 0;
	var patterns = 0;
},

PlayerBasic: {
	var uid = 0;
	var username = '';
	var avatar = '';
	var vip = '';
	var diamond = 0;
	var gold = 0;
}

JoinTeamReq: {
	var uid = 0;
}

JoinTeamRes: {
	var teamID = 0;
	teammate:{
		uid,
		username,
		vip,
		status
	}
}