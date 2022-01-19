
const fetch = require("node-fetch");
const crypto = require("crypto")
const broker = require("./brokers/app")
const kite = require("./brokers/kite/app")
const fp = require("./brokers/5paisa/app");
const io = require("socket.io-client")
const socket = io("wss://paisashare.in", {path: '/user-auth/socket.io/'});
const persist = require("./storage/persist")
const strategyConfig = require("./strategy.json")

let storedData={}
module.exports={
   init:(updateCallback)=>{ socket.on("connect",()=>{
       run(updateCallback)
   })}
}

async function run (updateCallback) {
    console.log("Connected to Server")

    try{
        await kite.init();
        console.log("Kite Login Complete")
    }
    catch(e){
        console.log("Could not initialize kite",e)
    }
    try{
        await fp.init();
        console.log("5Paisa Login Complete")
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

            storedData = await persist.get()
            storedData["kite"]={user:data,requestToken}
            await persist.set(storedData)
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

        storedData = await persist.get()
        storedData["kite"]=request
        await persist.set(storedData)
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
        try{
            const {data}=request
            const {requestOrders,strategyId,expiry}=data
            console.log("Order for ",strategyId)
            if(strategyConfig[strategyId]){
                console.log("Trading orders",strategyId,expiry,requestOrders)
                storedData = await persist.get()
                storedData.orderTimeline=storedData.orderTimeline||[]
                storedData.orderTimeline.push({timstamp:formatDateTime(new Date()),requestOrders,strategyId,expiry})
                await persist.set(storedData)
                await broker.order(strategyId,requestOrders,{sendMessage:async(error)=>{
                    console.log(strategyId,error)
                    storedData = await persist.get()
                    storedData.errors=storedData.errors||[]
                    storedData.errors.push({timstamp:formatDateTime(new Date()),error,strategyId,expiry})
                    await persist.set(storedData)
                }},expiry)
            }
        }
        catch(e){
            console.log(e)
        }
        finally{
            updateCallback()
        }
    })

    socket.emit("init",{userId:process.env.MY_TELEGRAM_ID})
    
}

function formatDateTime(date) {
    const dateArray = date.toLocaleString().split(",")
    const [month, day, year]=dateArray[0].trim().split("/")
    const [time, ampm]=dateArray[1].trim().split(" ")
    const [hour, mins,_]=time.split(":")
    return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(mins)}${ampm?ampm:''}`
}
function addZero(val){
    return val<10&&!val.startsWith("0")?"0"+val:val
}

