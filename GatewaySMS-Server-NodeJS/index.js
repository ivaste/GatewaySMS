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
// Single device object
function device(idAndroid, idSocket){
	this.idAndroid=idAndroid;
	this.idSocket=idSocket;
	this.connected=true;
	this.number="";
	this.smsToSend=0;
	this.lastSMS=Date.now();
	this.consecutiveFails=0;
	this.hourSended=0;
	this.weekSended=0;
	this.monthSended=0;
	this.totSended=0;
}

// SMS Pending List
var smsPendingList = [];
// Single SMS object
function sms(id,number,text){
	this.id=id;
	this.number=number;
	this.text=text;
	this.sending=false;
	this.sended=false;
}


// API POST method
app.post('/sendmessage', function (req, res) {
	var number = req.body.number
	var text = req.body.text
	
	console.log("\nReceived API POST: "+number+" "+text);
	
	// Push SMS on pending list
	var s = new sms(Date.now(),number,text);
	smsPendingList.push(s);
	
	// Send SMS
	sendMessage(number,text,s.id);
	
	res.send("ciao");
		
});

// Function executed every time a client connect
io.on('connection', (socket) => {

	console.log('\nSocket '+socket.id+' Connected')
	io.to(socket.id).emit("conACK","connected");
	
	// Add device to list
	socket.on("idAndroid", (idAndroid) => {
		console.log('Socket '+socket.id+' has idAndroid: '+idAndroid)
		
		// If device already exist change is status to connected
		var exist=false;
		for(d in devices){
			if(devices[d].idAndroid==idAndroid){
				exist=true;
				devices[d].connected=true;
				devices[d].idSocket=socket.id;
				break;
			}
		}
		// Else add a new device to list
		if(exist==false)devices.push(new device(idAndroid,socket.id));
		
		printDevices("idAndroid");
	});
		
	
	// If an SMS is correctly sent
	socket.on("smsACK", (idSMS) => {
		// Remove sms from pending list
		for(s in smsPendingList){
			if(smsPendingList[s].id==idSMS){
				smsPendingList.splice(s, 1);
				break;
			}
		}
		
		// Update device params
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].lastSMS=Date.now();
				devices[d].smsToSend--;
				devices[d].totSended++;
				devices[d].consecutiveFails=0;
				break;
			}
		}
		
		printsmsPendingList("smsACK");
	});
	
	
	// If an SMS is not correctly sent
	socket.on("smsNACK", (idSMS) => {
		printDevices("smsNACK BEGIN");
		// Update sms state
		for(s in smsPendingList){
			if(smsPendingList[s].id==idSMS){
				smsPendingList[s].sending=false;
				break;
			}
		}
		
		// Update device params
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].smsToSend--;
				devices[d].consecutiveFails++;
				break;
			}
		}
		
		printState("smsNACK END")
	});
	
	
	
	// When the client disconnect
	socket.on('disconnect', () => {

		console.log('\nSocket '+socket.id+' Disconnected')
		
		//Delete device from list
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].connected=false;
				devices[d].smsToSend=0;
				devices[d].consecutiveFails=0;
				break;
			}
		}
		
		printDevices("Disconnect()");
	})
	
})


function sendMessage(number, text, idSMS){
	if(devices.length<=0) return false;
	// Choose which device has to send the message
	var d=chooseDevice();
	if(d==-1){
		console.log("SMS not sended: NO devices connected, "+d);
		return false;
	}
	
	// Update device params 
	devices[d].smsToSend++;
	
	// Update sms params
	for(s in sms){
		if(sms[s].id==idSMS){
			sms[s].sending=true;
			break;
		}
	}
	
	// Build the message object to send
	let  message = {"number":number, "text":text, "idSMS":idSMS}
	
	// Send the message
	console.log("Sending to: "+devices[d].idSocket);
	io.to(devices[d].idSocket).emit("message", message);
	
	printState("sendMessage()");
	
}


// Function that decides which device has to sent the message
function chooseDevice(){
	//return randomIntInc(0, devices.length-1); //choose random
	//Choose that one that has less smsToSend
	/*var min=10000;
	var index=-1;
	for(d in devices){
		if(devices[d].smsToSend<min && devices[d].connected==true){
			min=devices[d].smsToSend;
			index=d;
		}
	}
	return index;*/
	
	
	//Choose the device that has minimum(1*smsToSend + 5*consecutiveFails)
	var min=10000;
	var index=-1;
	for(d in devices){
		var val=devices[d].smsToSend + (5*devices[d].consecutiveFails)
		if(val<min && devices[d].connected==true){
			min=val;
			index=d;
		}
	}
	return index;
	
}


// Function that sends pending SMS not sent
function sendPendingSMS(){
	printsmsPendingList();//LOG
	if(smsPendingList.length>0 && devices.length>0){
		console.log("\nSending pending:");
		for(s in smsPendingList){
			if(smsPendingList[s].sending==false){
				// Send SMS
				sendMessage(smsPendingList[s].number,smsPendingList[s].text,smsPendingList[s].id);
			}
		}
	}
	setTimeout(sendPendingSMS, 30*1000);
}
setTimeout(sendPendingSMS, 30*1000);


// If an SMS is >5 min older must be deleted from pending list
function deleteOldSMS(){
	if(smsPendingList.length>0){
		var now = Date.now();
		for(s in smsPendingList){
			if((smsPendingList[s].id+5*60*1000)<=now){
				console.log("Deleting pending SMS: "+smsPendingList[s].id);
				// Remove sms from pending list
				smsPendingList.splice(s, 1);
			}
		}
		printsmsPendingList("deleteOldSMS()")
	}
	setTimeout(deleteOldSMS, 5*60*1000);
}
setTimeout(deleteOldSMS, 5*60*1000);

// if a device has too many


//////////////// LOG FUNCTIONS //////////////////////////
// Display current state of Devices
function printDevices(method=""){
	console.log(method);
	console.log("  Available devices: ");
	console.log("    idSocket\t\t  idAndroid\t    smsToSend  Connected  Fails");
	for(d in devices){
		console.log("    "+devices[d].idSocket+"  "+devices[d].idAndroid+"     "+devices[d].smsToSend+"\t"+devices[d].connected+"       "+devices[d].consecutiveFails);
	}
}

// Display current state of SMS
function printsmsPendingList(method=""){
	console.log(method);
	console.log("  smsPendingList: ");
	console.log("\tid\t\tSending\tNumber\t\tText");
	for(s in smsPendingList){
		console.log("\t"+smsPendingList[s].id+"\t"+smsPendingList[s].sending+"\t"+smsPendingList[s].number+"\t"+smsPendingList[s].text);
	}
}

function printState(method=""){
	console.log("\n\n"+method);
	printDevices();
	printsmsPendingList();
}


// Random integer number
function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}
