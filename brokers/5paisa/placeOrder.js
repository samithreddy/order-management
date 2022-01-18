
const strategyConfig = require("../../strategy.json")
const fp = require("./app")
let isFailing=false;
module.exports={
    order:async (strategyId, request)=>{
        if(isFailing){
            throw "Orders have failed previously hence the no order is being placed. Please fix the issue and restart the app."
        }
        let responseArray=await fp.placeOrder(strategyId, request.orders,request.expiry)
        let errors=[]
        for(const _ of responseArray){
            if(_.Status!=0){
                errors.push(`Error in Execution ${_.Message}`)
            }
            return _.Message+" : "+_.Status
        }
        if(errors.length>0){
            isFailing=true
            throw errors
        }
    },
    getQty:async(strategyId)=>{
            return strategyConfig[strategyId].FIVEPAISA_ORDER_QTY
    }
}





 