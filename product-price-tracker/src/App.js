import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Input, Pagination, Select } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const { Option } = Select;

const App = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [total, setTotal] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [priceData, setPriceData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [search, page, limit]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products', {
                params: { search, page, limit }
            });
            setProducts(response.data.products);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };

    const fetchPriceData = async (productId) => {
        try {
            const response = await axios.get(`/api/products/${productId}/prices`);
            setPriceData(response.data);
        } catch (error) {
            console.error('Ошибка при получении данных о ценах:', error);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        fetchPriceData(product.id);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setPriceData([]);
    };

    return (
        <div className="App">
            <Input 
                placeholder="Поиск товаров..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
            />
            <Select defaultValue={15} onChange={(value) => setLimit(value)} style={{ margin: '10px' }}>
                <Option value={15}>15</Option>
                <Option value={30}>30</Option>
                <Option value={60}>60</Option>
            </Select>
            <div className="product-list">
                {products.map(product => (
                    <div key={product.id} className="product-card" onClick={() => handleProductClick(product)}>
                        <h3>{product.title}</h3>
                        <img src={product.image} alt={product.title} />
                        <p>{product.price ? `${product.price} р.` : 'Цена не указана'}</p>
                    </div>
                ))}
            </div>
            <Pagination 
                current={page} 
                total={total} 
                pageSize={limit} 
                onChange={(page) => setPage(page)} 
                style={{ marginTop: '20px' }} 
            />
            {selectedProduct && (
                <Modal visible={modalVisible} onCancel={handleModalClose} footer={null}>
                    <h2>{selectedProduct.title}</h2>
                    <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: '100%' }} />
                    <p>Цена на последнюю дату: {selectedProduct.price ? `${selectedProduct.price} р.` : 'Не указано'}</p>
                    <p>Дата последнего сканирования: {selectedProduct.date}</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={priceData}>
                            <CartesianGrid stroke="#f5f5f5" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="price" stroke="#ff7300" />
                        </LineChart>
                    </ResponsiveContainer>
                </Modal>
            )}
        </div>
    );
};

export default App;
