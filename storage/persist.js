const fs = require("fs")

function formatDate(date) {
    const dateArray = date.toLocaleString().split(",")
    const [month, day, year]=dateArray[0].trim().split("/")
    return `${year}-${addZero(month)}-${addZero(day)}`
}
function addZero(val){
    return val<10&&!val.startsWith("0")?"0"+val:val
}
module.exports.set=(data)=>{
    return new Promise((resolve,reject)=>{
        fs.writeFile(`${__dirname}/data/${formatDate(new Date())}.json`, JSON.stringify(data), function (err) {
            if (err) {
                return reject(err)
            }
            return resolve()
        });
    })
    
}

module.exports.get=()=>{
    return new Promise((resolve,reject)=>{

        fs.readFile(`${__dirname}/data/${formatDate(new Date())}.json`, 'utf8', function(err, data){
            
            if (err) {
                return resolve({});
            }
            try{
                return resolve(JSON.parse(data));
            }
            catch(e){
                return resolve({});
            }
        });
    });
}