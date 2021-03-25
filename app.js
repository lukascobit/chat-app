const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMesage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const botName = 'Announcements';


//Static folder
app.use(express.static(path.join(__dirname, 'public')));

//run
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome
        socket.emit('message',formatMesage(botName, 'Welcome!'));


        //broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMesage(botName, `${user.username} joined this group`));
        //send users room and info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })

    //runs when user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user){

            io.to(user.room).emit('message',formatMesage(botName, `${user.username} left the chat`));

            //send users room and info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        
    });

    
    //listen for chat msg
    socket.on('chatMsg', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMesage(user.username, msg));
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running on ${PORT}`));