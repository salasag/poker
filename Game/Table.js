const Pots = require('./Pots.js');
const Player = require('./Player.js');
const Deck = require('./Deck.js');
const Ranker = require('./Ranker.js');
const sortHands = Ranker.sortHands
const getHandString = Ranker.getHandString
const GameConstants = require('./GameConstants.js');
const STARTING_STACK_AMOUNT = GameConstants.STARTING_STACK_AMOUNT;
const GameFunctions = require('./GameFunctions.js');
let sendMessage = GameFunctions.sendMessage
let io;

class Table {

	constructor(newIO){
        io = newIO
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
		if(this.players.length >= 9){
			console.log("Table full player "+socketId+" not added")
			return
		}
		let player = new Player(socketId,STARTING_STACK_AMOUNT)
		this.players.push(player)
		this.updateAllPlayers()
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
			this.players[i].handStrength = ""
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
			this.players[i].updateHandStrength(this)
			console.log(this)
			console.log("Updating players")

			io.to(`${this.players[i].socketId}`).emit('table',this)
			console.log("Updating players 3")
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
			} else {
				this.players[i].updateHandStrength(this)
			}
		}
		for(let i = 0; i < this.players.length; i++){
			this.players[i].cards = cards[i]
			this.players[i].updateHandStrength(this)
			io.to(`${this.players[i].socketId}`).emit('table',this)
			if(!this.players[i].inHand){
				this.players[i].cards = []
				this.players[i].handStrength = ""
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
				await this.players[i].getBet(io,this)
				if(this.players[i].currentBet == this.currentBet || (this.players[i].currentBet < this.currentBet && this.players[i].stack == 0)){ // Call
					sendMessage(io,"Player "+this.players[i].name+(this.players[i].currentBet==0?" checked":" called "+this.players[i].currentBet))
				} else if (this.players[i].currentBet < this.currentBet && this.players[i].stack != 0){ // Fold
					this.players[i].inHand = false
					sendMessage(io,"Player "+this.players[i].name+" folded")
				} else { // Raise
					sendMessage(io,"Player "+this.players[i].name+" raised to "+this.players[i].currentBet)
					this.currentBet = this.players[i].currentBet
				}
			}
			i = (i+1)%this.players.length
			numTurns++;
		}
		this.pots.addBettingRoundToPot(this.players)
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
			sendMessage(io,"Only Player "+player.name+" remains!")
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
				sendMessage(io,"Player "+this.players[i].name+" busted. Rebuying for "+STARTING_STACK_AMOUNT)
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
		hands = sortHands(this,hands)
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
					sendMessage(io,"Player "+winner.name+" has won "+payoutPerPerson+" with "+getHandString(tiedHands[j][2])+"!")
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

module.exports = Table;