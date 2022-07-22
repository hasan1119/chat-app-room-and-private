const express = require("express")
const socket = require('socket.io')
const app = express();

const http = require("http");
const expressHTTPServer = http.createServer(app);
const io = new socket.Server(expressHTTPServer)


app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/room.html`)
})


io.on('connection', (socket) => {
    console.log("user Connected");

    io.to(socket.id).emit('getName')


    socket.on("new-message", (msg, cb) => {
        socket.broadcast.emit("receive_msg", msg, socket.name)
        cb()
    })
    socket.on("setName", (name, cb) => {
        socket.name = name;
        cb()
    })
})



expressHTTPServer.listen(3000, () => {
    console.log("Server is running on port @3000");
})