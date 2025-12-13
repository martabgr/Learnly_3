const mysql = require('mysql')
const config = require('../config')

const connection = mysql.createConnection({
    host:config.HOST,
    port: config.PORT,
    user:config.DBUSER,
    password:config.DBPASSWORD,
    database:config.DBNAME
})

connection.connect((error)=>{
    if(error){
        return console.log('Error with DB');
    } else{
        return console.log('Success connection');
    }
})

module.exports=connection