
const kite = require("./app.js")
const strategyConfig = require("../../strategy.json")
const persist = require("../../storage/persist")
let isFailing=false;
let data
module.exports={
    order:(strategyId,requests,bot)=>{
        return new Promise(async (resolve,reject)=>{
            try{
                data=await persist.get()
                const kiteOps = kite.getOperations()
                if(isFailing){
                    reject("Orders have failed previously hence the no order is being placed. Please fix the issue and restart the app.")
                }
                if(kiteOps.isInit){
                    let requestedOrderIds=[]
                    let postbacks=[]
                    let completedOrders=[]
                    let ackOrdersCount=0
                    kite.subscribe(async(data)=>{
                        const postbackOrders=Object.keys(data).map(JSON.parse)
                        const statusMap={}
                        let isComplete=true
                        ackOrdersCount=0
                        for(const order of postbackOrders){
                            const orderId = order.order_id
                            postbacks.push(orderId)
                            statusMap[orderId]=order.status
                            if(requestedOrderIds.length>0){
                                for(const id of requestedOrderIds){
                                    if(!postbacks.includes(id)){
                                        isComplete=false
                                        break;
                                    }
                                    else if(statusMap[id]&&statusMap[id]==="UPDATE"){
                                        console.log(`Order update for ${id} ${statusMap[id]}`)
                                    }
                                    else if(statusMap[id]&&statusMap[id]!=="COMPLETE"){
                                        isComplete=false
                                        bot.sendMessage(`Error in Placing kite Order : Order failed for ${id} ${statusMap[id]}`)
                                        break;
                                    }
                                    if(statusMap[id]&&statusMap[id]==="COMPLETE"){
                                        ackOrdersCount++;
                                    }
                                }
                            }
                        }
                        if(isComplete&&requestedOrderIds.length>0&&postbackOrders.length>0){
                            bot.sendMessage(`All Kite orders were successful`)
                            kite.subscribe(console.log)

                            data.kiteUpdates=data.kiteUpdates||[]
                            data.kiteUpdates.push({timstamp:formatDateTime(new Date()),message:"All orders successful",strategyId})
                            await persist.set(data)
                                    
                        }
                        
                    })
                    let reqOrdersLength=0
                    let tryCount=0
                    const tryLimit=5
                    for (const request of requests){
                        reqOrdersLength+=request.orders.length
                        const orderRespArray=await requestOrdersAsync(strategyId,request)
                        completedOrders=completedOrders.concat(orderRespArray)
                        while(ackOrdersCount!==reqOrdersLength&&tryCount<tryLimit){
                            await waitForAWhile(100)
                            tryCount++;
                        }
                    }
                    requestedOrderIds=completedOrders.map(_=>_.response.order_id.toString().trim())
                    resolve(requestedOrderIds)
                    
                }
                else{
                    reject("No order placed as you have not signed in the system, please login")
                }
                
            }
            catch(e){
                reject(e)
            }
        })
        
    },
    getQty
}

async function waitForAWhile(time){
    return new Promise((resolve,reject)=>{
        setTimeout(resolve,time)
    })
}

async function requestOrdersAsync(strategyId,request){
    return new Promise(async (resolve,reject)=>{
        const completedOrders=[]
        const kiteOps = kite.getOperations()
        if(request.orders.length>0){
            for(const order of request.orders){
                const orderBody={
                    "exchange":"NFO",
                    "tradingsymbol":`${order.script}${order.kiteExpiryPrefix}${order.strike}${order.optionType}`,
                    "transaction_type":order.type,
                    "quantity":(await getQty(strategyId)),
                    "product": "MIS",
                    "order_type": "MARKET"
                }
                kiteOps.regularOrderPlace(orderBody)
                .then(async(response)=>{
                    completedOrders.push({response})
                    if(request.orders.length===completedOrders.length){
                        resolve(completedOrders)
                        data.kiteResponses=data.kiteResponses||[]
                        data.kiteResponses.push({timstamp:formatDateTime(new Date()),responses:completedOrders,strategyId})
                        await persist.set(data)
                    }
                })
                .catch((e)=>{
                    console.log(e)
                    isFailing=true
                    reject(e)
                })
            }
        }
        else{
            resolve([])
        }

        setTimeout(()=>{
            if(request.orders.length!==completedOrders.length){
                reject("Timed out without resolution")
            }
        },60*1000)
    })
    
}

async function getQty(strategyId){
            return strategyConfig[strategyId].KITE_ORDER_QTY
}
function formatDateTime(date) {
    const dateArray = date.toLocaleString().split(",")
    const [month, day, year]=dateArray[0].trim().split("/")
    const [time, ampm]=dateArray[1].trim().split(" ")
    const [hour, mins,_]=time.split(":")
    return `${year}-${addZero(month)}-${addZero(day)} ${addZero(hour)}:${addZero(mins)} ${ampm}`
}
function addZero(val){
    return val<10&&!val.startsWith("0")?"0"+val:val
}



 