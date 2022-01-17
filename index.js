// Configuration for your app

require('dotenv').config()
const fetch = require("node-fetch");
const crypto = require("crypto")
const broker = require("./brokers/app")
const kite = require("./brokers/kite/app")
const fp = require("./brokers/5paisa/app");
const io = require("socket.io-client")
const socket = io("wss://paisashare.in", {path: '/user-auth/socket.io/'});


socket.on("connect",async () => {
    console.log("Connected to Server")

    try{
        await fp.init();
        console.log("5Paisa Logged in")
    }
    catch(e){
        console.log("Could not initialize 5Paisa",e)
    }

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
                    await kite.init(data,requestToken);
                    console.log("Kite Logged in")
                }
                catch(e){
                    console.log("Could not initialize kite",e)
                }
        }
    })

    socket.on("kite-webhook",kite.post)

    socket.on("trade",async request=>{
        const {data}=request
        const {requestOrders,strategyId,expiry}=data
        if(strategyId==process.env.STRATEGY_ID){
            console.log("Trading orders",strategyId,expiry,requestOrders)
            await broker.order(requestOrders,{sendMessage:(_)=>{console.log(strategyId,_)}},expiry)
        }
    })

    socket.emit("init",{userId:process.env.MY_TELEGRAM_ID})
    
});






   

  



    