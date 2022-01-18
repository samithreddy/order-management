// Configuration for your app

require('dotenv').config()
const fetch = require("node-fetch");
const crypto = require("crypto")
const broker = require("./brokers/app")
const kite = require("./brokers/kite/app")
const fp = require("./brokers/5paisa/app");
const io = require("socket.io-client")
const socket = io("wss://paisashare.in", {path: '/user-auth/socket.io/'});
const persist = require("./storage/persist")
const strategyConfig = require("./strategy.json")
let data={}

socket.on("connect",run);


async function run () {
    console.log("Connected to Server")
    data = await persist.get()

    try{
        await kite.init();
        console.log("Kite Login Complete")
    }
    catch(e){
        console.log("Could not initialize kite",e)
    }
    try{
        await fp.init();
        console.log("5Paisa Logged in")
    }
    catch(e){
        console.log("Could not initialize 5Paisa",e)
    }

    socket.on("kite-login",async request=>{
        const {requestToken}=request
        console.log("Kite login request",requestToken)
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
            data["kite"]={user:data,requestToken}
            await persist.set(data)
            try{
                await kite.init();
                console.log("Kite Login Complete")
            }
            catch(e){
                console.log("Could not initialize kite",e)
            }
        }
        else{
            console.log(status,data)
        }
    })

    socket.on("kite-login-user",async request=>{
        data["kite"]=request
        try{
            await kite.init();
            console.log("Kite Login data received")
        }
        catch(e){
            console.log("Could not initialize kite",e)
        }
    })

    socket.on("kite-webhook",kite.post)

    socket.on("trade",async request=>{
        const {data}=request
        const {requestOrders,strategyId,expiry}=data
        if(strategyConfig[strategyId]){
            console.log("Trading orders",strategyId,expiry,requestOrders)
            await broker.order(strategyId,requestOrders,{sendMessage:(_)=>{console.log(strategyId,_)}},expiry)
        }
    })

    socket.emit("init",{userId:process.env.MY_TELEGRAM_ID})
    
}






   

  



    