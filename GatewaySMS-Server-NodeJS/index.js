/////////////////////////////////////////////////////////////////
////////////////////// LIBRARIES ////////////////////////////////
/////////////////////////////////////////////////////////////////
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json()); // support json encoded bodies

// Socket.IO
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Write file on disk
var fs = require('fs');
/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
///////////////////////// SERVER SET-UP /////////////////////////
/////////////////////////////////////////////////////////////////
server.listen(3000,()=>{
	console.log('Node app is running on port 3000');
	printDevices();
})
/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
/////////////////  VARIABLES ////////////////////////////////////
/////////////////////////////////////////////////////////////////
// Devices
var devices = [];
// Single device object
function device(idAndroid, idSocket){
	this.idAndroid=idAndroid;
	this.idSocket=idSocket;
	this.connected=true;
	this.number="";
	this.smsToSend=0;
	this.lastSMS=0;
	this.consecutiveFails=0;
	this.hourSended=0;
	this.daySended=0;
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

// LIMITS (Max SMS that a device can send)
var hourLimit = 100;
var dayLimit = 200;
var monthLimit = 3000;

/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
///////////////////// API ///////////////////////////////////////
/////////////////////////////////////////////////////////////////
// API POST method
app.post('/sendmessage', function (req, res) {
	var number = req.body.number
	var text = req.body.text
	
	console.log("\nReceived API POST: "+number+" "+text);
	
	//if there are no device available respond
	/*var available=false;
	for(d in devices){
		if(devices[d].connected){
			available=true;
			return false;
		}
	}
	if(!available){
		res.send("CAN'T SEND THE SMS");
	}*/
	
	
	// Push SMS on pending list
	var s = new sms(Date.now(),number,text);
	smsPendingList.push(s);
	
	// Send SMS
	sendMessage(number,text,s.id);
	
	res.send("ciao");
	
	
		
});



// INTERACT WITH SERVER
app.get('/', (req, res) => {
  res.send("Hello World");
	//res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/getState', (req, res) => {
	var myJSON = JSON.stringify(devices);
  res.send(myJSON);
});

app.get('/editState/', (req, res) => {
	// TODO
	
	var myJSON = JSON.stringify(devices);
  res.send(myJSON);
});

/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
/////////////// CONNECTION WITH SMARTPHONE //////////////////////
/////////////////////////////////////////////////////////////////
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
		
	
	// If an SMS is CORRECTLY SENT
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
				devices[d].hourSended++;
				devices[d].daySended++;
				devices[d].weekSended++;
				devices[d].monthSended++;
				devices[d].totSended++;
				devices[d].consecutiveFails=0;
				break;
			}
		}
		
		printsmsPendingList("smsACK");
	});
	
	
	// If an SMS is NOT CORRECTLY
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
		// Set device as NOT Active
		for(d in devices){
			if(devices[d].idSocket==socket.id){
				devices[d].connected=false;
				devices[d].smsToSend=0;
				devices[d].consecutiveFails=0;
				break;
			}
		}
		
		printDevices("Disconnect()");	// LOG
	})
	
})
/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
/////////////////// MAIN FUNCTIONS //////////////////////////////
/////////////////////////////////////////////////////////////////
// SEND MESSAGE
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


// CHOOSE DEVICE
// Decides which device has to sent the message
// Choose the device that has:
//     minimum(1*hourSended + 2*smsToSend + 5*consecutiveFails)
function chooseDevice(){
	var min=10000;
	var index=-1;
	for(d in devices){
		// if the devices has sended too many SMS, skip
		if(devices[d].hourSended>=hourLimit ||
			devices[d].daySended>=dayLimit ||
			devices[d].monthSended>=monthLimit) continue;

		var val = devices[d].hourSended 
					+ 2*devices[d].smsToSend 
					+ 5*devices[d].consecutiveFails;
		if(val<min && devices[d].connected==true){
			min=val;
			index=d;
		}
	}
	return index;
}


// SEND PENDING SMS
// If an SMS after 60 sec is not being sent, try again
function sendPendingSMS(){
	printsmsPendingList();//LOG
	if(smsPendingList.length>0){
		console.log("\nSending pending:");
		var now = Date.now();
		for(s in smsPendingList){
			if((smsPendingList[s].id+60*1000)<=now){
				// Send SMS
				sendMessage(smsPendingList[s].number,smsPendingList[s].text,smsPendingList[s].id);
			}
		}
	}
	setTimeout(sendPendingSMS, 60*1000); // 60 seconds
}
setTimeout(sendPendingSMS, 60*1000); // 60 seconds


// DELETE OLD SMS
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
	setTimeout(deleteOldSMS, 5*60*1000); // 5 minutes
}
setTimeout(deleteOldSMS, 5*60*1000); // 5 minutes


// DISCONNECT FAILING DEVICES
// If a device has too many fails, shut it down
function disconnectFailing(){
	for(d in devices){
		if(devices[d].consecutiveFails>=10){
			console.log("\nDevice "+devices[d].idAndroid+" has been disconnected due to too many fails");
			io.to(devices[d].idSocket).emit("fail","You've been disconnected");
			devices[d].connected=false;
			devices[d].smsToSend=0;
			devices[d].consecutiveFails=0;
		}
	}
	
	setTimeout(disconnectFailing, 2*60*1000); // 2 minutes
}
setTimeout(disconnectFailing, 2*60*1000); // 2 minutes


// RESET HOURLY MESSAGES SENT
function resetHour(){
	for(d in devices){
		devices[d].hourSended=0;
	}
	setTimeout(resetHour, 60*60*1000); // 60 minutes
}
setTimeout(resetHour, 60*60*1000); // 60 minutes

// RESET DAILY MESSAGES SENT
function resetDay(){
	for(d in devices){
		devices[d].daySended=0;
	}
	setTimeout(resetDay, 24*60*60*1000); // 24 hours
}
setTimeout(resetDay, 24*60*60*1000); // 24 hours

// RESET WEEKLY & MONTHLY MESSAGES SENT
// Also monthly because setTimeout has 24 days limit
var week=0;
function resetWeek(){
	week++;	// Week counter
	for(d in devices){
		devices[d].weekSended=0;
		if(week>=4)devices[d].monthSended=0;	// Reset month
	}
	if(week>=4)week=0;	// Reste week counter
	setTimeout(resetWeek, 7*24*60*60*1000); // 7 days
}
setTimeout(resetWeek, 7*24*60*60*1000); // 7 days



// SAVE THE STATE OF THE SYSTEM
function saveState(){
	var myJSON = JSON.stringify(devices);
	fs.writeFile("systemState/devices.json", myJSON, function(err) {
			if (err) {
					console.log(err);
			}
	});
	
	var myJSON = JSON.stringify(smsPendingList);
	fs.writeFile("systemState/smsPendingList.json", myJSON, function(err) {
			if (err) {
					console.log(err);
			}
	});
	
	console.log("\nState saved");
	setTimeout(saveState, 1*60*1000); // 1 minutes
}
setTimeout(saveState, 1*60*1000); // 1 minutes

// LOAD THE STATE OF THE SYSTEM
function loadState(){
	// TODO
	//???????
}


/////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////
//////////////// LOG FUNCTIONS //////////////////////////////////
/////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////
///////////// SUPPORT FUNCTIONS /////////////////////////////////
/////////////////////////////////////////////////////////////////
// Random integer number
/*function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}*/
