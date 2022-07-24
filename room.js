const express = require("express")
const socket = require('socket.io')
const app = express();
app.use(express.static('public'))

const http = require("http");
const expressHTTPServer = http.createServer(app);
const io = new socket.Server(expressHTTPServer)


app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/room.html`)
})


io.on('connection', (socket) => {


    // get online users
    const getOnlineUsers = async () => {
        const activeUserSockets = io.sockets.sockets;
        const sids = io.sockets.adapter.sids;
        const activeUserArray = [...sids.keys()];
        const activeUser = []
        activeUserArray.forEach(userId => {
            const userSocket = activeUserSockets.get(userId);
            if (userSocket.name) {
                activeUser.push({
                    id: userSocket.id,
                    name: userSocket.name,
                })
            }

        })

        return activeUser;
    }

    // get rooms 
    const getPublicRooms = async () => {
        const rooms = await io.sockets.adapter.rooms;
        const sids = await io.sockets.adapter.sids;
        const allSockets = await io.sockets.sockets;

        const roomkeys = [...rooms.keys()];
        const sidKeys = [...sids.keys()];

        const publicRooms = [];
        let roomId = 0;
        for (let roomName of roomkeys) {
            if (!sidKeys.includes(roomName)) {
                const participantSet = rooms.get(roomName);
                const size = participantSet.size;

                const participants = []

                for (let id of [...participantSet]) {
                    const userSocket = allSockets.get(id);
                    participants.push({
                        id: userSocket.id,
                        name : userSocket.name
                    })
                }


                publicRooms.push({
                    id: "a" + roomId + Date.now(),
                    roomName,
                    size,
                    participants
                })

                ++roomId;
            }
        }

        return publicRooms;
    }



    // set name event
    socket.on('setName', async (name, cb) => {
        socket.name = name;
        cb()
        const activeUsers = await getOnlineUsers();
        io.emit("get_active_users", activeUsers);

        const publicRooms = await getPublicRooms();
        io.emit('getPublicRooms', publicRooms)

    })




    // disconnect event
    socket.on('disconnect', async () => {

        const activeUsers = await getOnlineUsers();
        io.emit("get_active_users", activeUsers);

        const publicRooms = await getPublicRooms();
        io.emit('getPublicRooms', publicRooms)
    })

    // send a private message
    socket.on("send_a_msg", (data, cb) => {
        const id = data.id;
        const msg = data.msg;
        const isRoom = data.isRoom === 'false' ? false : data.isRoom;
        data.isRoom = isRoom;


        if (isRoom) {
            socket.to(id).emit("receive_a_message", data, socket.id)
            cb()
        } else {
            io.to(id).emit("receive_a_message", data, socket.id)
            cb()
        }

    })

    // create a public room
    socket.on("create_room", async (roomName, cb) => {
        socket.join(roomName);
        const publicRooms = await getPublicRooms();
        io.emit('getPublicRooms', publicRooms)
        cb()
    })


    // join room
    socket.on("joinRoom", async (roomName, cb) => {
        socket.join(roomName);
        const publicRooms = await getPublicRooms();
        io.emit('getPublicRooms', publicRooms)
        cb()
    })


    socket.on("leaveRoom", async (roomName,cb) => {
        socket.leave(roomName);
        const publicRooms = await getPublicRooms();
        io.emit('getPublicRooms', publicRooms)
        cb()
    })

})





expressHTTPServer.listen(3000, () => {
    console.log("Server is running on port @3000");
})