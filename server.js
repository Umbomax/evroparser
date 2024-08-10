const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Подключение к базе данных
const connectDB = async () => {
    return mysql.createConnection(process.env.MYSQL_URL);
};

// API для получения списка товаров с фильтрацией, пагинацией и поиском
app.get('/api/products', async (req, res) => {
    const { search = '', page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * parseInt(limit, 10);
    const searchValue = search.trim() === '' ? '%' : `%${search}%`;

    try {
        const connection = await connectDB();

        // Примечание: добавляем LIMIT и OFFSET непосредственно в SQL-запрос
        const query = `
            SELECT p.id, p.title, p.image, p.link, pr.price, pr.date
            FROM products p
            LEFT JOIN prices pr ON p.id = pr.product_id
            WHERE p.title LIKE ?
            ORDER BY pr.date DESC
            LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
        `;

        const [products] = await connection.execute(query, [searchValue]);

        // Получение общего количества товаров для пагинации
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

        const [prices] = await connection.execute(`
            SELECT price, date 
            FROM prices 
            WHERE product_id = ?
            ORDER BY date ASC`, [id]);

        await connection.end();

        res.json(prices);
    } catch (error) {
        console.error('Ошибка при получении данных о ценах:', error);
        res.status(500).json({ error: 'Ошибка при получении данных о ценах' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
