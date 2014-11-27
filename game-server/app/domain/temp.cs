enum RoomForm{
	Common = 0x01,
	Advanced = 0x02,
	Regal = 0x03
}

enum BetForm{
	Low = 0x01,
	Middle = 0x02,
	High = 0x03
}



int getBetFund(RoomForm _roomForm, BetForm _betForm, bool _cardStatus){
	int _rate = _cardStatus ? 1 : 0;
	if (_roomForm == RoomForm.Common) {
		if (_betForm == BetForm.Low) {
			return 300+300*_rate;
		} else if (_betForm == BetForm.Middle) {
			return 500+500*_rate;
		} else if (_betForm == BetForm.High) {
			return 1000+1000*_rate;
		}

	} else if (_roomForm == RoomForm.Advanced){
		if (_betForm == BetForm.Low) {
			return 1500+1500*_rate;
		} else if (_betForm == BetForm.Middle) {
			return 2500+2500*_rate;
		} else if (_betForm == BetForm.High) {
			return 5000+5000*_rate;
		}

	} else if (_roomForm == RoomForm.Regal){
		if (_betForm == BetForm.Low) {
			return 10000+10000*_rate;
		} else if (_betForm == BetForm.Middle) {
			return 30000+30000*_rate;
		} else if (_betForm == BetForm.High) {
			return 50000+50000*_rate;
		}

	}

	return 0;
}

int getBetForm(int _friend, int _self){
	if (_friend > 3 || _self > 3) {
		return 2;		
	}

	if (_friend == _self) {
		return 0;		
	} else if (_friend < _self) {
		return 1;
	} else {
		return 2;
	}
}