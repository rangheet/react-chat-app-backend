const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const {addUser, getUser, removeUser, getUsersInRoom }  = require('./users');

var cors = require('cors')

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io =  socketio(server, {
    cors: {
      origin: '*',
    }
  });

io.on('connection', (socket) => {
    // console.log("user joined", socket.id)
    socket.on('join', ({name, room}, callback) => {
        // console.log("JOIN", socket.id)
        const {error, user} = addUser({id: socket.id, name, room});
        if(error) return callback(error);

        socket.join(user.room);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text:  `${user.name} has joined!`});

        socket.broadcast.to(user.room).emit('roomData', {room: user.room, users:getUsersInRoom(user.room)});

        callback();
    });


    socket.on('sendMessage', (message, callback) => {
        // console.log("SEND  MESSAGE", socket.id)

        const user = getUser(socket.id);

        socket.broadcast.to(user.room).emit('message', {user: user.name, text: message});

        callback();
    });

    socket.on('disconnect', ()=>{
        console.log('User left');
        const user = removeUser(socket.id);
        if(user)
        {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name } has left`});
            io.to(user.room).emit('roomData', {room: user.room, users:getUsersInRoom(user.room)});
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));