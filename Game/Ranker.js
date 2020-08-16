const GameConstants = require('./GameConstants.js');
const SUITS = GameConstants.SUITS
const VALUES = GameConstants.VALUES
const VALUES_MAP = GameConstants.VALUES_MAP


function sortHands(table,hands){
	getScoresForAllHands(hands)
	hands.sort(compareScores)
	return mergeTies(table,hands)
}

function getScoresForAllHands(hands){
	for(let i = 0; i < hands.length; i++){
		let hand = hands[i][1]
		hands[i].push(getHandScore(hand))
	}
}

function mergeTies(table,hands){
	let ret = []
	let curTie = [hands[0]]
	for(let i = 0; i < hands.length-1; i++){
		if(compareScores(hands[i],hands[i+1])==0){
			curTie.push(hands[i+1])
		} else {
			curTie.sort((hand1,hand2)=>{ // Sorts lowest payout qualification to highest
				return table.players[hand1[0]].totalBet - table.players[hand2[0]].totalBet  
			})
			ret.push(curTie)
			curTie = [hands[i+1]]
		}
	}
	if(curTie.length!=0){
		curTie.sort((hand1,hand2)=>{ // Sorts lowest payout qualification to highest
			return table.players[hand1[0]].totalBet - table.players[hand2[0]].totalBet  
		})
		ret.push(curTie)
	}
	if(ret.length != hands.length){
		console.log("Unmerged Tie hands ",JSON.stringify(hands))
	}
	return ret
}

function compareScores(hand1,hand2){ // Ret + if score2 is better
	for(let i = 0; i < hand1[2].length; i++){
		if(hand1[2][i] != hand2[2][i]){
			return hand2[2][i] - hand1[2][i]
		}
	}
	return 0
}

function getHandString(score){
	let str = ""
	switch(score[0]){
		case 0:{
			str += "High card "
			for(let i = 1; i < score.length; i++){
				str += VALUES[score[i]-2]
				if(i != score.length-1){
					str += ","
				}
			}
			return str
		}
		case 1:{
			str += "Pair of "+VALUES[score[1]-2] + "s "
			if(score.length > 2){
				str += "with "
			}
			for(let i = 2; i < score.length; i++){
				str += VALUES[score[i]-2]
				if(i != score.length-1){
					str += ","
				} else {
					str += " kickers"
				}
			}
			return str
		}
		case 2:{
			str += "Two Pair with "+VALUES[score[1]-2]+"s and " + VALUES[score[2]-2] + "s "
			if(score.length > 3){
				str += "with "+VALUES[score[3]-2]+" kicker"
			}
			return str
		}
		case 3:{
			str += "Three of a kind of "+VALUES[score[1]-2] + "s "
			if(score.length > 2){
				str += "with "
			}
			for(let i = 2; i < score.length; i++){
				str += VALUES[score[i]-2]
				if(i != score.length-1){
					str += ","
				} else {
					str += " kickers"
				}
			}
			return str
		}
		case 4:{
			str += VALUES[score[1]-2] + " high straight"
			return str
		}
		case 5:{
			str += VALUES[score[1]-2] + " high flush "
			if(score.length > 2){
				str += "with "
			}
			for(let i = 2; i < score.length; i++){
				str += VALUES[score[i]-2]
				if(i != score.length-1){
					str += ","
				}
			}
			return str
		}
		case 6:{
			str += VALUES[score[1]-2]+"s full of "+VALUES[score[2]-2]+"s"
			return str
		}
		case 7:{
			str += "Four of a kind of "+VALUES[score[1]-2]+"s "
			if(score.length > 3){
				str += "with "+VALUES[score[2]-2]+" kicker"
			}
			return str
		}
		case 8:{
			str += VALUES[score[1]-2] + " high straight flush"
			return str
		}
	}
}

function getHandScore(hand){
	hand.sort(function(card1,card2){
		return VALUES_MAP.get(card2.value) - VALUES_MAP.get(card1.value)
	})
	let score = getScoreStraightFlush(hand)
	if(score.length != 0){
		return score
	}
	score = getScoreFourOfAKind(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreFullHouse(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreFlush(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreStraight(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreThreeOfAKind(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreTwoPair(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreTwoOfAKind(hand) 
	if(score.length != 0){
		return score
	}
	score = getScoreHighCard(hand) 
	if(score.length != 0){
		return score
	}
}

function getScoreStraightFlush(hand){
	let countMap = new Map()
	let score = []
	for(let i = 0; i < hand.length; i++){
		let suit = hand[i].suit
		if(!countMap.has(suit)){
			countMap.set(suit,[])
		}
		let counts = countMap.get(suit)
		counts.push(VALUES_MAP.get(hand[i].value))
	}
	for(let i = 0; i < SUITS.length; i++){
		if(countMap.has(SUITS[i])){
			let counts = countMap.get(SUITS[i])
			if(counts.length >= 5){
				let streak = 1
				let startValue = -1
				for(let j = 0; j < counts.length; j++){
					if(startValue == counts[j]+streak){
						streak++
						if(streak == 5 || (streak == 4 && counts[0] == 14 && counts[j] == 2)){ // Account for wrapping
							score.push(8)
							score.push(startValue)
							break;
						}
					} else {
						startValue = counts[j]
						streak = 1
					}
				}
				break;
			}

		}
	}
	return score
}

function getScoreFourOfAKind(hand){
	let score = []
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(previousValue == value){
			streak++
			if(streak == 4){
				score.push(7)
				score.push(value)
				break;
			}
		} else {
			previousValue = value
			streak = 1
		}
	}
	if(score.length != 0){
		let numKickers = 0
		for(let i = 0; i < hand.length; i++){
			let value = VALUES_MAP.get(hand[i].value)
			if(value != previousValue){
				numKickers++;
				score.push(value);
				if(numKickers == 1){
					break
				}
			}
		}
	}
	return score
}

function getScoreFullHouse(hand){
	let score = []
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(previousValue == value){
			streak++
			if(streak == 3){
				break;
			}
		} else {
			previousValue = value
			streak = 1
		}
	}
	if(streak != 3){
		return score
	}
	let firstPair = previousValue
	previousValue = -1;
	streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(value != firstPair){
			if(previousValue == value ){
				streak++
				if(streak == 2){
					score.push(6)
					score.push(firstPair)
					score.push(value)
					break;
				}
			} else {
				previousValue = value
				streak = 1
			}
		}
	}
	return score
}

function getScoreFlush(hand){
	let countMap = new Map()
	let score = []
	for(let i = 0; i < hand.length; i++){
		let suit = hand[i].suit
		if(!countMap.has(suit)){
			countMap.set(suit,[])
		}
		let counts = countMap.get(suit)
		counts.push(VALUES_MAP.get(hand[i].value))
		if(counts.length == 5){
			score.push(5)
			for(let j = 0; j < counts.length; j++){
				score.push(counts[j])
			}
			break;
		}
	}
	return score
}

function getScoreStraight(hand){ // Ace
	let score = []
	let startValue = -1;
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(startValue == value+streak){
			streak++
			if(streak == 5 || (streak == 4 && VALUES_MAP.get(hand[0].value) == 14  && VALUES_MAP.get(hand[i].value) == 2)){ // Account for wrapping
				score.push(4)
				score.push(startValue)
				break;
			}
		} else if (startValue == previousValue) {
			// Just skip over it
		} else {
			startValue = value
			streak = 1
		}
		previousValue = value
	}
	return score
}

function getScoreThreeOfAKind(hand){
	let score = []
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(previousValue == value){
			streak++
			if(streak == 3){
				score.push(3)
				score.push(value)
				break;
			}
		} else {
			previousValue = value
			streak = 1
		}
	}
	if(score.length != 0){
		let numKickers = 0
		for(let i = 0; i < hand.length; i++){
			let value = VALUES_MAP.get(hand[i].value)
			if(value != previousValue){
				numKickers++;
				score.push(value);
				if(numKickers == 2){
					break
				}
			}
		}
	}
	return score
}

function getScoreTwoPair(hand){
	let score = []
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(previousValue == value){
			streak++
			if(streak == 2){
				break;
			}
		} else {
			previousValue = value
			streak = 1
		}
	}
	if(streak != 2){
		return score
	}
	let firstPair = previousValue
	previousValue = -1;
	streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(value != firstPair){
			if(previousValue == value ){
				streak++
				if(streak == 2){
					score.push(2)
					score.push(firstPair)
					score.push(value)
					break;
				}
			} else {
				previousValue = value
				streak = 1
			}
		}
	}
	if(score.length != 0){
		let numKickers = 0
		for(let i = 0; i < hand.length; i++){
			let value = VALUES_MAP.get(hand[i].value)
			if(value != previousValue && value != firstPair){
				numKickers++;
				score.push(value);
				if(numKickers == 1){
					break
				}
			}
		}
	}
	return score
}

function getScoreTwoOfAKind(hand){
	let score = []
	let previousValue = -1;
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(previousValue == value){
			streak++
			if(streak == 2){
				score.push(1)
				score.push(value)
				break;
			}
		} else {
			previousValue = value
			streak = 1
		}
	}
	if(score.length != 0){
		let numKickers = 0
		for(let i = 0; i < hand.length; i++){
			let value = VALUES_MAP.get(hand[i].value)
			if(value != previousValue){
				numKickers++;
				score.push(value);
				if(numKickers == 3){
					break
				}
			}
		}
	}
	return score
}

function getScoreHighCard(hand){
	let score = []
	score.push(0)
	for(let i = 0; i < hand.length; i++){
		score.push(VALUES_MAP.get(hand[i].value))
	}
	return score
}
module.exports = {
    sortHands: sortHands,
    getHandString: getHandString,
    getHandScore: getHandScore,
}