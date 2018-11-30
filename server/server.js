const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
var app = express(); 
var server = http.createServer(http);
var io = socketIO(server);
const www = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(express.static(www));


server.listen(port, () => {
    console.log(`Server is up at ${port}`)
});