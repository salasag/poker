const Ranker = require('./Ranker.js');
const getHandScore = Ranker.getHandScore
const getHandString = Ranker.getHandString

class Player {

	constructor(socketId, stack){
		this.cards = []
		this.socketId = socketId
		this.stack = stack
		this.currentBet = 0
		this.totalBet = 0
		this.inHand = false
		this.isTurn = false
        this.handStrength = ""
		this.name = this.getRandomName()
	}

	getRandomName(){
		let names = ['Job','Dom','Jake','Jacob','Grey','Davin','Wyatt','Yatt','Doug',
					 'Alex','Tan','Alex Tan','Chostick','Inhee','Banaenae','Flying',
					 'Shovel Hermit','Carissa','Kiley','Maddie Pots','Belinda','James',
					 'Parrp','LotsOfRamen','EllenPage','Thomas',
					 'Devon','Dev','Lydia','Maddie','Erin','Gary','June','Anna',
					 'Doug','Furritt','DMONEYTHEKING']
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

	updateHandStrength(table){
		let hand = []
		for(let i = 0; i < this.cards.length; i++){
			hand.push(JSON.parse(JSON.stringify(this.cards[i])))
		}
		for(let i = 0; i < table.cards.length; i++){
			hand.push(JSON.parse(JSON.stringify(table.cards[i])))
		}
		let score = getHandScore(hand)
		this.handStrength = getHandString(score)
	}

	async getBet(io, table) {
		let getResponse = function() {
			return new Promise((resolve, reject) => {
				console.log("Getting bet from "+this.name)
				let timer;
				this.isTurn = true;
				let timeAmount = 60*1000
				table.timeLeft = timeAmount

				table.updateAllPlayers()
		
				function responseHandler(message) {
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
		table.updatePlayer(this.socketId,response)
	}

	updatePlayer(table){
		let cards = []
		for(let i = 0; i < table.players.length; i++){
			cards.push(JSON.parse(JSON.stringify(table.players[i].cards)))
			if(this.socketId == table.players[i].socketId){
			}
			else{
				table.players[i].cards = []
			}
		}
		io.to(`${this.socketId}`).emit('table',table)
		for(let i = 0; i < this.players.length; i++){
			table.players[i].cards = cards[i]
		}
	}
}

module.exports = Player;
