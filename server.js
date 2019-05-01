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
var STARTING_STACK_AMOUNT = 10000;

// https://stackoverflow.com/questions/19608923/socket-io-socket-on-wait-for-promise
// https://stackoverflow.com/questions/51488022/how-to-make-javascript-execution-wait-for-socket-on-function-response

function newConnection(socket){
	console.log('new connection ' + socket.id);
	// console.log('Sockets',io.sockets.sockets);
	if(Object.keys(io.sockets.sockets).length == 1){
		TABLE = new Table()
	}
	TABLE.queuePlayerAddition(socket.id)

	// socket.on('player', (player)=>{
	// 	TABLE.updatePlayer(socketId,player)	
	// });
	socket.on('disconnect', function(){
		TABLE.queuePlayerRemoval(socket.id)
		console.log('user disconnected ' + socket.id);
	});
}

function sendMessage(message){
	io.emit('message',message)
}

class Table {

	constructor(){
		this.players = []
		this.playersToRemove = []
		this.playersToAdd = []
		this.deck = new Deck()
		this.cards = []
		this.pots = new Pots()
		this.currentBet = 0
		this.timeLeft = 0
		this.bigBlind = 100
		this.smallBlind = this.bigBlind/2
		this.gameStarted = false
	}

	queuePlayerAddition(socketId){
		if(!this.gameStarted){
			this.addPlayer(socketId)
			return
		}
		for(let i = 0; i < this.playersToRemove.length; i++){
			if(this.playersToRemove[i] == socketId){
				this.playersToRemove.splice(i,1)
				return
			}
		}
		this.playersToAdd.push(socketId)
	}

	addQueuedPlayers(){
		while(this.playersToAdd.length!=0){
			this.addPlayer(this.playersToAdd.shift())
		}
		this.updateAllPlayers()
	}

	addPlayer(socketId){
		if(this.players.length >= 9){return}
		let player = new Player(socketId)
		this.players.push(player)
		this.updateAllPlayers()
		console.log("Adding player "+socketId)
		if(this.players.length == 2){
			console.log("Starting game")
			this.gameStarted = true
			setTimeout(this.dealCards.bind(this),10*1000)
		}
		return player
	}

	updatePlayer(socketId,player){
		console.log("Updating Player: "+socketId)
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].socketId==socketId){
				if(this.players[i].isTurn && this.players[i].inHand){
					this.players[i].currentBet = player.currentBet
					this.players[i].totalBet = player.totalBet
					this.players[i].stack = player.stack
					this.players[i].isTurn = false;
					this.updateAllPlayers()
				}
				return
			}
		}
		console.log("Player not found to update: "+socketId)
	}

	queuePlayerRemoval(socketId){
		if(!this.gameStarted){
			this.removePlayer(socketId)
			return
		}
		for(let i = 0; i < this.playersToAdd.length; i++){
			if(this.playersToAdd[i] == socketId){
				this.playersToAdd.splice(i,1)
				return
			}
		}
		// for(let i = 0; i < this.players.length; i++){
		// 	if(this.players[i].socketId==socketId && this.players[i].isTurn){
		// 		// Handle remove if turn
		// 		this.updatePlayer(socketId,this.players[i])
		// 	}
		// }
		this.playersToRemove.push(socketId)
	}

	removeQueuedPlayers(){
		while(this.playersToRemove.length!=0){
			this.removePlayer(this.playersToRemove.shift())
		}
		if(this.players.length < 2){
			this.gameStarted = false
		}
		this.updateAllPlayers()
	}

	removePlayer(socketId){
		console.log("Removing Player: "+socketId)
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].socketId==socketId){
				this.players.splice(i,1)
				break;
			}
		}
	}

	moveBlinds(){
		this.players.push(this.players.shift())
	}

	updateAllPlayers(){
		let cards = []
		let tempDeck = this.deck;
		this.deck = []
		for(let i = 0; i < this.players.length; i++){
			cards.push(JSON.parse(JSON.stringify(this.players[i].cards)))
			this.players[i].cards = []
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
			this.players[i].updateHandStrength()
			io.to(`${this.players[i].socketId}`).emit('table',this)
			this.players[i].handStrength = ""
			this.players[i].cards = []
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
		}
		this.deck = tempDeck
	}

	updateShowdownHands(){
		let cards = []
		let tempDeck = this.deck;
		this.deck = []
		for(let i = 0; i < this.players.length; i++){
			cards.push(JSON.parse(JSON.stringify(this.players[i].cards)))
			if(!this.players[i].inHand){
				this.players[i].cards = []
			}
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
			io.to(`${this.players[i].socketId}`).emit('table',this)
			if(!this.players[i].inHand){
				this.players[i].cards = []
			}
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
		}
		this.deck = tempDeck
	}

	isPotGood(){
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].inHand && (this.players[i].currentBet != this.currentBet && this.players[i].stack!=0)){
				return false
			}
		}
		return true;
	}

	playersInHand(){
		let numInHand = 0;
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].inHand){
				numInHand++;
			}
		}
		return numInHand;

	}

	playersAllIn(){
		let numInHand = 0;
		for(let i = 0; i < this.players.length; i++){
			if(this.players[i].stack == 0 && this.players[i].inHand){
				numInHand++;
			}
		}
		return numInHand;
	}

	async performBettingRound(i){
		i = (i)%this.players.length
		let numTurns = 0
		while((!this.isPotGood() || numTurns < this.players.length) && (this.playersInHand()>1) && ((this.playersInHand()-this.playersAllIn())>1 || !this.isPotGood())){
			if(this.players[i].inHand && this.players[i].stack != 0){
				await this.players[i].getBet() // Maybe check that player is in hand...
				// console.log("Player response: ",this.players[i])
				if(this.players[i].currentBet == this.currentBet || (this.players[i].currentBet < this.currentBet && this.players[i].stack == 0)){ // Call
					console.log("Player "+this.players[i].name+" called "+this.players[i].currentBet)
					sendMessage("Player "+this.players[i].name+(this.players[i].currentBet==0?" checked":" called "+this.players[i].currentBet))
				} else if (this.players[i].currentBet < this.currentBet && this.players[i].stack != 0){ // Fold
					this.players[i].inHand = false
					console.log("Player "+this.players[i].name+" folded")
					sendMessage("Player "+this.players[i].name+" folded")
				} else { // Raise
					console.log("Player "+this.players[i].name+" raised to "+this.players[i].currentBet)
					sendMessage("Player "+this.players[i].name+" raised to "+this.players[i].currentBet)
					this.currentBet = this.players[i].currentBet
				}
			}
			i = (i+1)%this.players.length
			numTurns++;
		}
		this.pots.addBettingRoundToPot()
	}

	handleOnePersonRemaining(){
		if(this.playersInHand() == 1){
			let player;
			for(let i = 0; i < this.players.length; i++){
				if(this.players[i].inHand){
					player = this.players[i]
					break;
				}
			}
			console.log("Only Player "+player.socketId+" remains!")
			player.stack += this.pots.payoutWinner(player.totalBet)
			if(this.pots.getTotalPotAmount()!=0){
				console.log("handleOnePersonRemaining: Last person not qualified for all the money")
			}
			this.dealCards()
			return true
		}
		return false
	}

	clearBoard(){
		this.deck = new Deck()
		this.cards = []
		this.pots = new Pots()
		this.currentBet = 0
		this.addQueuedPlayers()
		this.removeQueuedPlayers()
		for(let i = 0; i < this.players.length; i++){
			this.players[i].clearCards()
			this.players[i].currentBet = 0;
			this.players[i].totalBet = 0;
			this.players[i].inHand = true;
			this.players[i].isTurn = false;
			if(this.players[i].stack == 0){
				sendMessage("Player "+this.players[i].name+" busted. Rebuying for "+STARTING_STACK_AMOUNT)
				this.players[i].stack = STARTING_STACK_AMOUNT
			}
		}
	}

	dealCards(){
		console.log("Dealing Cards")
		this.clearBoard()
		if(!this.gameStarted){
			return
		}
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
		this.players[0].currentBet = Math.min(this.smallBlind,this.players[0].stack)
		this.players[0].totalBet += this.players[0].currentBet;
		this.players[0].stack -= this.players[0].currentBet
		this.players[1].currentBet = Math.min(this.bigBlind,this.players[1].stack)
		this.players[1].totalBet += this.players[1].currentBet;
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
		this.updateAllPlayers()
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
		this.updateAllPlayers()
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
		console.log(JSON.stringify(hands))
		console.log(JSON.stringify(this.pots))
		let i = 0;
		while(this.pots.getTotalPotAmount()!=0 && i < hands.length){ // TODO: Add split ties
			let tiedHands = hands[i]
			let payoutPerPerson = 0;
			for(let j = 0; j < tiedHands.length; j++){
				let winner = this.players[tiedHands[j][0]];
				let payout = this.pots.payoutWinner(winner.totalBet);
				payoutPerPerson += Math.ceil(payout/(tiedHands.length-j))
				winner.stack += payoutPerPerson
				if(payoutPerPerson!=0){
					sendMessage("Player "+winner.name+" has won "+payoutPerPerson+" with "+getHandString(tiedHands[j][2])+"!")
				}
			}
			i++;
		}
		if(this.pots.getTotalPotAmount()!=0){
			console.log("showdown: People not qualified for all the money")
		}
		this.updateShowdownHands()
		setTimeout(this.dealCards.bind(this),5*1000)
	}

}

class Player {

	constructor(socketId){
		this.cards = []
		this.socketId = socketId
		this.stack = STARTING_STACK_AMOUNT
		this.currentBet = 0
		this.totalBet = 0
		this.inHand = false
		this.isTurn = false
		this.handStrength = ""
		this.name = this.getRandomName()
	}

	getRandomName(){
		let names = ['Job','Dom','Jake','Jacob','Grey','Davin','Wyatt','Yatt','Doug',
					 'Alex','Tan','Alex Tan','Chostick','Inhee','Banaenae','Flying Arab',
					 'Shovel Hermit','Carissa','Kiley','Maddie Pots','Belinda','James',
					 'Parrp','LotsOfRamen69','EllenPage','Thomas','Fuck Lmao Almost Forgot About Devon',
					 'Devon','Dev','Lydia','Maddie Potts','Erin','Gary','June','Anna Thorton',
					 'Doug','Furrit','DMONEYTHE****','DMONEYTHEKING']
		let index = Math.floor(Math.random()*names.length)
		return names[index]
	}

	dealCard(card){
		this.cards.push(card)
		this.inHand = true
	}

	clearCards(){
		this.cards.length = 0;
	}

	updateHandStrength(){
		let hand = []
		for(let i = 0; i < this.cards.length; i++){
			hand.push(JSON.parse(JSON.stringify(this.cards[i])))
		}
		for(let i = 0; i < TABLE.cards.length; i++){
			hand.push(JSON.parse(JSON.stringify(TABLE.cards[i])))
		}
		let score = getHandScore(hand)
		this.handStrength = getHandString(score)
	}

	async getBet() {
		let getResponse = function() {
			return new Promise((resolve, reject) => {
				console.log("Getting bet from "+this.socketId)
				let timer;
				this.isTurn = true;
				let timeAmount = 60*1000
				TABLE.timeLeft = timeAmount

				TABLE.updateAllPlayers()
		
				function responseHandler(message) {
					console.log("Player responded to bet")
					resolve(message);
					clearTimeout(timer);
				}
				if(io.sockets.connected[this.socketId]){
					io.sockets.connected[this.socketId].once('player', responseHandler);
				} else {
					// Player disconnected
					this.inHand = false
					resolve(this);
				}
				timer = setTimeout(function(){
					console.log("Player took too long to respond to bet")
					resolve(this)
					if(io.sockets.connected[this.socketId]){
						io.sockets.connected[this.socketId].off('player',responseHandler);
					}
				}.bind(this), timeAmount);
		
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
	getScoresForAllHands(hands)
	hands.sort(compareScores)
	return mergeTies(hands)
}

function getScoresForAllHands(hands){
	for(let i = 0; i < hands.length; i++){
		let hand = hands[i][1]
		hands[i].push(getHandScore(hand))
	}
}

function compareScores(hand1,hand2){ // Ret + if score2 is better
	for(let i = 0; i < hand1[2].length; i++){
		if(hand1[2][i] != hand2[2][i]){
			return hand2[2][i] - hand1[2][i]
		}
	}
	return 0
}

function mergeTies(hands){
	console.log("Hands",JSON.stringify(hands))
	let ret = []
	let curTie = [hands[0]]
	for(let i = 0; i < hands.length-1; i++){
		if(compareScores(hands[i],hands[i+1])==0){
			curTie.push(hands[i+1])
		} else {
			curTie.sort((hand1,hand2)=>{ // Sorts lowest payout qualification to highest
				return TABLE.players[hand1[0]].totalBet - TABLE.players[hand2[0]].totalBet  
			})
			ret.push(curTie)
			curTie = [hands[i+1]]
		}
	}
	if(curTie.length!=0){
		curTie.sort((hand1,hand2)=>{ // Sorts lowest payout qualification to highest
			return TABLE.players[hand1[0]].totalBet - TABLE.players[hand2[0]].totalBet  
		})
		ret.push(curTie)
	}
	console.log("Ret",JSON.stringify(ret))
	return ret
}

class Pots {

	constructor(){
		this.pots = [[0,0]]
		// Current pot needed or always last?
	}

	addBettingRoundToPot(){
		let players = TABLE.players
		let newAllInFound = true
		let prevMinAllIn = 0 // Maybe do something here idk might be useless
		while(newAllInFound){
			newAllInFound = false;
			let minAllIn = 0
			for(let i = 0; i < players.length; i++){
				let player = players[i];
				if(player.currentBet > prevMinAllIn && player.stack == 0){
					if(!newAllInFound){
						newAllInFound = true
						minAllIn = player.currentBet;
					} else if(minAllIn > player.currentBet) {
						minAllIn = player.currentBet;
					}
				}
			}
			if(newAllInFound){
				let allInPot = 0
				for(let i = 0; i < players.length; i++){
					let player = players[i]
					let subtractAmount = Math.min(minAllIn,player.currentBet)
					player.currentBet -= subtractAmount
					allInPot += subtractAmount
				}
				this.addToPot(minAllIn,allInPot)
				this.makeNewPot()
			}
		}
		let allInPotRecent = 0
		let stakeNeeded = 0
		for(let i = 0; i < players.length; i++){
			let player = players[i]
			allInPotRecent += player.currentBet
			if(stakeNeeded < player.currentBet){
				stakeNeeded = player.currentBet
			}
			player.currentBet = 0
			if(stakeNeeded != 0 && player.currentBet != 0 && player.currentBet != stakeNeeded){
				console.log("addBettingRoundToPot: Potential error bets not uniform and no all in")
			}
		}
		this.addToPot(stakeNeeded,allInPotRecent)
	}

	addToPot(qualifier,amount){
		this.pots[this.pots.length-1][0] += qualifier
		this.pots[this.pots.length-1][1] += amount
	}

	makeNewPot(){
		this.pots.push([this.pots[this.pots.length-1][0],0]) // Start at old stake value
	}

	payoutWinner(stake){
		let payout = 0;
		for(let i = 0; i < this.pots.length; i++){
			if(this.pots[i][0] <= stake){
				payout += this.pots[i][1]
				this.pots[i] = [0,0]
			}
		}
		return payout
	}

	getTotalPotAmount(){
		let total = 0;
		for(let i = 0; i < this.pots.length; i++){
			total += this.pots[i][1]
		}
		return total
	}
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

