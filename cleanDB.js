require('dotenv').config();
const mysql = require('mysql2/promise');

// Функция для удаления мягких дефисов из базы данных
async function cleanDatabase() {
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    try {
        const tables = ['products', 'reworked_prices'];

        for (const table of tables) {
            // Получение всех текстовых столбцов
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = ? AND DATA_TYPE IN ('varchar', 'text', 'char')`, [table]);

            for (const column of columns) {
                const columnName = column.COLUMN_NAME;

                // Обновление данных в столбце с удалением мягких дефисов
                const query = `
                    UPDATE ${table}
                    SET ${columnName} = REPLACE(${columnName}, UNHEX('C2AD'), '')
                    WHERE ${columnName} LIKE CONCAT('%', UNHEX('C2AD'), '%')`;

                await connection.execute(query);
                console.log(`Мягкие дефисы удалены из столбца ${columnName} в таблице ${table}`);
            }
        }

        console.log('Удаление мягких дефисов завершено');
    } catch (error) {
        console.error('Ошибка при удалении мягких дефисов:', error);
    } finally {
        await connection.end();
    }
}

// Выполнение скрипта
cleanDatabase();
