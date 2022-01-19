// Configuration for your app
require('dotenv').config()
const strategyConfig = require("../../strategy.json")

const persist = require("../../storage/persist")

const conf = {
    "appSource": process.env.FIVEPAISA_APPSOURCE,
    "appName": process.env.FIVEPAISA_APPNAME,
    "userId": process.env.FIVEPAISA_USERID,
    "password": process.env.FIVEPAISA_PASSWORD,
    "userKey": process.env.FIVEPAISA_USERKEY,
    "encryptionKey": process.env.FIVEPAISA_ENCRYPTIONKEY
}
const creds=process.env.FIVEPAISA_CREDS.split(",")

const { FivePaisaClient } = require("5paisajs")

var client = new FivePaisaClient(conf)



let loginCred 
let storedData



function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('');
}


async function init(){
        loginCred = await client.login(...creds)
        await client.init(loginCred)
        storedData = await persist.get()
        storedData.fpLogin=true
        await persist.set(storedData)
}

async function placeOrder(strategyId,orders,expiry){

    const expiryCap=expiry.toUpperCase().replace(/-/g," ")
    const expiryDate=new Date(expiryCap)
    const responses=[]
    if(orders.length>0){

        const data =(await client.getMarketFeed(orders.map(order=>{
            return {
                "Exch":"N",
                "ExchType":"D",
                "Symbol":`${order.script} ${expiryCap} ${order.optionType} ${order.strike.toString()}.00`,
                "Expiry":`${formatDate(expiryDate)}`,
                "StrikePrice":order.strike.toString(),
                "OptionType":order.optionType
            }
        })))

        
        if(data.length!==orders.length){
            throw "Could not fetch data"
        }
        let i=0
        const qty = await getQty(strategyId)
        for(const _ of data){
            const resp=await client.placeOrder(orders[i].type, _.Token, qty, "N", {
                exchangeSegment: "D",
                atMarket: true,
                isStopLossOrder: false,
                stopLossPrice: 0,
                isVTD: false,
                isIOCOrder: false,
                isIntraday: false,
                ahPlaced: "N",
                IOCOrder: false,
                price: 0
            })
            responses.push(resp)
            i++;
        }
        storedData=await persist.get()
        storedData.fpResponses=storedData.fpResponses||[]
        storedData.fpResponses.push({timestamp:formatDateTime(new Date()),responses,strategyId})
        await persist.set(storedData)
    }
    return responses
    
}


async function getQty(strategyId){
        return strategyConfig[strategyId].FIVEPAISA_ORDER_QTY
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

module.exports.init=init
module.exports.placeOrder=placeOrder




