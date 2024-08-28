const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
    return mysql.createConnection(process.env.MYSQL_URL);
};

// Функция для генерации всех дат между start_date и end_date
const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate || new Date())) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

// API для получения списка товаров с фильтрацией, пагинацией и поиском
app.get('/api/products', async (req, res) => {
    const { search = '', page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * parseInt(limit, 10);
    const searchValue = search.trim() === '' ? '%' : `%${search}%`;

    try {
        const connection = await connectDB();

        // Подзапрос для получения последней цены для каждого товара
        const query = `
            SELECT p.id, p.title, p.image, p.link, rp.price, rp.old_price, rp.start_date AS date
            FROM products p
            LEFT JOIN (
                SELECT product_id, price, old_price, start_date
                FROM reworked_prices
                WHERE start_date = (SELECT MAX(start_date) FROM reworked_prices WHERE product_id = reworked_prices.product_id)
            ) rp ON p.id = rp.product_id
            WHERE p.title LIKE ?
            ORDER BY rp.start_date DESC
            LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
        `;

        const [products] = await connection.execute(query, [searchValue]);

        const [total] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM products 
            WHERE title LIKE ?`, [searchValue]);

        await connection.end();

        res.json({ products, total: total[0].total });
    } catch (error) {
        console.error('Ошибка при получении списка товаров:', error);
        res.status(500).json({ error: 'Ошибка при получении списка товаров' });
    }
});

// API для получения данных о ценах по ID товара
app.get('/api/products/:id/prices', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await connectDB();

        const [priceRanges] = await connection.execute(`
            SELECT price, old_price, start_date, end_date
            FROM reworked_prices 
            WHERE product_id = ?
            ORDER BY start_date ASC`, [id]);

        const prices = [];

        // Генерация ежедневных записей с ценами
        priceRanges.forEach(range => {
            const { price, old_price, start_date, end_date } = range;
            const dates = generateDateRange(start_date, end_date);

            dates.forEach(date => {
                prices.push({
                    date: date,
                    price: price,
                    old_price: old_price
                });
            });
        });

        await connection.end();

        res.json(prices);
    } catch (error) {
        console.error('Ошибка при получении данных о ценах:', error);
        res.status(500).json({ error: 'Ошибка при получении данных о ценах' });
    }
});
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    try {
        const connection = await connectDB();

        // Проверка существующего пользователя
        const [userExists] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (userExists.length > 0) {
            await connection.end();
            return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Вставка нового пользователя в базу данных
        await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        await connection.end();
        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации пользователя:', error);
        res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    try {
        const connection = await connectDB();

        // Поиск пользователя по email
        const [user] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const validPassword = await bcrypt.compare(password, user[0].password);

        if (!validPassword) {
            await connection.end();
            return res.status(401).json({ error: 'Неправильный пароль' });
        }

        // Генерация JWT токена
        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await connection.end();
        res.json({ token, message: 'Вход успешен' });
    } catch (error) {
        console.error('Ошибка при входе пользователя:', error);
        res.status(500).json({ error: 'Ошибка при входе пользователя' });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
