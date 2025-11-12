'use strict'

module.exports = (app) =>{
    const UsersController = require('./../Controller/UsersController')

    app
    .route('/api/users')
    .get(UsersController.getAllUsers)

    app
    .route('/api/auth/signup')
    .post(UsersController.signup)
}