const mysql = require('mysql')

const connection = mysql.createConnection({
    host:'localhost',
    port: 3306,
    user:'root',
    password:'',
    database:'learnly'
})

connection.connect((error)=>{
    if(error){
        return console.log('Error with DB');
    } else{
        return console.log('Success connection');
    }
})

module.exports=connection