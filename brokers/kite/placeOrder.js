
const kite = require("./app.js")
let isFailing=false;
module.exports={
    order:(requests,bot)=>{
        return new Promise(async (resolve,reject)=>{
            try{
                const kiteOps = kite.getOperations()
                if(isFailing){
                    reject("Orders have failed previously hence the no order is being placed. Please fix the issue and restart the app.")
                }
                if(kiteOps.isInit){
                    let requestedOrderIds=[]
                    let postbacks=[]
                    let completedOrders=[]
                    let ackOrdersCount=0
                    kite.subscribe((data)=>{
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
                                        console.log(`Order failed for ${id} ${statusMap[id]}`)
                                    }
                                    else if(statusMap[id]&&statusMap[id]!=="COMPLETE"){
                                        isComplete=false
                                        console.log(`Order failed for ${id} ${statusMap[id]}`)
                                        bot.sendMessage({chatId:process.env.MY_TELEGRAM_ID,text:`Error in Placing kite Order : Order failed for ${id} ${statusMap[id]}`,suggestions:[]})
                                        break;
                                    }
                                    if(statusMap[id]&&statusMap[id]==="COMPLETE"){
                                        ackOrdersCount++;
                                    }
                                }
                            }
                        }
                        if(isComplete&&requestedOrderIds.length>0&&postbackOrders.length>0){
                            console.log(postbacks,"KITE_POSTBACKS")
                            bot.sendMessage({chatId:process.env.MY_TELEGRAM_ID,text:`All Kite orders were successful`,suggestions:[]})
                            kite.subscribe(console.log)
                                    
                        }
                        
                    })
                    let reqOrdersLength=0
                    let tryCount=0
                    const tryLimit=5
                    for (const request of requests){
                        reqOrdersLength+=request.orders.length
                        const orderRespArray=await requestOrdersAsync(request)
                        completedOrders=completedOrders.concat(orderRespArray)
                        while(ackOrdersCount!==reqOrdersLength&&tryCount<tryLimit){
                            console.log("::::LOG:::::")
                            console.log(ackOrdersCount,reqOrdersLength,"WAITING FOR ACK")
                            await waitForAWhile(100)
                            tryCount++;
                        }
                        console.log("::::LOG:::::")
                        console.log(ackOrdersCount,reqOrdersLength,"PROCEEEDING")
                    }
                    requestedOrderIds=completedOrders.map(_=>_.response.order_id.toString().trim())
                    console.log(requestedOrderIds,"KITE_REQUESTS")
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

async function requestOrdersAsync(request){
    return new Promise(async (resolve,reject)=>{
        const completedOrders=[]
        const kiteOps = kite.getOperations()
        if(request.orders.length>0){
            for(const order of request.orders){
                const orderBody={
                    "exchange":"NFO",
                    "tradingsymbol":`${order.script}${order.kiteExpiryPrefix}${order.strike}${order.optionType}`,
                    "transaction_type":order.type,
                    "quantity":(await getQty()),
                    "product": "MIS",
                    "order_type": "MARKET"
                }
                kiteOps.regularOrderPlace(orderBody)
                .then((response)=>{
                    completedOrders.push({response})
                    if(request.orders.length===completedOrders.length){
                        resolve(completedOrders)
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
                console.log("Timed out without resolution")
                reject("Timeout error")
            }
        },60*1000)
    })
    
}

async function getQty(){
            return process.env.KITE_ORDER_QTY
}




 