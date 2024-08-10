const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function fetchProductData() {
    const baseUrl = 'https://edostavka.by/category/5194?page=';
    const totalPages = 1;

    // Подключаемся к базе данных MySQL
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let allProducts = [];

    try {
        for (let i = 1; i <= totalPages; i++) {
            const url = `${baseUrl}${i}&lc=5`;
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

        // Сохраняем данные в MySQL
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

            await connection.execute(
                'INSERT INTO prices (product_id, price, date) VALUES (?, ?, CURDATE())',
                [productId, product.price]
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
