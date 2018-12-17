const express = require('express'),
http = require('http'),
app = express(),
server = http.createServer(app),
io = require('socket.io').listen(server);

app.get('/', (req, res) => {
	res.send('Chat Server is running on port 3000')
});

io.on('connection', (socket) => {

	console.log('user connected')
	
	//Prova invio messagio ripetuto
	function inviaMessaggio(){
		//create a message object 
		let  message = {"number":"+393669791022", 
									"code":"1ds45dsss"}
		
		// send the message
		io.emit('message', message )
		setTimeout(inviaMessaggio, 5*1000)
	}
	setTimeout(inviaMessaggio, 5*1000)

})


server.listen(3000,()=>{
	console.log('Node app is running on port 3000')
})