const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');


var app = express(); 
var server = http.createServer(app);
var io = socketIO(server);
const www = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(express.static(www));

io.on('connection', (socket) => {
    console.log("User connected");
    socket.emit('serverMessage', {
        message: 'message'
    });
      socket.on('create or join', function(room) {

        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
    
        if (numClients === 0) {
          socket.join(room);
          console.log('Client ID ' + socket.id + ' created room ' + room);
          socket.emit('created', room, socket.id);
    
        } else if (numClients === 1) {
          console.log('Client ID ' + socket.id + ' joined room ' + room);
          io.sockets.in(room).emit('join', room);
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready');
        } else { // max two clients
          socket.emit('full', room);
        }
        socket.on('message', function(message) {
          console.log('Client said: ', message);
          // for a real app, would be room-only (not broadcast)
          socket.broadcast.to(room).emit('message', message);
        });
      });
    
      socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
          ifaces[dev].forEach(function(details) {
            if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
              socket.emit('ipaddr', details.address);
            }
          });
        }
      });
    
      socket.on('bye', function(){
        console.log('received bye');
      });
});


server.listen(port, () => {
    console.log(`Server is up at ${port}`)
});