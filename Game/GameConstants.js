var VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"]
var SUITS  = ["Spades","Clubs","Hearts","Diamonds"]
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
var STARTING_STACK_AMOUNT = 10000;

module.exports = {
    VALUES: VALUES,
    SUITS:  SUITS,
    VALUES_MAP: VALUES_MAP,
    STARTING_STACK_AMOUNT: STARTING_STACK_AMOUNT,
}