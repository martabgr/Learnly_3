'use strict';
const usersController = require('./../Controller/UsersController'); 

module.exports = (app) => {
    // Авторизация и регистрация
    app.post('/api/auth/signup', usersController.signup); 
    app.post('/api/auth/signin', usersController.signin); 
    
    // Заявки
    app.post('/api/auth/createApplication', usersController.createApplication);
    
    // Комментарии
    app.get('/api/comments', usersController.getComments);
    app.post('/api/comments', usersController.addComment);
    
    // Профиль пользователя
    app.get('/api/auth/user/:id', usersController.getUserById);
    app.put('/api/auth/update/:id', usersController.updateUser);
    app.post('/api/auth/upload-avatar', usersController.uploadAvatar);
};