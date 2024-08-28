import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Input, Pagination, Select, Button, Form } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [key, setKey] = useState(0);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        fetchProducts();  // Загрузка товаров при первой загрузке страницы
    }, [page, limit]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('https://pacific-commitment-production.up.railway.app/api/products', {
                params: { search, page, limit }
            });
            setProducts(response.data.products);
            setTotal(response.data.total);
            setKey(prevKey => prevKey + 1); // Обновляем ключ для перемонтирования
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

    const handleSearch = () => {
        fetchProducts();
    };

    const handleRegister = () => {
        setLoginModalVisible(true);
        setIsRegistering(true);
    };
    const handleLoginModalClose = () => {
        setLoginModalVisible(false);
    };

    const handleLogin = () => {
        setLoginModalVisible(true);
        setIsRegistering(false);
    };


    const onFinish = async (values) => {
        try {
            if (isRegistering) {
                const response = await axios.post('http://localhost:5000/api/register', values);
                message.success(response.data.message);
            } else {
                const response = await axios.post('http://localhost:5000/api/login', values);
                message.success(response.data.message);
                localStorage.setItem('token', response.data.token);
            }
            handleLoginModalClose();
        } catch (error) {
            message.error(error.response.data.error || 'Произошла ошибка');
        }
    };
    return (
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID"> {/* Замените YOUR_GOOGLE_CLIENT_ID на реальный ID */}
            <div className="App">
                <Header onLogin={handleLogin} onRegister={handleRegister} />
                <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                    <Input 
                        placeholder="Поиск товаров..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <Button type="primary" onClick={handleSearch}>Найти</Button>
                </div>
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
                <div key={key} className="product-list">
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
                <Modal
                    title={isRegistering ? "Регистрация" : "Вход"}
                    visible={loginModalVisible}
                    onCancel={handleLoginModalClose}
                    footer={null}
                >
                    <Form layout="vertical" onFinish={onFinish}>
                        {isRegistering && (
                            <Form.Item
                                label="Имя пользователя"
                                name="username"
                                rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
                            >
                                <Input placeholder="Введите ваше имя пользователя" />
                            </Form.Item>
                        )}
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}
                        >
                            <Input placeholder="Введите ваш email" />
                        </Form.Item>
                        <Form.Item
                            label="Пароль"
                            name="password"
                            rules={[{ required: true, message: 'Пожалуйста, введите ваш пароль' }]}
                        >
                            <Input.Password placeholder="Введите ваш пароль" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            {isRegistering ? "Зарегистрироваться" : "Войти"}
                        </Button>
                    </Form>
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>или</div>
                    <GoogleLogin
                        onSuccess={credentialResponse => {
                            console.log(credentialResponse);
                            handleLoginModalClose();
                        }}
                        onError={() => {
                            console.log('Ошибка при входе через Google');
                        }}
                    />
                </Modal>
            </div>
        </GoogleOAuthProvider>
    );
};

export default App;
