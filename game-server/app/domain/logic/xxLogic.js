var message = require('../../consts/consts');

var handler = module.exports;

handler.createHandCard = function(residueCards, integral){
	var randomNum = this.calUserIntegral(integral);

	if (randomNum >=0 && randomNum <= 10){
		return this.createXXDanzhang(residueCards);
	} else if (randomNum >= 11 && randomNum <= 30){
		return this.createXXDuizi(residueCards);
	} else if (randomNum >= 31 && randomNum <= 50){
		return this.createXXShunzi(residueCards);
	} else if (randomNum >= 51 && randomNum <= 70){
		return this.createXXJinhua(residueCards);
	} else if (randomNum >= 71 && randomNum <= 80){
		return this.createXXShunjin(residueCards);
	} else if (randomNum >= 81 && randomNum <= 90){
		return this.createXXBaozi(residueCards);
	} else {
		return this.createXXTeshu(residueCards);
	}
}

handler.calUserIntegral = function(integral){
	if (integral != undefined && integral > 0){
		return parseInt(integral);
	} else {
		return this.createRandomOne(100);
	}
}

/*
 * *function: 卡牌生成
 * */
/*
 * *function: 生成炸弹牌
 * */
//handler.createXXBaozi = function(residueCards, cardValue){
handler.createXXBaozi = function(residueCards){
	var handCards = {cards: [], pattern: message.XXType.XX_BAOZI};
	var cardValue = residueCards[this.createRandomZero(residueCards.length)];

	while(true){
		var cardNumber = this.calCardsAsValue(residueCards, this.analyseCardValue(cardValue));
		if (cardNumber === 3){
			for (var i = 0; i < message.XXConstant.CARD_COLOR; i++) {
				var index = this.getCardIndex(residueCards, (i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue)));
				if (index != message.XXConstant.CROSS_MAX_CARD){
					handCards.cards.push(i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue));
					residueCards.splice(index, 1);
				}
			}
			return handCards;
		}
		else if (cardNumber === 4){
			var abandonColor = this.createRandomZero(4);
			for (var i = 0; i < 4; i++) {
				if (i != abandonColor){
					handCards.cards.push(i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue));
					residueCards.splice(this.getCardIndex(residueCards, i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue)), 1);
				}
			}
			return handCards;
		}
		else {
			cardValue = this.createRandomOne(message.XXConstant.MAX_CARD_VALUE);
		}
	}
}

/*
*function: 生成对子
**/
//handler.createXXDuizi = function(residueCards, cardValue){
handler.createXXDuizi = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_DUIZI};
	var cardValue = residueCards[this.createRandomZero(residueCards.length)];

	while(true){
		var cardNumber = this.calCardsAsValue(residueCards, this.analyseCardValue(cardValue));
		if (cardNumber === 2){
			for (var i = 0; i < message.XXConstant.CARD_COLOR; i++) {
				var index = this.getCardIndex(residueCards, (i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue)));
				if (index != message.XXConstant.CROSS_MAX_CARD){
					handCards.cards.push(i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue));
					residueCards.splice(index, 1);
				}	
			}
			while(true){
				var selectCardIndex = this.createRandomZero(residueCards.length);
				if (this.analyseCardValue(residueCards[selectCardIndex]) != this.analyseCardValue(cardValue)){
					handCards.cards.push(residueCards[selectCardIndex]);
					residueCards.splice(selectCardIndex, 1);
					return handCards;
				}
			}
		}
		else if (cardNumber >= 3){
			var colorCards = this.getCardsAsValue(residueCards, cardValue);
			var selectValueCard = this.createRandomZero(colorCards.length);
			handCards.cards.push(colorCards[selectValueCard]);
			this.removeCardAsValue(residueCards, colorCards[selectValueCard]);
			colorCards.splice(selectValueCard, 1);

			selectValueCard = this.createRandomZero(colorCards.length);
			handCards.cards.push(colorCards[selectValueCard]);
			this.removeCardAsValue(residueCards, colorCards[selectValueCard]);
			colorCards.splice(selectValueCard, 1);
			while(true){
				var selectCardIndex = this.createRandomZero(residueCards.length);
				if (this.analyseCardValue(residueCards[selectCardIndex]) != this.analyseCardValue(cardValue)){
					handCards.cards.push(residueCards[selectCardIndex]);
					residueCards.splice(selectCardIndex, 1);
					return handCards;
				}
			}
		}
		else {
			cardValue = this.createRandomOne(message.XXConstant.MAX_CARD_VALUE);
		}
	}
}

//handler.createXXShunjin = function(residueCards, cardValue){
handler.createXXShunjin = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_SHUNJIN};
	var cardValue = residueCards[this.createRandomZero(residueCards.length)];

	while(true){
		if (this.analyseCardValue(cardValue) <= 2){
			var counter = 0;
			for (var i=cardValue; i<cardValue+3; ++i){
				var index = this.getCardIndex(residueCards, i);
				if (index != message.XXConstant.CROSS_MAX_CARD){
					++counter;
				}	
			}
			if (counter === 3){
				for (var i=cardValue; i<cardValue+3; ++i){
					var index = this.getCardIndex(residueCards, i);
					handCards.cards.push(residueCards[index]);
					residueCards.splice(index, 1);
				}
				return handCards;
			}
			else {
				cardValue = residueCards[this.createRandomOne(residueCards.length)];
			}
		}
		else {
			var subCounter = 0, addCounter = 0;
			for	(var i=cardValue-2; i<cardValue+1; ++i){
				if (this.getCardIndex(residueCards, i) != message.XXConstant.CROSS_MAX_CARD){
					++subCounter;
				}
			}
			if (subCounter === 3){
				for (var i=cardValue-2; i<cardValue+1; ++i){
					var index = this.getCardIndex(residueCards, i);
					handCards.cards.push(residueCards[index]);
					residueCards.splice(index, 1);
				}
				return handCards;
			}
			else {
				for (var i=cardValue; i<cardValue+3; ++i){
					var index = this.getCardIndex(residueCards, i);
					if (this.getCardIndex(residueCards, i) != message.XXConstant.CROSS_MAX_CARD){
						++addCounter;
					}	
				}
				if (addCounter === 3){
					for (var i=cardValue; i<cardValue+3; ++i){
						var index = this.getCardIndex(residueCards, i);
						handCards.cards.push(residueCards[index]);
						residueCards.splice(index, 1);
					}
					return handCards;
				}
				else {
					cardValue = this.createRandomOne(message.XXConstant.MAX_CARD_VALUE);
				}
			}
		}	
	}
}

//handler.createXXJinhua = function(residueCards, cardValue){
handler.createXXJinhua = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_JINHUA};
	var cardValue = residueCards[this.createRandomZero(residueCards.length)];
	while (true){
		var sameColorCards = this.getCardsAsColor(residueCards, this.analyseCardColor(cardValue));
		if (sameColorCards.length >= message.XXConstant.HAND_CARDS_NUM){
			for (var i = 0; i < message.XXConstant.HAND_CARDS_NUM; ++i) {
				var selectColorCard = this.createRandomZero(sameColorCards.length);
				handCards.cards.push(sameColorCards[selectColorCard]);
				this.removeCardAsValue(residueCards, sameColorCards[selectColorCard]);
				sameColorCards.splice(selectColorCard, 1);
			}
			return handCards;
		}
		else {
			cardValue = residueCards[this.createRandomOne(residueCards.length)];
		}
	}	
}

//handler.creatXXShunzi = function(residueCards, cardValue){
handler.createXXShunzi = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_SHUNZI};
	var cardValue = residueCards[this.createRandomZero(residueCards.length)];
	while(true){
		if (this.analyseCardValue(cardValue) <= 2){
			var counter = 0;
			for (var i = cardValue; i < cardValue+3; ++i) {
				var sameValueCards = this.getCardsAsValue(residueCards, i);
				if (sameValueCards.length >= 1){
					++counter;
				}
			}
			if (counter === 3){
				for (var i = cardValue; i < cardValue+3; ++i) {
					var sameValueCards = this.getCardsAsValue(residueCards, i);
					var selectCardIndex = this.createRandomZero(sameValueCards.length);
					handCards.cards.push(sameValueCards[selectCardIndex]);
					this.removeCardAsValue(residueCards, sameValueCards[selectCardIndex]);
				}
				return handCards;
			}
			else {
				cardValue = residueCards[this.createRandomOne(residueCards.length)];
			}
		}
		else {
			var subCounter = 0, addCounter = 0;
			for (var i = cardValue-2; i < cardValue+1; i++) {
				var sameValueCards = this.getCardsAsValue(residueCards, i);
				if (sameValueCards.length >= 1){
					++subCounter;
				}
			}
			if (subCounter === 3){
				for (var i = cardValue-2; i < cardValue+1; i++) {
					var sameValueCards = this.getCardsAsValue(residueCards, i);
					var selectCardIndex = this.createRandomZero(sameValueCards.length);
					handCards.cards.push(sameValueCards[selectCardIndex]);
					this.removeCardAsValue(residueCards, sameValueCards[selectCardIndex]);
				}
				return handCards;
			}
			else {
				for (var i = cardValue; i < cardValue+3; i++) {
					var sameValueCards = this.getCardsAsValue(residueCards,i);
					if (sameValueCards.length >= 1){
						++addCounter;
					}	
				}
				if (addCounter === 3){
					for (var i = cardValue; i < cardValue+3; i++) {
						var sameValueCards = this.getCardsAsValue(residueCards, i);
						var selectCardIndex = this.createRandomZero(sameValueCards.length);
						handCards.cards.push(sameValueCards[selectCardIndex]);
						this.removeCardAsValue(residueCards, sameValueCards[selectCardIndex]);
					}
					return handCards;
				}
				else {
					cardValue = residueCards[this.createRandomOne(residueCards.length)];
				}
			}
		}
	}
}

handler.createXXDanzhang = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_DANZHANG};

	while (true){
		var index = this.createRandomZero(residueCards.length);
		if (handCards.cards.length === 0){
			handCards.cards.push(residueCards[index]);
			residueCards.splice(index, 1);
		}
		else if (handCards.cards.length === 1){
			var selectCardValue = this.analyseCardValue(residueCards[index]);
			var handCardValue = this.analyseCardValue(handCards.cards[0]);
			if (selectCardValue != handCardValue){
				handCards.cards.push(residueCards[index]);
				residueCards.splice(index, 1);
			}
		}
		else if (handCards.cards.length === 2){
			if ((this.analyseCardValue(residueCards[index]) != this.analyseCardValue(handCards.cards[0]))
				&& this.analyseCardValue(residueCards[index]) != this.analyseCardValue(handCards.cards[1])){
				if (this.analyseCardColor(residueCards[index]) != this.analyseCardColor(handCards.cards[0])){
					handCards.cards.push(residueCards[index]);
					residueCards.splice(index, 1);
				}
				else if (this.analyseCardColor(residueCards[index]) != this.analyseCardColor(handCards.cards[1])){
					handCards.cards.push(residueCards[index]);
					residueCards.splice(index, 1);
				}
			}

		}

		if (handCards.cards.length === 3){
			var handCardsValue = [];
			for (var i = 0; i < handCards.cards.length; i++) {
				handCardsValue.push(this.analyseCardValue(handCards.cards[i])); 
			}
			handCardsValue.sort(sortNumber);
			if (handCardsValue[0] === 2 && handCardsValue[1] === 3 && handCardsValue[2] === 5){
				if ((this.analyseCardColor(handCards.cards[0]) != this.analyseCardColor(handCards.cards[1]))
					&&(this.analyseCardColor(handCards.cards[0]) != this.analyseCardColor(handCards.cards[2]))
					&&(this.analyseCardColor(handCards.cards[1]) != this.analyseCardColor(handCards.cards[2]))){
					//return handCards.pattern = message.XXType.XX_TESHU;
					return {cards: handCards.cards, pattern: message.XXType.XX_TESHU};
				}
			}

			return handCards;	
		}
	}
}

handler.createXXTeshu = function(residueCards){
	var handCards = {cards:[], pattern: message.XXType.XX_TESHU};

	var selectCardTwo = this.getCardsAsValue(residueCards, 2);
	var selectCardThree = this.getCardsAsValue(residueCards, 3);
	var selectCardFive = this.getCardsAsValue(residueCards, 5);
	//console.log(selectCardTwo, selectCardThree, selectCardFive);
	if ((selectCardTwo.length === 0)||(selectCardThree.length === 0)||(selectCardFive.length === 0)){
		return this.createXXJinhua(residueCards);
	}
	else {
		var randomCardIndex = this.createRandomZero(selectCardTwo.length);
		handCards.cards.push(selectCardTwo[randomCardIndex]);
		this.removeCardAsValue(residueCards, selectCardTwo[randomCardIndex]);

		var randomCardIndex = this.createRandomZero(selectCardThree.length);
		handCards.cards.push(selectCardThree[randomCardIndex]);
		this.removeCardAsValue(residueCards, selectCardThree[randomCardIndex]);
	
		var randomCardIndex = this.createRandomZero(selectCardFive.length);
		handCards.cards.push(selectCardFive[randomCardIndex]);
		this.removeCardAsValue(residueCards, selectCardFive[randomCardIndex]);
	
		if ((this.analyseCardColor(handCards.cards[0]) != this.analyseCardColor(handCards.cards[1]))
			&& (this.analyseCardColor(handCards.cards[0]) != this.analyseCardColor(handCards.cards[2]))
			&& (this.analyseCardColor(handCards.cards[1]) != this.analyseCardColor(handCards.cards[2]))){
			return {cards: handCards.cards, pattern: message.XXType.XX_TESHU};
		}
		else {
			return {cards: handCards.cards, pattern: message.XXType.XX_DANZHANG};
		}
	}

}

/*
*function: 解析卡牌数值大小
**/
handler.analyseCardValue = function(cardValue){
	return parseInt(cardValue%message.XXRefer.REFER_HEX);
}

/*
*function: 解析卡牌花色
**/
handler.analyseCardColor = function(cardValue){
	return parseInt(cardValue/message.XXRefer.REFER_HEX);
}

/*
 * *function: 根据卡牌数值获取其下标
 * */
handler.getCardIndex = function(residueCards, cardValue){
	for (var i = 0; i < residueCards.length; i++) {
		if (residueCards[i] === cardValue){
			return i;
		}
	}
	return message.XXConstant.CROSS_MAX_CARD;
}

/*
*function: 检查四色卡牌是否存在
**/
handler.calCardsAsValue = function(residueCards, cardValue){
	var counter = 0;
	for (var i = 0; i < message.XXConstant.CARD_COLOR; ++i) {
		if (this.getCardIndex(residueCards, (i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue))) != message.XXConstant.CROSS_MAX_CARD){
			++counter;
		}
	}
	return counter;
}

/*
*function: 获取相同大小的牌
**/
handler.getCardsAsValue = function(residueCards, cardValue){
	var valueCards = [];
	for (var i=0; i<message.XXConstant.CARD_COLOR; ++i){
		var index = this.getCardIndex(residueCards, (i*message.XXConstant.HEX_VALUE+this.analyseCardValue(cardValue)));
		if (index != message.XXConstant.CROSS_MAX_CARD){
			valueCards.push(residueCards[index]);
		}
	}
	return valueCards;
}

/*
*function: 获取相同花色的牌
**/
handler.getCardsAsColor = function(residueCards, cardColor){
	var sameColorCards = [];
	for (var i = 0; i < residueCards.length; i++) {
		if (this.analyseCardColor(residueCards[i]) === cardColor){
			sameColorCards.push(residueCards[i]);
		}
	}
	return sameColorCards;
}

/*
*function: 获取卡牌大小的数组
**/
handler.getCardsArrayAsValue = function(handCards){
	var handCardsValue = [];
	for (var i = 0; i < handCards.cards.length; i++) {
		handCardsValue.push(this.analyseCardValue(handCards.cards[i])); 
	}
	return handCardsValue.sort(sortNumber);
}


/*
*function: 根据卡牌大小删除
**/
handler.removeCardAsValue = function(residueCards, cardValue){
	var index = this.getCardIndex(residueCards, cardValue);
	residueCards.splice(index, 1);	
}
/*
*function: 根据卡牌索引删除
**/
handler.removeCardAsIndex = function(residueCards, cardIndex){
	residueCards.splice(cardIndex, 1);
}
/*
 * *function: 随机数生成
 * */
handler.createRandomZero = function(base){
	return parseInt(Math.random()*base);
}

handler.createRandomOne = function(base){
	return parseInt(Math.random()*base+1)
}

/*
 * *function: 分析卡牌信息
 * */
handler.getCardColor = function(cardValue){
	switch(parseInt(cardValue/16)){
		case 0: {
				return "方块";
			}
		case 1: {
				return "梅花";
			}
		case 2: {
				return "红桃";
			}
		case 3: {
				return "黑桃";
			}
	}
}

/*
*function: 比较卡牌大小
**/
handler.getCompareSize = function(ownCards, otherCards, initiative){
	if (ownCards === undefined || otherCards === undefined){
		return 0;
	}

	if (ownCards.pattern > otherCards.pattern){
		return message.XXConstant.WIN;
	}
	else if (ownCards.pattern < otherCards.pattern){
		return message.XXConstant.LOSE;
	}
	else {
		var ownCardsValue = this.getCardsArrayAsValue(ownCards);
		var otherCardsValue = this.getCardsArrayAsValue(otherCards);

		if (ownCards.pattern === 1){
			if (ownCardsValue[2] != otherCardsValue[2]){
				return (ownCardsValue[2]>otherCardsValue[2]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else if (ownCardsValue[1] != otherCardsValue[1]){
				return (ownCardsValue[1]>otherCardsValue[1]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else if (ownCardsValue[0] != otherCardsValue[0]){
				return (ownCardsValue[0]>otherCardsValue[0]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else {
				return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 2){
			var ownDuiziValue = (ownCardsValue[0]===ownCardsValue[1]) ? ownCardsValue[0] : ownCardsValue[2];
			var otherDuiziValue = (otherCardsValue[0]===otherCardsValue[1]) ? otherCardsValue[0] : otherCardsValue[2];
			if (ownDuiziValue === otherDuiziValue){
				var ownDanValue = (ownCardsValue[0] === ownCardsValue[1]) ? ownCardsValue[2]: ownCardsValue[0];
				var otherDanValue = (otherCardsValue[0] === otherCardsValue[1]) ? otherCardsValue[2]: otherCardsValue[0];
				if (ownDanValue === otherDanValue){
					return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
				}
				else {
					return (ownDanValue > otherDanValue) ? message.XXConstant.WIN: message.XXConstant.LOSE;
				}
			}
			else {
				return (ownDuiziValue > otherDuiziValue) ? message.XXConstant.WIN : message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 3){
			if (ownCardsValue[2] === otherCardsValue[2]){
				return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else {
				return (ownCardsValue[2] > otherCardsValue[2]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 4){
			if (ownCardsValue[2] != otherCardsValue[2]){
				return (ownCardsValue[2]>otherCardsValue[2]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else if (ownCardsValue[1] != otherCardsValue[1]){
				return (ownCardsValue[1]>otherCardsValue[1]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else if (ownCardsValue[0] != otherCardsValue[0]){
				return (ownCardsValue[0]>otherCardsValue[0]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else {
				return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 5){
			if (ownCardsValue[2] === otherCardsValue[2]){
				return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else {
				return (ownCardsValue[2] > otherCardsValue[2]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 6){
			if (ownCardsValue[2] === otherCardsValue[2]){
				return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
			else {
				return (ownCardsValue[2] > otherCardsValue[2]) ? message.XXConstant.WIN: message.XXConstant.LOSE;
			}
		}
		else if (ownCards.pattern === 7){
			return initiative ? message.XXConstant.WIN: message.XXConstant.LOSE;
		}
	}
}


function sortNumber(a,b)
{
	return a - b;
}