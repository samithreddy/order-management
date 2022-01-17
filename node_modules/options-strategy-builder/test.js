const builder = require("./index.js")

const tradeFunction = async(currentTradeData, ocData, context)=>{
    let orders=[]
    const currentDate=new Date(ocData.currentTimestamp)
    if(!context.isEnd){
        if(currentDate.getHours()==9&&currentDate.getMinutes()==20){
            orders=[{legType:"PUT",opType:"SELL",strike:ocData.strikeAtm,quantity:1},{legType:"CALL",opType:"SELL",strike:ocData.strikeAtm,quantity:1}]
            context.strikeAtm=ocData.strikeAtm
            context.sl=ocData.optionChainData[ocData.strikeAtm].call.ltp+ocData.optionChainData[ocData.strikeAtm].put.ltp
        }
        else if(context.strikeAtm&&currentTradeData.legs[context.strikeAtm]&&currentTradeData.legs[context.strikeAtm].put.pnl<-context.sl){
            orders=[{legType:"PUT",opType:"BUY",strike:context.strikeAtm,quantity:1},{legType:"CALL",opType:"BUY",strike:context.strikeAtm,quantity:1}]
            context.isEnd=true
        }
        else if(context.strikeAtm&&currentTradeData.legs[context.strikeAtm]&&currentTradeData.legs[context.strikeAtm].call.pnl<-context.sl){
            orders=[{legType:"PUT",opType:"BUY",strike:context.strikeAtm,quantity:1},{legType:"CALL",opType:"BUY",strike:context.strikeAtm,quantity:1}]
            context.isEnd=true
            
        }
    }
    return {orders,context}
}


;(async()=>{
    try{
        const result=await builder(0,"BANKNIFTY",tradeFunction,(updateData)=>{
            console.log(updateData)
        })
        console.log(result)
    }
    catch(e){
        console.log(e)
    }
    
})()