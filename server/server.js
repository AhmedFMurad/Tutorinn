/* Modules includes */

const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const mongodb = require('mongodb');

/* DB Schemas includes */

const {Student} = require('./db/student');
const {Tutor} = require('./db/tutor.js');

/* Initialize app */

var app = express(); 
var server = http.createServer(app);
var io = socketIO(server);
const www = path.join(__dirname, '../public/');
const port = process.env.PORT || 3000;

app.use(express.static(www));
app.use(bodyparser.json());


/* Database connection */

if(process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect("mongodb://localhost:27017/Tutorinn");
}
/* Handling calls with Socket.io */

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


/* API endpoints */

app.post('/student/create', (request , response) => {
  console.log(request.body);
  //response.status(200).send("Worked");
  var student = new Student(request.body);

  student.save().then(() => {
    response.status(200).send(student.generateAuth());
  })
});

app.get('/student/myaccount', (request, response) => {
  console.log('student found!');
});


/* Webpage serving */

app.get('/call', (request,response) => {
  response.sendFile(www + "/call.html");
});

app.get('/login', (request,response) => {
  response.sendFile(www + "/login.html");
});

app.get('/register', (request,response) => {
  response.sendFile(www + "/login.html");
});


/* Start server at any port depending on environment */

server.listen(port, () => {
    console.log(`Server is up at ${port}`);
});