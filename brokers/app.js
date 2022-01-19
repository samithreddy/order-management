
const kiteOrder = require("./kite/placeOrder")
const fpOrder = require("./5paisa/placeOrder")
const strategyConfig = require("../strategy.json")

module.exports.order=order



async function order(strategyId,requestOrders,bot,expiry,tradeInKite=true,tradeInFp=true){
    let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
    let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
    const requestDataBuy={
        orders:requestOrdersBuy,expiry
    }
    const requestDataSell={
        orders:requestOrdersSell,expiry
    }
    let user={id:process.env.MY_TELEGRAM_ID}
    
    if(strategyConfig[strategyId].PLACE_ORDER_5PAISA&&tradeInFp){
        

        setTimeout(async()=>{
            try{
                await fpOrder.order(strategyId,requestDataBuy)
                await fpOrder.order(strategyId,requestDataSell)
                
            }
            catch(e){
                let err=e
                bot.sendMessage(`Error in Placing 5paisa Order ${err.toString()}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN 5PAISA::")
    }
    if(strategyConfig[strategyId].PLACE_ORDER_KITE&&tradeInKite){

        setTimeout(async()=>{
            try{
                await kiteOrder.order(strategyId,[requestDataBuy,requestDataSell],bot)
            }
            catch(e){
                bot.sendMessage(`Error in Placing kite Order ${e}`)
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN KITE::")
    }
    if(strategyConfig[strategyId].PLACE_ORDER_5PAISA||strategyConfig[strategyId].PLACE_ORDER_KITE){
        // console.log("Requested for following orders",requestOrders)
    }
}