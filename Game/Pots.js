class Pots {

	constructor(){
		this.pots = [[0,0]]
		// Current pot needed or always last?
	}

	addBettingRoundToPot(players){
		//let players = TABLE.players
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

module.exports = Pots;
