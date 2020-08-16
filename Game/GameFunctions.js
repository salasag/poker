function sendMessage(io,message){
	console.log(message)
	io.emit('message',message)
}

module.exports = {
    sendMessage: sendMessage,
}