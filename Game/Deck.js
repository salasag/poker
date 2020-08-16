const Card = require('./Card.js');
const SUITS = require('./GameConstants.js')["SUITS"];
const VALUES = require('./GameConstants.js')["VALUES"];

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

module.exports = Deck;