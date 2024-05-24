const puppeteer = require('puppeteer');
const fs = require('fs');

async function fetchProductData() {
    const baseUrl = 'https://edostavka.by/category/5194?page=';
    const totalPages = 1;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let allProducts = [];

    try {
        for (let i = 1; i <= totalPages; i++) {
            const url = `${baseUrl}${i}&lc=5`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

            // Извлекаем данные
            const products = await page.evaluate(() => {
                // Находим блок, содержащий products_products
                const productContainer = document.querySelector('[class*="products_products"]');
                if (!productContainer) return [];

                // Извлекаем элементы, содержащие adult-wrapper_adult
                const productElements = productContainer.querySelectorAll('[class*="adult-wrapper_adult"]');
                const productData = [];

                productElements.forEach(product => {
                    // Изображение
                    const pictureElement = product.querySelector('[class*="card-image_adult"] picture');
                    const sourceElement = pictureElement ? pictureElement.querySelector('source') : null;
                    const imageSrc = sourceElement ? sourceElement.srcset.split(' ')[0] : null;

                    // Название
                    const titleElement = product.querySelector('[class*="vertical_information"] a');
                    const title = titleElement ? titleElement.textContent.trim() : null;

                    // Цена
                    const priceElement = product.querySelector('[class*="vertical_information"] [class*="price_price"] span');
                    const price = priceElement ? priceElement.textContent.trim() : null;

                    // Ссылка на товар
                    const linkElement = product.querySelector('[class*="card-image_link"]');
                    const link = linkElement ? linkElement.href : null;

                    // Добавляем объект с данными продукта в массив
                    productData.push({
                        image: imageSrc,
                        title: title,
                        price: price,
                        link: link
                    });
                });

                return productData;
            });

            allProducts = allProducts.concat(products);
        }

        // Сохраняем данные в JSON файл
        fs.writeFileSync('products.json', JSON.stringify(allProducts, null, 2));
        console.log('Данные успешно сохранены в products.json');
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    } finally {
        await browser.close();
    }
}

fetchProductData();
