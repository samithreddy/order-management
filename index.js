// Configuration for your app

require('dotenv').config()
// Configuration for your app






const orderClient=require("./orderClient")

const persist = require("./storage/persist")
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const ioServer = new Server(server);
const jsonParser = express.json({
    limit: 1024 * 1024 * 20,
    type: "application/json"
});

const urlencodedParser = express.urlencoded({
    limit: 1024 * 1024 * 20,
    type: "application/x-www-form-urlencoded"
});


app.use(jsonParser);

app.use(urlencodedParser);


app.use(express.static(__dirname+"/web/"));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/web/index.html');
});

let sockets ={}

ioServer.on('connection',async (socket) => {
    sockets[socket.id]=socket
    socket.on('disconnect', () => {
        delete sockets[socket.id]
    });
    socket.emit("data",{data:await persist.get()})
});




server.listen(process.env.PORT, () => {
    orderClient.init(()=>{
        Object.values(sockets).forEach(async socket=>{
            socket.emit("data",{data:await persist.get()})
        })
    })
    console.log('listening on *:'+process.env.PORT);
    console.log(`Click here to open link http://localhost:${process.env.PORT}`)
});







   

  



    