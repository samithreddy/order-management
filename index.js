// Configuration for your app

require('dotenv').config()
const broker = require("./brokers/app")

const crypto = require("crypto")

const express = require('express');
const http = require('http');

const kite = require("./brokers/kite/app")
const fp = require("./brokers/5paisa/app");

const fetch = require("node-fetch")

const app = express();
const server = http.createServer(app);
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
// app.use(express.text());


app.use(express.static(__dirname+"/web"));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



server.listen(process.env.PORT, () => {
  console.log('listening on *:'+process.env.PORT);
});

const socket = require("socket.io-client")("wss://paisashare.in", {path: '/user-auth/socket.io/'});


socket.on("connect", () => {
    console.log("connected")
    socket.on("kite-login",async request=>{
        const {requestToken}=request
        const params = new URLSearchParams();
        params.append( 'api_key', process.env.KITE_API_KEY);
        params.append( 'request_token',requestToken);
        params.append( 'checksum',crypto.createHash('sha256').update(process.env.KITE_API_KEY+requestToken+process.env.KITE_API_SECRET).digest('hex'));
        const {status,data} = await (await fetch('https://api.kite.trade/session/token', {
              method: 'post',
              body:   params,
              headers: { 'X-Kite-Version': '3' },
        })).json()
        if(status=="success"){
                try{
                    console.log(data,requestToken)
                    await kite.init(data,requestToken);
                }
                catch(e){
                    console.log("Could not initialize kite",e)
                }
        }
    })

    socket.on("kite-webhook",kite.post)

    socket.on("trade",async requestOrders=>{
        await broker.order(requestOrders,{sendMessage:console.log},true,false)
    })

    socket.emit("init",{userId:process.env.MY_TELEGRAM_ID})
    
});






   
//* clean up process *//
const cleanUp = (shutdown) => {

    shutdown()
    // server.close(shutdown);
};
//* exit handler *//
function exitHandler(options, exitCode) {
    cleanUp(_=>{
      if (options.cleanup) console.log("clean");
      if (exitCode || exitCode === 0) console.log(exitCode);
      if (options.exit) process.exit();
    });
    
}


//* exit management and db setup*//
;(async() => {
    //* the program will not close instantly *//
    process.stdin.resume();
  
    //* do something when app is closing *//
    process.on("exit", exitHandler.bind(null, { cleanup: true }));
  
    //* catches ctrl+c event *//
    process.on("SIGINT", exitHandler.bind(null, { exit: true }));
  
    //* catches "kill pid" (for example: nodemon restart) *//
    process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
    process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
  
    //* catches uncaught exceptions *//
    process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

     //* Use connect method to connect to the server *//
    try{
        await fp.init();
    }
    catch(e){

        console.log("Could not initialize 5Paisa",e)
    }

    //* Use connect method to connect to the server *//
    
    
})();
  



    