const puppeteer = require('puppeteer');
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function fetchProductData() {
    const baseUrls = [
        'https://edostavka.by/category/5138',
        'https://edostavka.by/category/5150', 
        'https://edostavka.by/category/5045',   
        'https://edostavka.by/category/5194',
        'https://edostavka.by/category/5309',  
        'https://edostavka.by/category/5215',  
        'https://edostavka.by/category/5034',  
        'https://edostavka.by/category/4951',  
        'https://edostavka.by/category/5329',
        'https://edostavka.by/category/5275',  
        'https://edostavka.by/category/5199',  
        'https://edostavka.by/category/4974',  
        'https://edostavka.by/category/5131',  
        'https://edostavka.by/category/5091',  
        'https://edostavka.by/category/5005',  
        'https://edostavka.by/category/5160',  
        'https://edostavka.by/category/5185',  
        'https://edostavka.by/category/5258',  
        'https://edostavka.by/category/4996',  
        'https://edostavka.by/category/5826',  
        'https://edostavka.by/category/5994'
    ];

    // Подключаемся к базе данных MySQL
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let allProducts = [];

    try {
        for (const baseUrl of baseUrls) {
            // Открываем первую страницу для получения totalPages
            await page.goto(`${baseUrl}?page=1&lc=5`, { waitUntil: 'networkidle2', timeout: 0 });

            // Извлекаем количество страниц
            const totalPages = await page.evaluate(() => {
                const paginationElement = document.querySelector('[class*="pagination_pagination"]');
                if (!paginationElement) return 1;

                
                const totalElements = paginationElement.children.length;
                return totalElements > 2 ? totalElements - 2 : 1;
            });

            for (let i = 1; i <= totalPages; i++) {
                const url = `${baseUrl}?page=${i}&lc=5`;
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

                // Извлекаем данные
                const products = await page.evaluate(() => {
                    const productContainer = document.querySelector('[class*="products_products"]');
                    if (!productContainer) return [];

                    const productElements = productContainer.querySelectorAll('[class*="adult-wrapper_adult"]');
                    const productData = [];

                    productElements.forEach(product => {
                        const pictureElement = product.querySelector('[class*="card-image_adult"] picture');
                        const sourceElement = pictureElement ? pictureElement.querySelector('source') : null;
                        const imageSrc = sourceElement ? sourceElement.srcset.split(' ')[0] : null;

                        const titleElement = product.querySelector('[class*="vertical_information"] a');
                        const title = titleElement ? titleElement.textContent.trim() : null;

                        const priceElement = product.querySelector('[class*="vertical_information"] [class*="price_price"] span');
                        const price = priceElement ? priceElement.textContent.trim().replace(' р.', '').replace(',', '.') : null;

                        const linkElement = product.querySelector('[class*="card-image_link"]');
                        const link = linkElement ? linkElement.href : null;

                        if (title && price && link) {
                            productData.push({
                                image: imageSrc,
                                title: title,
                                price: parseFloat(price),
                                link: link
                            });
                        }
                    });

                    return productData;
                });

                allProducts = allProducts.concat(products);
            }
        }

        // Оптимизированная запись данных в MySQL
        for (const product of allProducts) {
            const [rows] = await connection.execute('SELECT id FROM products WHERE link = ?', [product.link]);

            let productId;

            if (rows.length > 0) {
                productId = rows[0].id;
            } else {
                const [result] = await connection.execute(
                    'INSERT INTO products (title, image, link) VALUES (?, ?, ?)',
                    [product.title, product.image, product.link]
                );
                productId = result.insertId;
            }

            // Пакетная вставка данных о ценах
            const priceData = [productId, product.price];
            await connection.execute(
                'INSERT INTO prices (product_id, price, date) VALUES (?, ?, CURDATE())',
                priceData
            );
        }

        console.log('Данные успешно сохранены в MySQL');
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    } finally {
        await browser.close();
        await connection.end();
    }
}

fetchProductData();
