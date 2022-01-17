// Configuration for your app
require('dotenv').config()



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
}

async function placeOrder(orders,expiry){
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
        for(const _ of data){
            responses.push(await client.placeOrder(orders[i].type, _.Token, (await getQty()), "N", {
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
            }))
            i++;
        }
    }
    return responses
    
}


async function getQty(){
        return process.env.FIVEPAISA_ORDER_QTY
}



module.exports.init=init
module.exports.placeOrder=placeOrder




