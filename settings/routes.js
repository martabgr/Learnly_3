'use strict';
const usersController = require('./../Controller/UsersController'); 

module.exports = (app) => {
    app.post('/api/auth/signup', usersController.signup); 
    app.post('/api/auth/signin', usersController.signin); 
    app.post('/api/auth/createApplication', usersController.createApplication);
    app.get('/api/comments', usersController.getComments);
    app.post('/api/comments', usersController.addComment);
};