var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json()); // support json encoded bodies

// Socket.IO
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);


server.listen(3000,()=>{
	console.log('Node app is running on port 3000')
})


// Available devices
var devices = [];




// POST method route
app.post('/sendmessage', function (req, res) {
	var number = req.body.number
	var text = req.body.text
	
	console.log("Received POST: "+number+" "+text)
	
	sendMessage(number,text)
		
});




// Function executed every time a client connect
io.on('connection', (socket) => {

	console.log('User '+socket.id+' Connected')
	
	//Add device to list
	devices.push(socket.id)
	console.log("Current devices: "+devices)
	//io.to(socketId).emit('hey', 'I just met you');
	
	// When the client disconnect
	socket.on('disconnect', () => {

		console.log('User '+socket.id+' Disconnected')
		
		//Delete device from list
		devices.splice( devices.indexOf(socket.id), 1 );
		
		console.log("Current devices: "+devices)
	})
	
})


function sendMessage(number, text){
	// Choose which device has to send the message
	//.........................
	var d=devices[0]
	
	// Build the message object
	let  message = {"number":number, "text":text}
	
	// Send the message
	console.log("Sending to: "+d)
	io.to(d).emit("message", message)
}





/*
function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}

//Prova invio messagio ripetuto
	function inviaMessaggio(){
		for(d in devices){
			var num = randomIntInc(1, 10).toString()
			//create a message object 
			let  message = {"number":"+393669791022", 
										"text":num}
			
			// send the message
			console.log("Sending to: "+devices[d])
			io.to(devices[d]).emit('message', message);
		}
		
		setTimeout(inviaMessaggio, 3*1000)
	}
	setTimeout(inviaMessaggio, 3*1000)
	*/
	