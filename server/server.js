/* Modules includes */

const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const mongodb = require('mongodb');
const hbs = require('hbs');
const sessions = require('express-session');
const cookieparser = require('cookie-parser');
/* DB Schemas includes */

const {Student} = require('./db/student');
const {Tutor} = require('./db/tutor.js');

/* Initialize app */

var app = express(); 
var server = http.createServer(app);
var io = socketIO(server);
const www = path.join(__dirname, '../public/');
const port = process.env.PORT || 3000;
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(www));
app.use(bodyparser.json());
var partials = path.join(__dirname, '/../views/templates');
hbs.registerPartials(partials);
app.set('view engine', 'hbs');

app.use(cookieparser());
app.use(sessions({
  key: 'user_secret',
  secret: 'JKHJFSGSFKSFBJVLNOWRIUBWKJ',
  resave: false,
  saveUninitialized: false,
  cookie: {
      expires: 60000
  }
}));



/* Database connection */

if(process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect("mongodb://localhost:27017/Tutorinn");
}
/* Handling calls with Socket.io */

io.on('connection', (socket) => {
    console.log("User connected" + socket.id);
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
    return student.generateAuth();
  }).then((auth) => {
    response.status(200).send(auth);
  });
});

app.get('/student/myaccount', (request, response) => {
  console.log('student found!');
});



app.post('/tutor/create', (request , response) => {
  console.log(request.body);
  //response.status(200).send("Worked");
  var tutor = new Tutor(request.body);

  tutor.save().then(() => {
    return tutor.generateAuth();
  }).then((auth) => {
    response.status(200).send(auth);
  });
});

/* Webpage serving */
var checkSession = (request, response, next) => {
  if(request.session.email && request.cookies.user_secret){
    response.redirect('/myaccount');
  } 
  next();
}

app.route('/')
.get(checkSession, (request,response) => {
  response.render("home.hbs", {
    title: 'Home | Tutorinn',
    homeActive: 'active'
  });
});

app.route('/call')
.get(checkSession, (request,response) => {
  response.render("call.hbs", {
    title: 'Video Call | Tutorinn'
  });
});

app.route('/login')
.get(checkSession, (request,response) => {
  response.render("login.hbs", {
    title: 'Student Login | Tutorinn',
    studentLogin: 'active'
  });
})
.post((request, response) => {
  Student.login(request.body.email,request.body.password).then((student) => {
    if(student){
      request.session.email = student.email;
      response.redirect('/myaccount');
    }
  }).catch((e) => {
    response.render("login.hbs", {
      title: 'Student Login | Tutorinn',
      studentLogin: 'active',
      loginError: 'Wrong email or password.'
    });  
  });
 // response.status(200).send('login donezo');
});

app.route('/login/tutor')
.get(checkSession, (request,response) => {
  response.render("login.hbs", {
    title: 'Tutor Login | Tutorinn',
    tutorLogin: 'active'
  });
})
.post((request, response) => {
  Tutor.login(request.body.email,request.body.password).then((tutor) => {
    if(tutor){
      request.session.email = tutor.email;
      response.redirect('/myaccount');
    }
  }).catch((e) => {
    response.render("login.hbs", {
      title: 'Tutor Login | Tutorinn',
      tutorLogin: 'active',
      loginError: 'Wrong email or password.'
    });  
  });
});

app.route('/register')
.get(checkSession, (request,response) => {
  response.render("register.hbs", {
    title: 'Register | Tutorinn',
    studentReg: 'active'
  });
})
.post((request, response) => {
  console.log(request.body);
  var student = new Student(request.body);

  student.save().then(() => {
    request.session.email = student.email;
    return student.jsonify();
  }).then((student) => {
    response.redirect('/myaccount');
  });
});

app.route('/register/tutor')
.get(checkSession, (request,response) => {
  response.render("tutorRegister.hbs", {
    title: 'Register Tutor | Tutorinn',
    tutorReg: 'active'
  });
})
.post((request, response) => {
  console.log(request.body);
  var tutor = new Tutor(request.body);

  tutor.save().then(() => {
    request.session.email = tutor.email;
    return tutor.jsonify();
  }).then(() => {
    response.redirect('/myaccount');
  });
});

app.route('/myaccount')
.get((request, response) => {
  var tutorsList = Tutor.getAll().then((tutors) => {
    return tutors;
  });
  console.dir(tutorsList);
  if(request.session.email && request.cookies.user_secret){
  response.render("account.hbs", {
    title: 'My Account | Tutorinn',
    myAccountActive: 'active',
    tutors: tutorsList
  });
} else {
  response.redirect('/login');
}
});

app.get('/logout', (request, response) => {
  response.clearCookie('user_secret');
  response.redirect('myaccount');
})
/* Start server at any port depending on environment */

server.listen(port, () => {
    console.log(`Server is up at ${port}`);
});