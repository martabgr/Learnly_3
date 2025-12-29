'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./../settings/db');
const response = require('./../response');

exports.signup = (req, res) => {
    console.log("Получен запрос на регистрацию:", req.body);
    
    const { email, name, password, role } = req.body;  // Извлечение всех данных
    if (!role) {
        return res.status(400).json({ message: 'Роль не указана' });
    }

    // Проверка существования пользователя с таким email
    db.query("SELECT `id` FROM `users` WHERE `email` = ?", [email], (error, results) => {
        if (error) {
            return res.status(400).json({ message: 'Ошибка проверки пользователя', error });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: `Пользователь с почтой ${email} уже зарегистрирован` });
        }

        // Хеширование пароля
        const hashedPassword = bcrypt.hashSync(password, 10);
        const sql = "INSERT INTO `users`(`name`, `email`, `role`, `password`) VALUES (?, ?, ?, ?)";

        // Вставка нового пользователя в базу данных
        db.query(sql, [name, email, role, hashedPassword], (error) => {
            if (error) {
                return res.status(400).json({ message: 'Ошибка при регистрации', error });
            }
            res.status(201).json({ message: 'Регистрация успешна' }); // Возвращаем сообщение об успехе
        });
    });
};
exports.signin = (req, res) => {
    console.log("Получен запрос на вход:", req.body);
    
    const { email, password, role } = req.body;
    
    // Проверка наличия данных
    if (!email || !password) {
        return res.status(400).json({ message: 'Введите email и пароль' });
    }
    
    // Поиск пользователя по email
    db.query("SELECT * FROM `users` WHERE `email` = ?", [email], (error, results) => {
        if (error) {
            console.error("Ошибка БД:", error);
            return res.status(500).json({ message: 'Ошибка сервера', error });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        const user = results[0];
        
        // Проверка совпадения роли (опционально - можете убрать, если не важно)
        if (role && user.role !== role) {
            return res.status(401).json({ 
                message: `Этот email зарегистрирован как ${user.role === 'teacher' ? 'преподаватель' : 'студент'}` 
            });
        }
        
        // Проверка пароля
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        // Генерация JWT токена
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'MySecretKey2024!Lernly#Super', // ВАЖНО: замените на свой секретный ключ!
            { expiresIn: '24h' }
        );
        
        // Успешный вход
        res.status(200).json({
            message: 'Вход выполнен успешно',
            token: token,
            name: user.name,
            email: user.email,
            role: user.role,
            id: user.id
        });
    });
};
exports.createApplication = (req, res) => {
    console.log("Получен запрос на создание заявки:", req.body);
    
    const { name, email, phone } = req.body;
    
    // Проверка наличия всех данных
    if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }
    
    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Некорректный email' });
    }
    
    // Вставка заявки в таблицу applications
    const sql = "INSERT INTO `applications`(`name`, `email`, `phone`) VALUES (?, ?, ?)";
    
    db.query(sql, [name, email, phone], (error, results) => {
        if (error) {
            console.error("Ошибка при создании заявки:", error);
            return res.status(500).json({ message: 'Ошибка при отправке заявки', error });
        }
        
        res.status(201).json({ 
            message: 'Заявка успешно отправлена!',
            applicationId: results.insertId 
        });
    });
};

// Получить все комментарии
exports.getComments = (req, res) => {
  const sql = "SELECT * FROM `comments` ORDER BY `id` DESC";
  db.query(sql, (error, results) => {
    if (error) {
      console.error("Ошибка получения комментариев:", error);
      return res.status(500).json({ message: 'Ошибка сервера', error });
    }
    res.status(200).json(results); // Возвращаем все комментарии
  });
};

// Добавить новый комментарий
exports.addComment = (req, res) => {
  const { name, email, reviewText } = req.body;

  // Проверка наличия пользователя в базе по email
  db.query("SELECT `id`, `name` FROM `users` WHERE `email` = ?", [email], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Ошибка базы данных', error });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
    }

    // Добавление комментария в таблицу comments
    const sql = "INSERT INTO `comments`(`comment_text`, `name`) VALUES (?, ?)";
    db.query(sql, [reviewText, name], (error, results) => {
      if (error) {
        console.error("Ошибка добавления комментария:", error);
        return res.status(500).json({ message: 'Ошибка при добавлении комментария', error });
      }
      
      res.status(201).json({ message: 'Комментарий добавлен!', comment: { name, comment_text: reviewText } });
    });
  });
};