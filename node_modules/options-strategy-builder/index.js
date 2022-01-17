const { io } = require("socket.io-client");
const uuid = require("uuid")
const socket = io('https://paisashare.in/',{path:'/runtrade/socket.io'});
let running =false;
// client-side
socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});
  
socket.on("disconnect", () => {
    console.log(socket.id); // undefined
});








module.exports=(timings,script,intradayTradeFn,intermediateCallback)=>{
    return new Promise((resolve,reject)=>{
        if(running){
            reject("Code Already running")
        }
        const _uuid=uuid.v1()
        running=true
        socket.on("run-trade-"+socket.id+_uuid,intermediateCallback)
        socket.once("run-trades-"+socket.id+_uuid,(_)=>{running=false;resolve(_)})
        socket.once("run-trades-fail-"+socket.id+_uuid,(_)=>{running=false;reject(_)})
        socket.emit("run-trades",{
            timings,script,intradayTradeFn:intradayTradeFn.toString(),id:socket.id+_uuid
        })
    })
    
}