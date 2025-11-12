'use strict'
const response = require('./../response')
const db=require('./../settings/db')

exports.getAllUsers = (req, res) =>{

    db.query('SELECT `id`, `name`, `email`, `role` FROM `users`',(error, rows, fields)=>{
        if(error){
            response.status(400,error,res)
        }else{
            response.status(200, rows, res)
        }
    })
}

exports.signup = (req, res) => {
    const sql="INSERT INTO `users`(`name`,`email`,`role`,`password`) VALUES('"+ req.query.name + "','"+ req.query.email + "','"+ req.query.role + "','"+ req.query.password + "')";
    db.query(sql, (error, results) => {
        if(error){
            console.log(error);
        }else{
            response.status(results, res)
        }
    })

}