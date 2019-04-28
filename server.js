var express = require('express');
var socket = require('socket.io');
var port = process.env.PORT || 3000;
var app = express();
var server = app.listen(port);

app.use(express.static('public')); 

var io = socket(server);

io.sockets.on('connection', newConnection);

var VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"]
var VALUES_MAP = new Map([["2",2],
						["3",3],
						["4",4],
						["5",5],
						["6",6],
						["7",7],
						["8",8],
						["9",9],
						["10",10],
						["J",11],
						["Q",12],
						["K",13],
						["A",14],])
var SUITS  = ["Spades","Clubs","Hearts","Diamonds"]
var TABLE;

// https://stackoverflow.com/questions/19608923/socket-io-socket-on-wait-for-promise
// https://stackoverflow.com/questions/51488022/how-to-make-javascript-execution-wait-for-socket-on-function-response

function newConnection(socket){
	console.log('new connection ' + socket.id);
	// console.log('Sockets',io.sockets.sockets);
	if(Object.keys(io.sockets.sockets).length == 1){
		TABLE = new Table()
	}
	TABLE.addPlayer(socket.id)

	// socket.on('player', (player)=>{
	// 	TABLE.updatePlayer(socketId,player)	
	// });
	socket.on('disconnect', function(){
		TABLE.removePlayer(socket.id)
		console.log('user disconnected ' + socket.id);
	});
}

class Table {

	constructor(){
		this.players = []
		this.deck = new Deck()
		this.cards = []
		this.pot = 0
		this.currentBet = 0
		this.bigBlind = 100
		this.smallBlind = this.bigBlind/2
	}

	addPlayer(socketId){
		if(this.players.length >= 9){return}
		let player = new Player(socketId)
		this.players.push(player)
		console.log("Adding player "+socketId)
		if(this.players.length == 2){
			console.log("Starting game")
			this.dealCards()
		}
		this.updateAllPlayers()
		return player
	}

	updatePlayer(socketId,player){
		console.log("Updating Player: "+socketId)
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].socketId==socketId){
				if(this.players[i].isTurn && this.players[i].inHand){
					this.players[i].currentBet = player.currentBet
					this.players[i].stack = player.stack
					this.players[i].isTurn = false;
					this.updateAllPlayers()
				}
				return
			}
		}
		console.log("Player not found to update: "+socketId)
	}

	removePlayer(socketId){
		console.log("Removing Player: "+socketId)
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].socketId==socketId){
				this.players.splice(i,1)
				this.updateAllPlayers()
				return
			}
		}
		console.log("Player not found to remove: "+socketId)
	}

	moveBlinds(){
		this.players.push(this.players.shift())
	}

	updateAllPlayers(){
		console.log("Updating players")
		let cards = []
		for(let i = 0; i < this.players.length; i++){
			cards.push(JSON.parse(JSON.stringify(this.players[i].cards)))
			this.players[i].cards = []
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
			io.to(`${this.players[i].socketId}`).emit('table',this)
			this.players[i].cards = []
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
		}
	}

	isPotGood(){
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].inHand && this.players[i].currentBet != this.currentBet){
				return false
			}
		}
		console.log("Pot is good")
		return true;
	}

	isOneLeft(){
		let numInHand = 0;
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].inHand){
				numInHand++;
			}
		}
		console.log("Checking if one player is left", numInHand)
		return numInHand == 1;

	}

	async performBettingRound(i){
		i = (i+1)%this.players.length
		let numTurns = 0
		while((!this.isPotGood() || numTurns < this.players.length) && !this.isOneLeft()){ // is pot good doesn't account for BB check
			await this.players[i].getBet()
			// console.log("Player response: ",this.players[i])
			if(this.players[i].currentBet == this.currentBet){ // Call
				console.log("Player "+this.players[i].socketId+" called "+this.players[i].currentBet)

			} else if (this.players[i].currentBet < this.currentBet){ // Fold
				this.players[i].inHand = false
				console.log("Player "+this.players[i].socketId+" folded")
				// Maybe check if it's over
			} else { // Raise
				console.log("Player "+this.players[i].socketId+" raised to "+this.players[i].currentBet)
				this.currentBet = this.players[i].currentBet
				// Maybe shift players here idk
			}
			i = (i+1)%this.players.length
			numTurns++;
		}
		// Reset betting stuff

		for(let i = 0; i < this.players.length; i++){
			this.pot += this.players[i].currentBet;
			this.players[i].currentBet = 0;
			this.isTurn = false

		}
	}

	handleOnePersonRemaining(){
		if(this.isOneLeft()){
			let player;
			for(let i = 0; i < this.players.length; i++){
				if(this.players[i].inHand){
					player = this.players[i]
					break;
				}
			}
			console.log("Only Player "+player.socketId+" remains!")
			player.stack += this.pot;
			this.pot = 0;
			this.currentBet = 0
			this.dealCards()
			return true
		}
		return false
	}

	clearBoard(){
		this.deck = new Deck()
		this.cards = []
		this.pot = 0
		this.currentBet = 0
		for(let i = 0; i < this.players.length; i++){
			this.players[i].clearCards()
			this.players[i].currentBet = 0;
			this.players[i].inHand = true;
			this.players[i].isTurn = false;
		}
	}

	dealCards(){
		console.log("Dealing Cards")
		this.clearBoard()
		this.moveBlinds()
		for(let i = 0; i < this.players.length; i++){
			this.players[i].dealCard(this.deck.dealCard())
			this.players[i].dealCard(this.deck.dealCard())
		}
		this.updateAllPlayers()
		setTimeout(this.preflopBetting.bind(this),1000) // Wait 1s then start for animations?
		//setTimeout(this.dealCards.bind(this),1000) // Wait 1s then start for animations?
	}

	async preflopBetting(){
		console.log("Starting Preflop Betting")
		this.currentBet = this.bigBlind
		this.pot = 0;
		this.players[0].currentBet = Math.min(this.smallBlind,this.players[0].stack)
		this.players[0].stack -= this.players[0].currentBet
		this.players[1].currentBet = Math.min(this.bigBlind,this.players[1].stack)
		this.players[1].stack -= this.players[1].currentBet
		await this.performBettingRound(2)
		if(this.handleOnePersonRemaining()){
			return
		}
		this.dealFlop()
	}

	dealFlop(){
		console.log("Dealing Flop")
		this.deck.dealCard()
		this.cards.push(this.deck.dealCard())
		this.cards.push(this.deck.dealCard())
		this.cards.push(this.deck.dealCard())
		this.updateAllPlayers()
		setTimeout(this.postFlopBetting.bind(this),1000)
	}

	async postFlopBetting(){
		console.log("Starting Post Flop Betting")
		this.currentBet = 0
		await this.performBettingRound(0)
		if(this.handleOnePersonRemaining()){
			return
		}
		this.dealTurn()
	}

	dealTurn(){
		console.log("Dealing Turn")
		this.deck.dealCard()
		this.cards.push(this.deck.dealCard())
		setTimeout(this.postTurnBetting.bind(this),1000)
	}

	async postTurnBetting(){
		console.log("Starting Post Turn Betting")
		this.currentBet = 0
		await this.performBettingRound(0)
		if(this.handleOnePersonRemaining()){
			return
		}
		this.dealRiver()
	}

	dealRiver(){
		console.log("Dealing River")
		this.deck.dealCard()
		this.cards.push(this.deck.dealCard())
		setTimeout(this.postRiverBetting.bind(this),1000)
	}

	async postRiverBetting(){
		console.log("Starting Post River Betting")
		this.currentBet = 0
		await this.performBettingRound(0)
		if(this.handleOnePersonRemaining()){
			return
		}
		this.showdown()
	}

	showdown(){
		console.log("Starting Showdown")
		let hands = []
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].inHand){
				let hand = []
				for(let j = 0; j < this.players[i].cards.length; j++){
					hand.push(JSON.parse(JSON.stringify(this.players[i].cards[j])))
				}
				for(let j = 0; j < this.cards.length; j++){
					hand.push(JSON.parse(JSON.stringify(this.cards[j])))
				}
				hands.push([i,hand])
			}
		}
		hands = sortHands(hands)
		let winner = this.players[hands[0][0]];
		console.log(JSON.stringify(hands))
		console.log("Player "+winner.socketId+" has won!")
		winner.stack += this.pot;
		this.pot = 0;
		this.currentBet = 0
		this.dealCards()
	}

}

class Player {

	constructor(socketId){
		this.cards = []
		this.socketId = socketId
		this.stack = 10000
		this.currentBet = 0
		this.inHand = false
		this.isTurn = false
	}

	dealCard(card){
		this.cards.push(card)
		this.inHand = true
	}

	clearCards(){
		this.cards.length = 0;
	}

	async getBet() {
		let getResponse = function() {
			return new Promise((resolve, reject) => {
				console.log("Getting bet from "+this.socketId)
				let timer;
				this.isTurn = true;
				TABLE.updateAllPlayers()
		
				function responseHandler(message) {
					console.log("Player responded to bet")
					resolve(message);
					clearTimeout(timer);
				}
				io.sockets.connected[this.socketId].once('player', responseHandler);
				// io.to(`${this.socketId}`).once('player', responseHandler); 
		
				// set timeout so if a response is not received within a 
				// reasonable amount of time, the promise will reject
				timer = setTimeout(function(){
					console.log("Player took too long to respond to bet")
					// reject(new Error("timeout waiting for msg"));
					resolve(this)
					// io.sockets.connected[this.socketId].removeListener('player', responseHandler);
					if(io.sockets.connected[this.socketId]){
						io.sockets.connected[this.socketId].off('player',responseHandler);
					}
				}.bind(this), 300*1000);
		
			});
		}.bind(this)
		let response = await getResponse();
		// console.log("Response: ",response)
		TABLE.updatePlayer(this.socketId,response)
	}

	updatePlayer(){
		let cards = []
		for(let i = 0; i < TABLE.players.length; i++){
			cards.push(JSON.parse(JSON.stringify(TABLE.players[i].cards)))
			if(this.socketId == TABLE.players[i].socketId){
			}
			else{
				TABLE.players[i].cards = []
			}
		}
		io.to(`${this.socketId}`).emit('table',TABLE)
		for(let i = 0; i < this.players.length; i++){
			TABLE.players[i].cards = cards[i]
		}
	}


}

class Deck {
	
	constructor(){
		this.cards = []
		this.makeDeck()
		this.shuffleDeck()
	}

	makeDeck(){
		this.cards = []
		for(let i = 0; i < SUITS.length; i++){
			for(let j = 0; j < VALUES.length; j++){
				this.cards.push(new Card(SUITS[i],VALUES[j]))
			}
		}
	}

	shuffleDeck(){
		let currentIndex = this.cards.length; 
		let temporaryValue;
		let randomIndex;
		while (0 !== currentIndex) {
		  randomIndex = Math.floor(Math.random() * currentIndex);
		  currentIndex -= 1;
		  temporaryValue = this.cards[currentIndex];
		  this.cards[currentIndex] = this.cards[randomIndex];
		  this.cards[randomIndex] = temporaryValue;
		}
	}

	dealCard(){
		return this.cards.shift();
	}

}

class Card {

	constructor(suit,value){
		this.suit = suit
		this.value = value
	}

}

function sortHands(hands){
	console.log("Sorting hands")
	sortCards(hands)
	getScoresForAllHands(hands)
	hands.sort(compareScores)
	return hands
}

function sortCards(hands){
	for(let i = 0; i < hands.length; i++){
		let hand = hands[i][1]
		hand.sort(function(card1,card2){
			return VALUES_MAP.get(card2.value) - VALUES_MAP.get(card1.value)
		})
	}
}

function getScoresForAllHands(hands){
	for(let i = 0; i < hands.length; i++){
		let hand = hands[i][1]
		hands[i].push(getHandScore(hand))
	}
}

function compareScores(score1,score2){ // Ret + if score2 is better
	for(let i = 0; i < score1.length; i++){
		if(score1[i] != score2[i]){
			score2[i] - score1[i]
		}
	}
}

function getHandScore(hand){
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
	let streak = 1
	for(let i = 0; i < hand.length; i++){
		let value = VALUES_MAP.get(hand[i].value)
		if(startValue == value+streak){
			streak++
			if(streak == 5 || (streak == 4 && VALUES_MAP.get(hand[0].value) == 14  && counts[j] == 2)){ // Account for wrapping
				score.push(4)
				score.push(startValue)
				break;
			}
		} else if (startValue == value) {
			// Just skip over it
		} else {
			startValue = value
			streak = 1
		}
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
	for(let i = 0; i < 5; i++){
		score.push(VALUES_MAP.get(hand[i].value))
	}
	return score
}

