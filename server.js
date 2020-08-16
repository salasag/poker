const Table = require('./Game/Table.js');
var express = require('express');
var socket = require('socket.io');
var port = process.env.PORT || 3000;
var app = express();
var server = app.listen(port);

app.use(express.static('public'));

var io = socket(server);

io.sockets.on('connection', newConnection);
var TABLE;

// https://stackoverflow.com/questions/19608923/socket-io-socket-on-wait-for-promise
// https://stackoverflow.com/questions/51488022/how-to-make-javascript-execution-wait-for-socket-on-function-response

function newConnection(socket){
	console.log('new connection ' + socket.id);
	if(Object.keys(io.sockets.sockets).length == 1){
		TABLE = new Table(io)
	}
	TABLE.queuePlayerAddition(socket.id)

	socket.on('disconnect', function(){
		TABLE.queuePlayerRemoval(socket.id)
		console.log('user disconnected ' + socket.id);
	});
}