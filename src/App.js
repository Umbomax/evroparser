import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Input, Pagination, Select } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import Header from './Components/Header/Header.jsx'; 
import './App.css'; 

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
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 2000);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, limit]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('https://pacific-commitment-production.up.railway.app/api/products', {
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
            const response = await axios.get(`https://pacific-commitment-production.up.railway.app/api/products/${productId}/prices`);
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

    const handleLogin = () => {
        console.log('Вход выполнен');
    };

    return (
        <div className="App">
            <Header onLogin={handleLogin} /> 
            <Input 
                placeholder="Поиск товаров..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ margin: '20px 0' }}
            />
            <Select defaultValue={15} onChange={(value) => setLimit(value)} style={{ margin: '10px' }}>
                <Option value={15}>15</Option>
                <Option value={30}>30</Option>
                <Option value={60}>60</Option>
            </Select>
            <Pagination 
                current={page} 
                total={total} 
                pageSize={limit} 
                onChange={(page) => setPage(page)} 
                style={{ marginTop: '20px' }} 
            />
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
                            {priceData.some(item => item.old_price) && (
                                <Line type="monotone" dataKey="old_price" stroke="#8884d8" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </Modal>
            )}
        </div>
    );
};

export default App;
