'use strict';
const usersController = require('./../Controller/UsersController'); // Убедитесь, что путь корректный.

module.exports = (app) => {
    app.post('/api/auth/signup', usersController.signup); // Убедитесь, что usersController.signup - это функция
    app.post('/api/auth/signin', usersController.signin); // То же для signin
    app.post('/api/auth/createApplication', usersController.createApplication);
};