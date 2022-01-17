
const kiteOrder = require("./kite/placeOrder")
const fpOrder = require("./5paisa/placeOrder")

module.exports.order=order



async function order(requestOrders,bot,tradeInKite=true,tradeInFp=true){
    let hedgeStatus = await kiteOrder.getHedgingStatus()
    let requestOrdersBuy=requestOrders.filter(leg=>leg.type==="BUY")
    let requestOrdersSell=requestOrders.filter(leg=>leg.type==="SELL")
    if(!hedgeStatus){
        requestOrdersBuy.filter(leg=>leg.isHedge!=true)
        requestOrdersSell.filter(leg=>leg.isHedge!=true)
    }
    const requestDataBuy={
        orders:requestOrdersBuy,expiry:process.env.NEXT_EXPIRY
    }
    const requestDataSell={
        orders:requestOrdersSell,expiry:process.env.NEXT_EXPIRY
    }
    let user={id:process.env.MY_TELEGRAM_ID}
    if(process.env.PLACE_ORDER_5PAISA.trim()==="true"&&tradeInFp){
        

        setTimeout(async()=>{
            try{
                await fpOrder.order(requestDataBuy)
                await fpOrder.order(requestDataSell)
                
            }
            catch(e){
                let err=e
                if(typeof e==="object"){
                    err=JSON.stringify(e)
                }
                else{
                    err=e.toString()
                }
                bot.sendMessage({chatId:user.id,text:`Error in Placing 5paisa Order ${err}`,suggestions:[]})
                console.log(e,"Placing order 5paisa error")
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN 5PAISA::")
    }
    if(process.env.PLACE_ORDER_KITE.trim()==="true"&&tradeInKite){

        setTimeout(async()=>{
            try{
                console.log([requestDataBuy,requestDataSell])
                await kiteOrder.order([requestDataBuy,requestDataSell],bot)
            }
            catch(e){
                let err=e
                if(typeof e==="object"){
                    err=JSON.stringify(e)
                }
                else{
                    err=e.toString()
                }
                bot.sendMessage({chatId:user.id,text:`Error in Placing kite Order ${err}`,suggestions:[]})
                console.log(e,"Placing order kite error")
            }

        },0)
        
        console.log("::TRIED TO PLACE A TRADE IN KITE::")
    }
    if(process.env.PLACE_ORDER_5PAISA.trim()==="true"||process.env.PLACE_ORDER_KITE.trim()==="true"){
        console.log("Requested for following orders",requestOrders)
    }
}