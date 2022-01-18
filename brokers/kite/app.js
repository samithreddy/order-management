

var KiteConnect = require("kiteconnect").KiteConnect;


const persist = require("../../storage/persist")

const operations={isInit:false}
let callback=console.log
let data={}

module.exports={
    init:async()=>{
        data = await persist.get()
        let {kite}=data
        let {user,requestToken}=kite
        operations.isInit=false
        kc = new KiteConnect({
            "api_key": process.env.KITE_API_KEY,
            "debug": false
        });
        kc.setSessionExpiryHook(sessionHook);
        
        if(!user.access_token) {
            kc.generateSession(requestToken, process.env.KITE_API_SECRET)
            .then(function(response) {
                console.log("Response", response);
                init();
            })
            .catch(function(err) {
                console.log(err);
            })
        } else {
            kc.setAccessToken(user.access_token);
        }
        operations.getUser=()=>{return user}
        operations.getLoginURL=kc.getLoginURL
        operations.getProfile=kc.getProfile
        operations.getMargins=getMargins
        operations.getPositions=kc.getPositions
        operations.getOrders=kc.getOrders
        operations.getOrderHistory=getOrderHistory
        operations.getTrades=kc.getTrades
        operations.getOrderTrades=getOrderTrades
        operations.getInstruments=kc.getInstruments
        operations.getLTP=kc.getLTP
        operations.regularOrderPlace=regularOrderPlace
        operations.modifyOrder=modifyOrder
        operations.cancelOrder=cancelOrder
        operations.orderMargins=orderMargins
        operations.basketMargins=basketMargins
        operations.isInit=true

        console.log("Kite Logged in")
        return operations


    },
    getOperations:()=>operations,
    post:(webhookData)=>{
        callback(webhookData)
    },
    subscribe:(cb)=>{
        callback=cb
    },
}








function sessionHook() {
	console.log("Kite User loggedout");
}


function getMargins() {
	return kc.getMargins("equity")
}



function getOrderHistory() {
    return new Promise((resolve,reject)=>{
        kc.getOrders()
		.then(function(response) {
			if (response.length === 0) {
				console.log("No orders.")
				return
			}

			kc.getOrderHistory(response[0].order_id)
				.then(function(response) {
					resolve(response);
				}).catch(function(err) {
					reject(err);
				});
		}).catch(function(err) {
			reject(err);
		});
    })
	
}



function getOrderTrades() {
    return new Promise((resolve,reject)=>{
        kc.getOrders()
            .then(function(response) {
                var completedOrdersID;
                for (var order of response) {
                    if (order.status === kc.STATUS_COMPLETE) {
                        completedOrdersID = order.order_id;
                        break;
                    }
                }

                if (!completedOrdersID) {
                    resolve("No completed orders.")
                    return
                }

                kc.getOrderTrades(completedOrdersID)
                    .then(function(response) {
                        resolve(response);
                    }).catch(function(err) {
                        reject(err);
                    });
            }).catch(function(err) {
                reject(err);
            });
    });
}





function regularOrderPlace(orders) {
	return kc.placeOrder("regular", orders)
}

function modifyOrder(order_id,newOrder) {
		return kc.modifyOrder("regular", order_id, newOrder)

}

function cancelOrder(order_id,) {
	return kc.cancelOrder("regular", order_id)
}




function orderMargins(orders) {
	return kc.orderMargins(orders, "compact")
}

function basketMargins(basket) {
	return kc.orderBasketMargins(basket, true, "compact")
}