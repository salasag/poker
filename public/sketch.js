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
   textFont(FONT)
   textAlign(LEFT, TOP);
   socket.on('table', updateTableInfo);
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
  // drawOtherPlayers()
  // drawPlayer()
}

function drawOtherPlayers(){
  if(!table || !table.players){
    return
  }
  fill(200)
  stroke(0)
  let numPlayers = table.players.length-1;
  let numLeft = Math.floor((numPlayers+1)/4);
  let numTop = Math.floor((numPlayers+3)/4)+Math.floor((numPlayers+2)/4);
  let numRight = Math.floor((numPlayers)/4);
  let cardScreenRatio = .08;
  let cardWidth = cardScreenRatio*CANVAS_WIDTH
  let cardHeight = cardWidth * CARD_SIZE_RATIO;
  for(let i = 0; i < numLeft; i++){
    let x = 0;
    let y = 0;
    if(numLeft==1){
      y = CANVAS_HEIGHT/2-cardWidth;
    } else {
      y = CANVAS_HEIGHT/4-cardWidth+i*CANVAS_HEIGHT/2;
    }
    rect(x,y,cardHeight,cardWidth,cardWidth*.1)
    rect(x,y+cardWidth,cardHeight,cardWidth,cardWidth*.1)
  }
  for(let i = 0; i < numTop; i++){
    let x = CANVAS_WIDTH-cardHeight;
    let y = 0;
    if(numTop%2==1){
      x = CANVAS_WIDTH/4-cardWidth+(Math.floor(i+(4-numTop)/2))*CANVAS_WIDTH/4;
    } else {
      x = CANVAS_WIDTH/5-cardWidth+(Math.floor(i+(4-numTop)/2))*CANVAS_WIDTH/5;
    }
    rect(x,y,cardWidth,cardHeight,cardWidth*.1)
    rect(x+cardWidth,y,cardWidth,cardHeight,cardWidth*.1)
  }
  for(let i = 0; i < numRight; i++){
    let x = CANVAS_WIDTH-cardHeight;
    let y = 0;
    if(numRight==1){
      y = CANVAS_HEIGHT/2-cardWidth;
    } else {
      y = CANVAS_HEIGHT/4-cardWidth+i*CANVAS_HEIGHT/2;
    }
    rect(x,y,cardHeight,cardWidth,cardWidth*.1)
    rect(x,y+cardWidth,cardHeight,cardWidth,cardWidth*.1)
  }

}

function drawPlayer(){
  drawCards();
  drawBetting();
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

function drawCard(suit,value,x,y,width,height){
  let suitSize = .1
  let valueSize = .1
  let borderSize = .1
  fill(200)
  stroke(0)
  rect(x,y,width,height,width*borderSize)
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
    let cardScreenRatio = .08;
    let cardWidth = cardScreenRatio*this.width
    let cardHeight = cardWidth * CARD_SIZE_RATIO;
    for(let i = 0; i < numLeft; i++){
      let x = 0;
      let y = 0;
      if(numLeft==1){
        y = this.height/2-cardWidth;
      } else {
        y = this.height/4-cardWidth+i*this.height/2;
      }
      rect(x,y,cardHeight,cardWidth,cardWidth*.1)
      rect(x,y+cardWidth,cardHeight,cardWidth,cardWidth*.1)
    }
    for(let i = 0; i < numTop; i++){
      let x = this.width-cardHeight;
      let y = 0;
      if(numTop%2==1){
        x = this.width/4-cardWidth+(Math.floor(i+(4-numTop)/2))*this.width/4;
      } else {
        x = this.width/5-cardWidth+(Math.floor(i+(4-numTop)/2))*this.width/5;
      }
      rect(x,y,cardWidth,cardHeight,cardWidth*.1)
      rect(x+cardWidth,y,cardWidth,cardHeight,cardWidth*.1)
    }
    for(let i = 0; i < numRight; i++){
      let x = this.width-cardHeight;
      let y = 0;
      if(numRight==1){
        y = this.height/2-cardWidth;
      } else {
        y = this.height/4-cardWidth+i*this.height/2;
      }
      rect(x,y,cardHeight,cardWidth,cardWidth*.1)
      rect(x,y+cardWidth,cardHeight,cardWidth,cardWidth*.1)
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

class SharedTable {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.tableCards = new TableCards(this.x,this.y,this.width,this.height*2/3)
  }

  draw(){
    this.tableCards.draw()
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.tableCards.handleMouseClick()
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

class PlayerUI {

  constructor(x,y,width,height){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.playerCards = new PlayerCards(x,y,width/2,height)
    this.bettingUI = new BettingUI(x+width/2,y,width/2,height)
  }

  draw(){
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
      this.playerCards.handleMouseClick()
      if(player.isTurn){
        this.bettingUI.handleMouseClick()
      }
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
    this.call = new Button(x+width/3,y,width/3,height,"Call",()=>{
      player.stack -= (table.currentBet - player.currentBet)
      player.currentBet = table.currentBet
      socket.emit('player',player)
      console.log("Called "+player.currentBet)
    })
    // let slider = new Slider(x+width*2/3,y+height*3/4,width/3,height/4,table.currentBet+table.bigBlind,player.stack)
    let slider = new Slider(x+width*2/3,y+height*3/4,width/3,height/4,table.currentBet,player.stack)
    this.slider = slider
    this.raise = new Button(x+width*2/3,y,width/3,height*3/4,"Raise",()=>{
      player.stack -= (slider.getValue() - player.currentBet)
      player.currentBet = slider.getValue()
      socket.emit('player',player)
      console.log("Raised "+player.currentBet)
    })
  }

  draw(){
    textSize(10)
    this.fold.draw()
    this.call.draw()
    this.raise.draw()
    this.slider.draw()
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      this.fold.handleMouseClick()
      this.call.handleMouseClick()
      this.raise.handleMouseClick()
      this.slider.handleMouseClick()
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
    this.bottomValue = bottomValue
    this.topValue = topValue
    this.currentValue = bottomValue;
  }

  draw(){
    fill(255)
    rect(this.x,this.y,this.width,this.height)
    fill(200)
    rect(this.x+this.width*(this.currentValue-this.bottomValue)/(this.topValue-this.bottomValue),this.y,this.width*(1-(this.currentValue-this.bottomValue)/(this.topValue-this.bottomValue)),this.height)
    fill(0)
    text("Raise: "+this.currentValue,this.x,this.y)
  }

  isMouseWithin(){
    return isMouseWithin(this.x,this.y,this.width,this.height)
  }

  handleMouseClick(){
    if(this.isMouseWithin()){
      if((mouseX-this.x)/this.width< 0.5){
        this.currentValue = Math.floor(Math.floor((mouseX-this.x)/this.width*50)/50*(this.topValue-this.bottomValue)+this.bottomValue)
      } else {
        this.currentValue = Math.ceil(Math.ceil((mouseX-this.x)/this.width*50)/50*(this.topValue-this.bottomValue)+this.bottomValue)
      }
    }
  }

  getValue(){
    return this.currentValue
  }

}
