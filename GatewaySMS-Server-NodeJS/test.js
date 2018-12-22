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
	console.log('Node app is running on port 3000');
	printDevices();
})


// Available devices
var devices = [];
/*var device = {
	idAndroid:0,
	idSocket:0,
	number:0,
	smsToSend:10,
	lastSMS:Date.now()
};*/

var smsToSend = [];
/*var sms = {
	id:Date.now(),
	number:"",
	text:"",
	sending:false
};*/


// API POST method
app.post('/sendmessage', function (req, res) {
	var number = req.body.number
	var text = req.body.text
	
	console.log("\nReceived API POST: "+number+" "+text);
	
	// Push SMS on pending list
	var sms = {
		id:Date.now(),
		number:number,
		text:text,
		sending:true
	};
	smsToSend.push(sms);
	
	// Send SMS
	sendMessage(number,text,sms.id);
	
	res.send("ciao");
		
});

// Function executed every time a client connect
io.on('connection', (socket) => {

	console.log('\nSocket '+socket.id+' Connected')
	io.to(socket.id).emit("conACK","connected");
	
	// Add device to list
	socket.on("idAndroid", (idAndroid) => {
		console.log('Socket '+socket.id+' has idAndroid: '+idAndroid)
		
		var device = {
			idAndroid:idAndroid,
			idSocket:socket.id,
			number:"",
			smsToSend:0,
			lastSMS:0
		};
		devices.push(device);
		
		printDevices();
	});
		
	
	// If an SMS is correctly sent
	socket.on("smsACK", (idSMS) => {
		// Remove sms from pending list
		for(s in smsToSend){
			if(smsToSend[s].id==idSMS){
				smsToSend.splice(s, 1);
				break;
			}
		}
		
		// Update device params
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].lastSMS=Date.now();
				devices[d].smsToSend--;
				break;
			}
		}
		
		printSmsToSend();
	});
	
	// If an SMS is not correctly sent
	socket.on("smsNACK", (idSMS) => {
		printDevices();
		// Update sms state
		for(s in smsToSend){
			if(smsToSend[s].id==idSMS){
				smsToSend[s].sending=false;
				break;
			}
		}
		
		// Update device params
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].smsToSend--;
				break;
			}
		}
		
		printDevices();
		printSmsToSend();
	});
	
	
	
	// When the client disconnect
	socket.on('disconnect', () => {

		console.log('\nSocket '+socket.id+' Disconnected')
		
		//Delete device from list
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices.splice(d, 1);
				break;
			}
		}
		
		printDevices();
	})
	
})


function sendMessage(number, text, idSMS){
	if(devices.length<=0) return false;
	// Choose which device has to send the message
	var device=chooseDevice();
	
	// Update device params 
	devices[device].smsToSend++;
	
	// Build the message object
	let  message = {"number":number, "text":text, "idSMS":idSMS}
	
	// Send the message
	console.log("Sending to: "+devices[device].idSocket);
	io.to(devices[device].idSocket).emit("message", message);
	
	printSmsToSend();
}

// Function that decides which devise has to sent the message
function chooseDevice(){
	//return randomIntInc(0, devices.length-1); //choose random
	//Choose that one that has less SmsToSend
	var min=10000;
	for(d in devices){
		if(devices[d].smsToSend<min) min=devices[d].smsToSend;
	}
	return min;
}


// Function that sends pending SMS not sent
function sendPendingSMS(){
	if(smsToSend.length>0 && devices.length>0){
		console.log("\nSending pending:");
		for(s in smsToSend){
			// Update SMS state
			smsToSend[s].sending=true;
			// Send SMS
			sendMessage(smsToSend[s].number,smsToSend[s].text,smsToSend[s].id);
		}
	}
	setTimeout(sendPendingSMS, 30*1000);
}
setTimeout(sendPendingSMS, 30*1000);



// Display current state of Devices
function printDevices(){
	console.log("\nAvailable devices: ");
	console.log("\tidSocket\t\tidAndroid\t\tsmsToSend");
	for(d in devices){
		//console.log("\t idSocket: "+devices[d].idSocket+"\t idAndroid: "+devices[d].idAndroid);
		console.log("\t"+devices[d].idSocket+"\t"+devices[d].idAndroid+"\t"+devices[d].smsToSend);
	}
	/*io.clients((error, clients) =>{
		if(error) throw error;
		console.log(clients);
	});*/	
}

// Display current state of SMS
function printSmsToSend(){
	console.log("\nSmsToSend: ");
	console.log("\tid\t\tSending\tNumber\t\tText");
	for(s in smsToSend){
		console.log("\t"+smsToSend[s].id+"\t"+smsToSend[s].sending+"\t"+smsToSend[s].number+"\t"+smsToSend[s].text);
	}
}



function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}
/*
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
	