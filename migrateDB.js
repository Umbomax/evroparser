const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePrices() {
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    try {
        // 1. Создание новой таблицы reworked_prices
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS reworked_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT,
                price DECIMAL(10, 2),
                old_price DECIMAL(10, 2) DEFAULT NULL,
                start_date DATE,
                end_date DATE DEFAULT NULL,
                on_sale BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // 2. Получение всех уникальных product_id из старой таблицы prices
        const [productIds] = await connection.execute(`SELECT DISTINCT product_id FROM prices`);

        for (const { product_id } of productIds) {
            // 3. Получение всех записей о ценах для конкретного продукта, отсортированных по дате
            const [prices] = await connection.execute(`
                SELECT price, date FROM prices
                WHERE product_id = ?
                ORDER BY date ASC
            `, [product_id]);

            let currentPrice = null;
            let startDate = null;

            for (const { price, date } of prices) {
                if (currentPrice === null) {
                    currentPrice = price;
                    startDate = date;
                } else if (currentPrice !== price) {
                    // 4. Переносим запись о старой цене в reworked_prices
                    await connection.execute(`
                        INSERT INTO reworked_prices (product_id, price, start_date, end_date)
                        VALUES (?, ?, ?, ?)
                    `, [product_id, currentPrice, startDate, date]);

                    // Обновляем текущую цену и стартовую дату
                    currentPrice = price;
                    startDate = date;
                }
            }

            // 5. Обработка последней записи, у которой нет end_date
            await connection.execute(`
                INSERT INTO reworked_prices (product_id, price, start_date)
                VALUES (?, ?, ?)
            `, [product_id, currentPrice, startDate]);
        }

        console.log('Миграция данных завершена успешно.');
    } catch (error) {
        console.error('Ошибка при миграции данных:', error);
    } finally {
        await connection.end();
    }
}

migratePrices();