var express = require('express');
var app  = express()
var http = require('http');
// var io = require(‘socket.io’)(http);
const server = require('http').createServer()
const io = require('socket.io')(server)

io.on('connection', function (client) {
  client.on('register', handleRegister)

  client.on('join', handleJoin)

  client.on('leave', handleLeave)

  client.on('message', handleMessage)

  client.on('chatrooms', handleGetChatrooms)

  client.on('availableUsers', handleGetAvailableUsers)

  client.on('disconnect', function () {
    console.log('client disconnect...', client.id)
    handleDisconnect()
  })

  client.on('error', function (err) {
    console.log('received error from client:', client.id)
    console.log(err)
  })
})

server.listen(3000, function (err) {
  if (err) throw err
  console.log('listening on port 3000')
})
// app.get('/get',(req,res)=>{
//     io.on("connection", socket => {
//         console.log("New client connected"), setInterval(
//           () => getApiAndEmit(socket),
//           10000
//         );
//         socket.on("disconnect", () => console.log("Client disconnected"));
//       });
// })
