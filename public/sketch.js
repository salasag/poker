var socket;
var CANVAS_WIDTH;
var CANVAS_HEIGHT;
var table;
var tableView;
var player;
var isBetting = false;
var IMAGE_2;
var IMAGE_3;
var IMAGE_4;
var IMAGE_5;
var IMAGE_6;
var IMAGE_7;
var IMAGE_8;
var IMAGE_9;
var IMAGE_10;
var IMAGE_JACK;
var IMAGE_QUEEN;
var IMAGE_KING;
var IMAGE_ACE;
var IMAGE_DIAMOND;
var IMAGE_CLUB;
var IMAGE_HEART;
var IMAGE_SPADE;
var FONT;
var CARD_SIZE_RATIO = 8/5;
var messages = [];


function preload(){
  FONT = loadFont("assets/emulogic.ttf")
  IMAGE_2     = loadImage('assets/2.png');
  IMAGE_3     = loadImage('assets/3.png');
  IMAGE_4     = loadImage('assets/4.png');
  IMAGE_5     = loadImage('assets/5.png');
  IMAGE_6     = loadImage('assets/6.png');
  IMAGE_7     = loadImage('assets/7.png');
  IMAGE_8     = loadImage('assets/8.png');
  IMAGE_9     = loadImage('assets/9.png');
  IMAGE_10    = loadImage('assets/10.png');
  IMAGE_JACK  = loadImage('assets/jack.png');
  IMAGE_QUEEN = loadImage('assets/queen.png');
  IMAGE_KING  = loadImage('assets/king.png');
  IMAGE_ACE   = loadImage('assets/ace.png');
  IMAGE_DIAMOND = loadImage('assets/diamond.png');
  IMAGE_CLUB    = loadImage('assets/club.png');
  IMAGE_HEART   = loadImage('assets/heart.png');
  IMAGE_SPADE   = loadImage('assets/spade.png');
}

function setup(){
   cnv = createCanvas(windowWidth, windowHeight);
   CANVAS_WIDTH  = windowWidth;
   CANVAS_HEIGHT = windowHeight;
   socket = io.connect();
   console.log(io)
   //textFont(FONT)
   textAlign(LEFT, TOP);
   socket.on('table', updateTableInfo);
   socket.on('message', addMessage);
   background(255)
}

function updateTableInfo(data){
  console.log(data)
  if(!table){} // On init
  table = data
  for(let i = 0; i < table.players.length; i++){
    if(table.players[i].socketId == socket.id){
      player = table.players[i];
      break;
    }
  }
  tableView = new Table(0,0,CANVAS_WIDTH,CANVAS_HEIGHT)
}

function addMessage(message){
  messages.push(message)
  if(messages.length > 10){
    messages.shift()
  }
}

function mouseClicked() {
  if(tableView){
    tableView.handleMouseClick()
  }
}

function draw(){
  drawObjects();
}

function drawObjects(){
  background(255)
  if(tableView){
    tableView.draw()
  }
}

function drawCards(){
  if(!player || !player.cards){
    return
  }
  let cardScreenRatio = .1*player.cards.length;
  let cardWidth = cardScreenRatio*CANVAS_WIDTH/player.cards.length
  let cardHeight = cardWidth*CARD_SIZE_RATIO;
  for(let i = 0; i < player.cards.length; i++){
    let x = CANVAS_WIDTH*(1-cardScreenRatio)/2+i*cardWidth
    let y = CANVAS_HEIGHT-cardHeight
    if(isMouseWithin(x,y,cardWidth,cardHeight)){
      let selectScale = 1.2
      drawCard(player.cards[i].suit,player.cards[i].value,x-cardWidth*(selectScale-1)/2,y-cardHeight*(selectScale-1)/2,cardWidth*selectScale,cardHeight*selectScale)
    }
    else{
      drawCard(player.cards[i].suit,player.cards[i].value,x,y,cardWidth,cardHeight)
    }
  }
}

function drawCard(suit,value,x,y,width,height,orientation){
  let suitSize = .1
  let valueSize = .1
  let borderSize = .1
  fill(200)
  stroke(0)
  rect(x,y,width,height,width*borderSize)
  if(!suit || !value){return}
  drawSuit(suit,x+width*borderSize,y+height*(borderSize+valueSize),suitSize*width,suitSize*height)
  drawSuit(suit,x+width*(1-suitSize-borderSize),y+height*(1-suitSize-borderSize-valueSize),suitSize*width,suitSize*height)
  drawValue(value,x+width*borderSize,y+height*(borderSize),valueSize*width,valueSize*height)
  drawValue(value,x+width*(1-valueSize-borderSize),y+height*(1-borderSize-valueSize),valueSize*width,valueSize*height)
  drawValueImage(value,x+width*(borderSize+suitSize),y+height*(borderSize+suitSize),width*(1-2*(borderSize+suitSize)),height*(1-2*(borderSize+suitSize)))
}

function drawSuit(suit,x,y,width,height){
  switch(suit) {
    case "Spades":
      image(IMAGE_SPADE,x,y,width,height)
      break;
    case "Clubs":
      image(IMAGE_CLUB,x,y,width,height)
      break;
    case "Hearts":
      image(IMAGE_HEART,x,y,width,height)
      break;
    case "Diamonds":
      image(IMAGE_DIAMOND,x,y,width,height)
      break;
    default:
  }
}

function drawValue(value,x,y,width,height){
  fill(0)
  text(value,x,y)
}

function drawValueImage(value,x,y,width,height){
  switch(value) {
    case "2":
      image(IMAGE_2,x,y,width,height)
      break;
    case "3":
      image(IMAGE_3,x,y,width,height)
      break;
    case "4":
      image(IMAGE_4,x,y,width,height)
      break;
    case "5":
      image(IMAGE_5,x,y,width,height)
      break;
    case "6":
      image(IMAGE_6,x,y,width,height)
      break;
    case "7":
      image(IMAGE_7,x,y,width,height)
      break;
    case "8":
      image(IMAGE_8,x,y,width,height)
      break;
    case "9":
      image(IMAGE_9,x,y,width,height)
      break;
    case "10":
      image(IMAGE_10,x,y,width,height)
      break;
    case "J":
      image(IMAGE_JACK,x,y,width,height)
      break;
    case "Q":
      image(IMAGE_QUEEN,x,y,width,height)
      break;
    case "K":
      image(IMAGE_KING,x,y,width,height)
      break;
    case "A":
      image(IMAGE_ACE,x,y,width,height)
      break;
    default:
  }
}

function drawBetting(){
  if(!player){
    return
  }
  //if(player.isTurn){
    let bets = new BettingOptions(CANVAS_WIDTH/2,CANVAS_HEIGHT/2,CANVAS_WIDTH/4,CANVAS_HEIGHT/4,100)
    bets.draw()
  // }
}

function isMouseWithin(x,y,width,height){
  return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height
}

class Table {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    let otherPlayersWidthInset = width/5
    let otherPlayersHeightInset = height/3
    let playerHeight = height/3
    this.otherPlayers = new OtherPlayers(x,y,width,height,otherPlayersWidthInset,otherPlayersHeightInset)
    this.sharedTable = new SharedTable(x+otherPlayersWidthInset,y+otherPlayersHeightInset,width-2*otherPlayersWidthInset,height-otherPlayersHeightInset-playerHeight)
    this.playerUI = new PlayerUI(x+otherPlayersWidthInset,height-playerHeight,width-2*otherPlayersWidthInset,playerHeight)
  }

  draw(){
    this.otherPlayers.draw()
    this.sharedTable.draw()
    this.playerUI.draw()
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.otherPlayers.handleMouseClick()
      this.sharedTable.handleMouseClick()
      this.playerUI.handleMouseClick()
    }
  }
}

class OtherPlayers{

  constructor(x,y,width,height,widthInset,heightInset){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.widthInset = widthInset
    this.heightInset = heightInset
  }

  draw(){
    if(!table || !table.players){
      return
    }
    fill(200)
    stroke(0)
    let numPlayers = table.players.length-1;
    let numLeft = Math.floor((numPlayers+1)/4);
    let numTop = Math.floor((numPlayers+3)/4)+Math.floor((numPlayers+2)/4);
    let numRight = Math.floor((numPlayers)/4);
    let cardWidth = Math.min((this.height-this.heightInset)/(numLeft+.01),this.width/(numTop+.01),(this.height-this.heightInset)/(numRight+.01))/4
    let cardHeight = Math.min(this.widthInset,this.heightInset)
    cardWidth = Math.min(cardWidth,cardHeight/CARD_SIZE_RATIO)
    cardHeight = cardWidth*CARD_SIZE_RATIO
    let currentPlayerIndex = 0
    for(let i = 0; i < table.players.length; i++){
      if(table.players[i].socketId == socket.id){
        currentPlayerIndex = i
      }
    }
    for(let i = 0; i < numLeft; i++){
      drawOtherPlayer(this.x,this.y+this.heightInset+i*(this.height-this.heightInset)/numLeft,this.widthInset,(this.height-this.heightInset)/numLeft,cardWidth,cardHeight,(currentPlayerIndex+(numLeft-i-1)+1)%table.players.length,"left")
    }
    for(let i = 0; i < numTop; i++){
      drawOtherPlayer(this.x+i*(this.width)/numTop,this.y,this.width/numTop,this.heightInset,cardWidth,cardHeight,(currentPlayerIndex+numLeft+i+1)%table.players.length,"top")
    }
    for(let i = 0; i < numRight; i++){
      drawOtherPlayer(this.x+this.width-this.widthInset,this.y+this.heightInset+i*(this.height-this.heightInset)/numLeft,this.widthInset,(this.height-this.heightInset)/numLeft,cardWidth,cardHeight,(currentPlayerIndex+numLeft+numTop+i+1)%table.players.length,"right")
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height) && !isMouseWithin(this.x+this.widthInset,this.y+this.heightInset,this.width-2*this.widthInset,this.height-this.heightInset)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }

}

function drawOtherPlayer(x,y,width,height,cardWidth,cardHeight,playerIndex,orientation){
  let player = table.players[playerIndex]
  let insetRatio = .05
  if(player.isTurn){
    fill([50,100,50])
  } else if(player.inHand){
    fill([100,70,50])
  } else if(!player.inHand){
    fill(150)
  }
  rect(x,y,width,height)
  fill(255)
  // noStroke()
  rect(x+width*insetRatio,y+height*insetRatio,width*(1-2*insetRatio),height*(1-2*insetRatio))
  stroke(0)
  fill(0)
  if(orientation=="left"){
    text(player.name,x,y)
    text("Stack: "+player.stack,x,y+height/2/4)
    text("Current Bet: "+player.currentBet,x,y+height/2*2/4)
    text("Total Bet: "+player.totalBet,x,y+height/2*3/4)
    drawCard(player.cards[0]?player.cards[0].suit:player.cards[0],player.cards[0]?player.cards[0].value:player.cards[0],
             x,y+height/2,cardHeight,cardWidth,orientation)
    drawCard(player.cards[1]?player.cards[1].suit:player.cards[1],player.cards[1]?player.cards[1].value:player.cards[1],
             x,y+height/2+cardWidth,cardHeight,cardWidth,orientation)
  } else if(orientation=="top"){
    text(player.name,x+width/2,y)
    text("Stack: "+player.stack,x+width/2,y+height/4)
    text("Current Bet: "+player.currentBet,x+width/2,y+height*2/4)
    text("Total Bet: "+player.totalBet,x+width/2,y+height*3/4)
    drawCard(player.cards[0]?player.cards[0].suit:player.cards[0],player.cards[0]?player.cards[0].value:player.cards[0],
             x+width/2-2*cardWidth,y,cardWidth,cardHeight,orientation)
    drawCard(player.cards[1]?player.cards[1].suit:player.cards[1],player.cards[1]?player.cards[1].value:player.cards[1],
             x+width/2-cardWidth,y,cardWidth,cardHeight,orientation)
  } else if(orientation=="right"){
    text(player.name,x,y)
    text("Stack: "+player.stack,x,y+height/2/4)
    text("Current Bet: "+player.currentBet,x,y+height/2*2/4)
    text("Total Bet: "+player.totalBet,x,y+height/2*3/4)
    drawCard(player.cards[0]?player.cards[0].suit:player.cards[0],player.cards[0]?player.cards[0].value:player.cards[0],
             x+width-cardHeight,y+height/2,cardHeight,cardWidth,orientation)
    drawCard(player.cards[1]?player.cards[1].suit:player.cards[1],player.cards[1]?player.cards[1].value:player.cards[1],
             x+width-cardHeight,y+height/2+cardWidth,cardHeight,cardWidth,orientation)
  }
}


class SharedTable {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.tableCards = new TableCards(this.x,this.y,this.width,this.height*2/3)
    this.tablePots = new TablePots(this.x,this.y+this.height*2/3,this.width/2,this.height/6)
    this.tableInfo = new TableInfo(this.x,this.y+this.height*(2/3+1/6),this.width/2,this.height/6)
    this.tableMessages = new TableMessages(this.x+this.width/2,this.y+this.height*(2/3),this.width/2,this.height/3)
  }

  draw(){
    this.tableCards.draw()
    this.tablePots.draw()
    this.tableInfo.draw()
    this.tableMessages.draw()
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.tableCards.handleMouseClick()
      this.tablePots.handleMouseClick()
      this.tableInfo.handleMouseClick()
      this.tableMessages.handleMouseClick()
    }
  }

}

class TableCards {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(){
    let cardHeight = this.height
    let cardWidth = cardHeight/CARD_SIZE_RATIO
    if(cardWidth*table.cards.length > this.width){
      cardWidth = this.width/table.cards.length
      cardHeight = cardWidth * CARD_SIZE_RATIO
    }
    if(table.cards.length==3){
      for(let i = 0; i < table.cards.length; i++){
        let x = this.x+this.width/2-cardWidth*3/2+cardWidth*i
        drawCard(table.cards[i].suit,table.cards[i].value,x,this.y,cardWidth,cardHeight)
      }
    } else if(table.cards.length==4) {
      for(let i = 0; i < table.cards.length; i++){
        let x = this.x+this.width/2-cardWidth*2+cardWidth*i
        drawCard(table.cards[i].suit,table.cards[i].value,x,this.y,cardWidth,cardHeight)
      }
    } else if(table.cards.length==5) {
      for(let i = 0; i < table.cards.length; i++){
        let x = this.x+this.width/2-cardWidth*5/2+cardWidth*i
        drawCard(table.cards[i].suit,table.cards[i].value,x,this.y,cardWidth,cardHeight)
      }
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }

}

class TableInfo {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(){
    text("Current Bet: "+table.currentBet,this.x,this.y);
    text("Big Blind: "+table.bigBlind,this.x,this.y+this.height/3);
    text("Small Blind: "+table.smallBlind,this.x,this.y+this.height*2/3);
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }

}

class TablePots {
  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  draw(){
    fill(0)
    for(let i = 0; i < table.pots.pots.length; i++){
      text("Pot "+(i+1)+": "+table.pots.pots[i][1],this.x+this.width/table.pots.pots.length*i,this.y)
    }
    let roundBet = 0
    for(let i = 0; i < table.players.length; i++){
      roundBet += table.players[i].currentBet
    }
    text("Total bets in round: "+roundBet,this.x,this.y+this.height/2)
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }
}

class TableMessages {
  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(){
    fill(0)
    for(let i = 0; i < messages.length; i++){
      text(messages[i],this.x,this.y+this.height/messages.length*i)
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }
}

class PlayerUI {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.playerStats = new PlayerInfo(x,y,width,height/3)
    this.playerCards = new PlayerCards(x,y+height/3,width/2,height*2/3)
    this.bettingUI = new BettingUI(x+width/2,y+height/3,width/2,height*2/3)
  }

  draw(){
    
    let insetRatio = .05
    if(player.isTurn){
      fill([50,100,50])
    } else if(player.inHand){
      fill([100,70,50])
    } else if(!player.inHand){
      fill(150)
    }
    rect(this.x,this.y,this.width,this.height)
    fill(255)
    // noStroke()
    rect(this.x+this.width*insetRatio,this.y+this.height*insetRatio,this.width*(1-2*insetRatio),this.height*(1-2*insetRatio))
    stroke(0)
    fill(0)
    this.playerStats.draw()
    this.playerCards.draw()
    if(player.isTurn){
      this.bettingUI.draw()
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.playerStats.handleMouseClick()
      this.playerCards.handleMouseClick()
      if(player.isTurn){
        this.bettingUI.handleMouseClick()
      }
    }
  }
}

class PlayerInfo {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(){
    if(!player || !player.cards){
      return
    }
    fill(0)
    text(player.name,this.x,this.y);
    text("Stack: "+player.stack,this.x,this.y+this.height/4);
    text("Current Bet: "+player.currentBet,this.x,this.y+this.height*2/4);
    text("Total Bet: "+player.totalBet,this.x,this.y+this.height*3/4);
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }

}

class PlayerCards {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(){
    if(!player || !player.cards){
      return
    }
    let cardWidth = this.width/2
    let cardHeight = cardWidth*CARD_SIZE_RATIO;
    if(this.width/2*CARD_SIZE_RATIO > this.height){
      cardWidth = this.height/CARD_SIZE_RATIO
      cardHeight = this.height;
    }
    for(let i = 0; i < player.cards.length; i++){
      let x = this.x+(this.width-cardWidth*2)/2+i*cardWidth
      let y = this.y+this.height-cardHeight
      if(isMouseWithin(x,y,cardWidth,cardHeight)){
        let selectScale = 1.2
        drawCard(player.cards[i].suit,player.cards[i].value,x-cardWidth*(selectScale-1)/2,y-cardHeight*(selectScale-1)/2,cardWidth*selectScale,cardHeight*selectScale)
      }
      else{
        drawCard(player.cards[i].suit,player.cards[i].value,x,y,cardWidth,cardHeight)
      }
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){

    }
  }

}

class BettingUI {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.fold = new Button(x,y,width/3,height,"Fold",()=>{
      socket.emit('player',player)
      console.log("Folded")
    })
    this.call = new Button(x+width/3,y,width/3,height,table.currentBet==player.currentBet?"Check":"Call",()=>{
      if(table.currentBet-player.currentBet > player.stack){
        player.currentBet += player.stack
        player.stack -= player.stack
        player.totalBet += player.stack;
      } else {
        player.stack -= table.currentBet-player.currentBet
        player.totalBet += table.currentBet-player.currentBet
        player.currentBet = table.currentBet
      }
      socket.emit('player',player)
      console.log("Called "+player.currentBet)
    })
    let slider = new Slider(x+width*2/3,y+height*3/4,width/3,height/4,(table.currentBet+table.bigBlind)>player.stack?1:table.currentBet+table.bigBlind,player.stack+player.currentBet)
    this.slider = slider
    this.raise = new Button(x+width*2/3,y,width/3,height*3/4,"Raise",()=>{
      player.stack -= (slider.getValue() - player.currentBet)
      player.totalBet += (slider.getValue() - player.currentBet);
      player.currentBet = slider.getValue()
      socket.emit('player',player)
      console.log("Raised "+player.currentBet)
    })
  }

  draw(){
    textSize(10)
    if(table.currentBet != 0){
      this.fold.draw()
    }
    this.call.draw()
    if(player.stack > table.currentBet){
      this.raise.draw()
      this.slider.draw()
    }
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      if(table.currentBet != 0){
        this.fold.handleMouseClick()
      }
      this.call.handleMouseClick()
      if(player.stack > table.currentBet){
        this.raise.handleMouseClick()
        this.slider.handleMouseClick()
      }
    }
  }
}

class Button {

  constructor(x,y,width,height,text,callback){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.text = text
    this.callback = callback
  }
  
  draw(){
    fill(255)
    rect(this.x,this.y,this.width,this.height)
    fill(0)
    text(this.text,this.x,this.y)  
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.callback()
    }
  }

}

class Slider {

  constructor(x,y,width,height,bottomValue,topValue){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.bottomValue = bottomValue<=0?1:bottomValue
    this.topValue = topValue
    console.log(this.topValue)
    this.currentValue = bottomValue;
    this.mouseX = x
  }

  draw(){
    fill(255)
    rect(this.x,this.y,this.width,this.height)
    fill(200)
    rect(this.mouseX,this.y,this.width+this.x-this.mouseX,this.height)
    fill(0)
    text("Raise: "+this.currentValue,this.x,this.y)
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      if((mouseX-this.x)/this.width< 0.5){
        this.currentValue = Math.floor(this.bottomValue*Math.pow(this.topValue/(this.bottomValue),Math.floor((mouseX-this.x)/this.width*25)/25))
      } else {
        this.currentValue = Math.ceil(this.bottomValue*Math.pow(this.topValue/(this.bottomValue),Math.ceil((mouseX-this.x)/this.width*25)/25))
      }
      this.currentValue = Math.max(this.bottomValue,Math.min(this.topValue,this.currentValue))
      this.mouseX = mouseX
    }
  }

  getValue(){
    return this.currentValue
  }

}
