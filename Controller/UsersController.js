'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./../settings/db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/avatars/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

// ========== РЕГИСТРАЦИЯ ==========
exports.signup = (req, res) => {
    console.log("Получен запрос на регистрацию:", req.body);
    
    const { email, name, password, role } = req.body;
    if (!role) {
        return res.status(400).json({ message: 'Роль не указана' });
    }

    db.query("SELECT `id` FROM `users` WHERE `email` = ?", [email], (error, results) => {
        if (error) {
            return res.status(400).json({ message: 'Ошибка проверки пользователя', error });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: `Пользователь с почтой ${email} уже зарегистрирован` });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const sql = "INSERT INTO `users`(`name`, `email`, `role`, `password`) VALUES (?, ?, ?, ?)";

        db.query(sql, [name, email, role, hashedPassword], (error, results) => {
            if (error) {
                return res.status(400).json({ message: 'Ошибка при регистрации', error });
            }
            res.status(201).json({ message: 'Регистрация успешна' });
        });
    });
};

// ========== АВТОРИЗАЦИЯ ==========
exports.signin = (req, res) => {
    console.log("Получен запрос на вход:", req.body);
    
    const { email, password, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Введите email и пароль' });
    }
    
    db.query("SELECT * FROM `users` WHERE `email` = ?", [email], (error, results) => {
        if (error) {
            console.error("Ошибка БД:", error);
            return res.status(500).json({ message: 'Ошибка сервера', error });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        const user = results[0];
        
        if (role && user.role !== role) {
            return res.status(401).json({ 
                message: `Этот email зарегистрирован как ${user.role === 'teacher' ? 'преподаватель' : 'студент'}` 
            });
        }
        
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'MySecretKey2024!Lernly#Super',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: 'Вход выполнен успешно',
            token: token,
            name: user.name,
            email: user.email,
            role: user.role,
            id: user.id,
            image: user.image ? `data:image/jpeg;base64,${user.image.toString('base64')}` : null
        });
    });
};

// ========== ЗАЯВКИ ==========
exports.createApplication = (req, res) => {
    console.log("Получен запрос на создание заявки:", req.body);
    
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Некорректный email' });
    }
    
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

// ========== КОММЕНТАРИИ ==========
exports.getComments = (req, res) => {
    const sql = "SELECT * FROM `comments` ORDER BY `id` DESC";
    db.query(sql, (error, results) => {
        if (error) {
            console.error("Ошибка получения комментариев:", error);
            return res.status(500).json({ message: 'Ошибка сервера', error });
        }
        res.status(200).json(results);
    });
};

exports.addComment = (req, res) => {
    const { name, email, reviewText } = req.body;

    db.query("SELECT `id`, `name` FROM `users` WHERE `email` = ?", [email], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Ошибка базы данных', error });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Пользователь с таким email не найден' });
        }

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

// ========== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ==========
// Получить данные пользователя по ID
exports.getUserById = (req, res) => {
    const userId = req.params.id;
    
    db.query("SELECT id, name, email, role, image FROM `users` WHERE `id` = ?", [userId], (error, results) => {
        if (error) {
            console.error("Ошибка получения пользователя:", error);
            return res.status(500).json({ message: 'Ошибка сервера', error });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        let user = results[0];
        
        // Конвертируем BLOB в base64, если изображение есть
        if (user.image) {
            user.image = `data:image/jpeg;base64,${user.image.toString('base64')}`;
        }
        
        res.status(200).json(user);
    });
};

// Обновить данные пользователя
exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const { name, email, password } = req.body;
    
    let updateFields = [];
    let values = [];
    
    if (name) {
        updateFields.push('name = ?');
        values.push(name);
    }
    
    if (email) {
        updateFields.push('email = ?');
        values.push(email);
    }
    
    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Нет данных для обновления' });
    }
    
    values.push(userId);
    
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.query(query, values, (error, results) => {
        if (error) {
            console.error("Ошибка обновления пользователя:", error);
            return res.status(500).json({ message: 'Ошибка сервера', error });
        }
        
        res.status(200).json({ message: 'Данные успешно обновлены' });
    });
};

// Загрузить аватар пользователя
exports.uploadAvatar = (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            return res.status(400).json({ message: 'Ошибка загрузки файла' });
        }
        
        const userId = req.body.userId;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }
        
        // Читаем файл как BLOB
        const imageBuffer = fs.readFileSync(req.file.path);
        
        // Обновляем изображение в базе данных
        db.query('UPDATE users SET image = ? WHERE id = ?', [imageBuffer, userId], (error, results) => {
            // Удаляем временный файл
            fs.unlinkSync(req.file.path);
            
            if (error) {
                console.error("Ошибка обновления аватара:", error);
                return res.status(500).json({ message: 'Ошибка сервера', error });
            }
            
            // Возвращаем base64 изображения
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            
            res.status(200).json({ 
                message: 'Аватар успешно загружен',
                imageUrl: imageUrl 
            });
        });
    });
};