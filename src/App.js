import React, { useState } from 'react';
import { Modal, Input, Button, Form, Select, Pagination, message } from 'antd';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
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
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/products', {
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
            const response = await axios.get(`http://localhost:5000/api/products/${productId}/prices`);
            setPriceData(response.data);
        } catch (error) {
            console.error('Ошибка при получении данных о ценах:', error);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        fetchPriceData(product.id);
    };

    const handleSearch = () => {
        fetchProducts();
    };

    const handleLogin = () => {
        setLoginModalOpen(true);
        setIsRegistering(false);
    };

    const handleRegister = () => {
        setLoginModalOpen(true);
        setIsRegistering(true);
    };

    const handleModalClose = () => {
        setLoginModalOpen(false);
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
            handleModalClose();
        } catch (error) {
            message.error(error.response?.data?.error || 'Произошла ошибка');
        }
    };

    return (
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
            <div className="App">
                <Header onLogin={handleLogin} onRegister={handleRegister} />
                <Input 
                    placeholder="Поиск товаров..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    style={{ margin: '20px 0' }}
                />
                <Button onClick={handleSearch} type="primary" style={{ marginBottom: '20px' }}>
                    Найти
                </Button>
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
                <Modal
                    title={isRegistering ? "Регистрация" : "Вход"}
                    open={loginModalOpen}
                    onCancel={handleModalClose}
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
                            handleModalClose();
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
