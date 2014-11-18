module.exports = {
	OK: 200, 
    FAIL: 500, 

    Entry: {
		ERROR_USER_PWD: 1001
    }, 
    Chat: {
        FA_CHANNEL_CREATE:      3001, 
        FA_CHANNEL_NOT_EXIST:   3002, 
        FA_UNKNOWN_CONNECTOR:   3003, 
        FA_USER_NOT_ONLINE:     3004 
    },
	Game: {
		FA_UNKNOWN_CONNECTOR: 1201
	},
    Account: {
        GOLD_INSUFFICIENT: 1301,
        DIAMOND_INSUFFICIENT: 1302,
        INSUFFICIENT_BALANCE: 1303
    },
    Team: {
        DATA_ERR:1401,
        TEAM_FULL: 1402,
        ALREADY_IN_TEAM: 1403,
        SYS_ERROR: 1404
    },
	Card: {
		BACK: 0
	},
	
}
