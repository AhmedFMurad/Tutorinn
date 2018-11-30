var socket = io();
socket.on('connect', function () {
    console.log("Connection!");
    socket.emit('Message', {
        message: 'message'
    });
});

socket.on('serverMessage', function(message){
    console.log(message);
});