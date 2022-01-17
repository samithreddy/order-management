# Options Strategy Builder

### We support Nifty and Banknifty Options backtesting from Jan 2019 in 5 minute time frame.
---
## Quickstart

**1. Install**
```shell
    npm install options-strategy-builder
```
**2. Require module**

```javascript
    const builder = require("options-strategy-builder")
```

**3. Run the module**

`await builder(timings={open:{daysToExpiry:1,hour:15,min:30},close:{daysToExpiry:0,hour:9,min:20}},script,tradeFunction,intermediateCallbackFunction)`

Where

  * **timings** is a configuration storing trade open and close times
  * **script** is the script you want to backtest on. For now we support "NIFTY" and "BANKNIFTY" as valid script value
  * **tradeFunction** is the function which will define all the trade decisions taken within a trade
  * **intermediateCallbackFunction** is the function sends update as the backtesting is being performed

**4. Define tradeFunction**

```
const tradeFunction = async(currentTradeData, ocData, context)=>{ 
    let orders=[]
    //WRITE YOUR OWN LOGIC// 
    return {orders,context}
}
```

Where

  * **currentTradeData** is the currentTradeData with pnl and leg position.
  * **ocData** is the option chain data of that particular timestamp
  * **context** is the data which can be used as wished. It is a optional recurrent data which is maintained during a trade session.

## tradeFunction Inputs
**currentTradeData**
```   
    { 
         bookedPnl:number (Float),
         pnl:number (Float),
         legs:{
             <strikePrice>:{
                 call:[{
                    ltp:number (Float),
                    quantity:number (Integer eg. 1,2),
                    opType:<BUY/SELL>
                 },...],
                 put:[{
                    ltp:number (Float),
                    quantity:number (Integer eg. 1,2),
                    opType:<BUY/SELL>
                 },...]
             }
         }
     }
```
**ocData**
```
    {
         currentTimestamp:number (Timestamp in millis),
         expiryTimestamp:number (Timestamp in millis),
         daysToExpiry:number (Integer eg. 1,2),
         volatility:number (Float),
         lotSize:number (Integer eg. 50),
         futurePrice:number (Float),
         spotPrice:number (Float),
         strikeAtm:number (Integer eg. 17800,18000),
         strikeDiff:number (Integer eg. 50),
         optionChainData:{
                 <strikePrice>:{
                             call :{
                                 ltp:number (Float), 
                                 strike:number (Integer eg. 17800,18000), 
                                 delta:number (Integer ranging from 0 to 100), 
                                 iv:number (Float)
                             },
                             put :{
                                 ltp:number (Float), 
                                 strike:number (Integer eg. 17800,18000),  
                                 delta:number (Integer ranging from 0 to 100),  
                                 iv:number (Float)
                             }
                     }
             }
     }
```
**context**
```
    {
        // The context is reset in every trade. Data in the context will only be modified by tradeFunction.
    }
```

## tradeFunction Output
**orders**
```
    [{
        legType:<PUT/CALL>,
        opType:<BUY/SELL>,
        strike:<strike to be executed> (Integer eg. 17800,18000),
        quantity:<number of lots> (Integer eg. 1,2)
    },...]
```
**context**
```
    {
        // Put whatever contextual data you wish to use in a trade session. The context is reset in every trade.
    }
```
## Example

```javascript
const builder = require("options-strategy-builder")
//Example of BANKNIFTY Straddle at 9:20 am with full price sl on both legs
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
        const result=await builder({open:{daysToExpiry:0,hour:9,min:20},close:{daysToExpiry:0,hour:15,min:30}},"BANKNIFTY",tradeFunction,(updateData)=>{
            console.log(updateData)
        })
        console.log(result)
    }
    catch(e){
        console.log(e)
    }
    
})()
```


