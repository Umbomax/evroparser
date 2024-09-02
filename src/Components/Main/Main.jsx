import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Form, Select, Pagination, message, Checkbox } from 'antd';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Header from '../Header/Header';
import '../../App.css';
import jwtDecode from 'jwt-decode';

const { Option } = Select;

const Main = ({ showTrackedProducts = false }) => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [email, setEmail] = useState(localStorage.getItem('email') || '');;
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [total, setTotal] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [priceData, setPriceData] = useState([]);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [key, setKey] = useState(0);
    const [isTracked, setIsTracked] = useState(false); 
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Обновленная функция fetchProducts, которая поддерживает оба режима
    const fetchProducts = async () => {
        try {
            const url = showTrackedProducts 
                ? 'https://pacific-commitment-production.up.railway.app/api/tracked-products' 
                : 'https://pacific-commitment-production.up.railway.app/api/products';
            const token = localStorage.getItem('token');
            const response = await axios.get(url, {
                params: { search, page, limit },
                headers: showTrackedProducts ? { Authorization: `Bearer ${token}` } : {}
            });
            setProducts(response.data.products);
            setTotal(response.data.total);
            setKey(prevKey => prevKey + 1);
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    useEffect(() => {
        fetchProducts();
    }, [showTrackedProducts]);
    
    useEffect(() => {
        fetchProducts();
    }, [page, limit]);

    const fetchPriceData = async (productId) => {
        try {
            const response = await axios.get(`https://pacific-commitment-production.up.railway.app/api/products/${productId}/prices`);
            setPriceData(response.data);
        } catch (error) {
            console.error('Ошибка при получении данных о ценах:', error);
        }
    };

    const saveEmail = (email) => {
        console.log(email)
        localStorage.setItem('email', email);
        setEmail(email);
    };

    const fetchTrackedStatus = async (productId) => {
        try {
            const response = await axios.post(
                'https://pacific-commitment-production.up.railway.app/api/check-tracked',
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setIsTracked(response.data.isTracked);
        } catch (error) {
            console.error('Ошибка при проверке статуса отслеживания:', error);
        }
    };

    const handleProductClick = (product) => {
        setModalVisible(true);
        setSelectedProduct(product);
        fetchPriceData(product.id);
        fetchTrackedStatus(product.id);
    };

    // handleSearch вызывает fetchProducts вручную для выполнения поиска
    const handleSearch = () => {
        fetchProducts();
    };

    const handleLogin = () => {
        setIsRegistering(false);
        setLoginModalOpen(true);
    };

    const handleRegister = () => {
        setIsRegistering(true);
        setLoginModalOpen(true);
    };

    const handleModalClose = () => {
        setLoginModalOpen(false);
        setModalVisible(false);
    };

    const onFinish = async (values) => {
        try {
            if (isRegistering) {
                const response = await axios.post('https://pacific-commitment-production.up.railway.app/api/register', values);
                message.success(response.data.message);
            } else {
                const response = await axios.post('https://pacific-commitment-production.up.railway.app/api/login', values);
                message.success(response.data.message);
                localStorage.setItem('token', response.data.token);
                saveEmail(values.email)
            }
            setEmail(values.email);
            handleModalClose();
        } catch (error) {
            message.error(error.response?.data?.error || 'Произошла ошибка');
        }
    };

    const handleTrackingChange = async (checked) => {
        const token = localStorage.getItem('token');
        if (!token) {
            message.error('Вы должны быть авторизованы для отслеживания товаров');
            return;
        }

        try {
            if (checked) {
                await axios.post('https://pacific-commitment-production.up.railway.app/api/track-product', { productId: selectedProduct.id }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Товар добавлен в отслеживаемые');
            } else {
                await axios.post('https://pacific-commitment-production.up.railway.app/api/untrack-product', { productId: selectedProduct.id }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Товар удален из отслеживаемых');
            }
            setIsTracked(checked);
        } catch (error) {
            console.error('Ошибка при изменении статуса отслеживания:', error);
            message.error('Ошибка при изменении статуса отслеживания');
        }
    };

    const handleGoogleLoginSuccess = async (credentialResponse) => {
        try {
            const decodedToken = jwt_decode(credentialResponse.credential);
            const userEmail = decodedToken.email;
    
            const response = await axios.post('https://pacific-commitment-production.up.railway.app/api/google-login', {
                token: credentialResponse.credential
            });
    
            message.success(response.data.message);
            localStorage.setItem('token', response.data.token);
            saveEmail(userEmail);  
            handleModalClose();
        } catch (error) {
            console.error('Ошибка при входе через Google:', error);
            message.error('Ошибка при входе через Google');
        }
    };
    

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="App">
                <Header email={email} onLogin={handleLogin} onRegister={handleRegister} />
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
                <div key={key} className="product-list">
                    {products.map((product, index) => (
                        <div key={index} className="product-card" onClick={() => handleProductClick(product)}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <Button type={!isRegistering ? 'primary' : 'default'} onClick={() => setIsRegistering(false)}>
                            Войти
                        </Button>
                        <Button type={isRegistering ? 'primary' : 'default'} onClick={() => setIsRegistering(true)}>
                            Зарегистрироваться
                        </Button>
                    </div>
                    <Form layout="vertical" onFinish={onFinish}>
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
                        {isRegistering && (
                            <Form.Item
                                label="Подтверждение пароля"
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: 'Пожалуйста, подтвердите ваш пароль' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Пароли не совпадают!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Подтвердите ваш пароль" />
                            </Form.Item>
                        )}
                        <Button type="primary" htmlType="submit" block>
                            {isRegistering ? "Зарегистрироваться" : "Войти"}
                        </Button>
                    </Form>
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>или</div>
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => {
                            console.log('Ошибка при входе через Google');
                        }}
                    />
                </Modal>
                {selectedProduct && (
                    <Modal visible={modalVisible} onCancel={handleModalClose} footer={null}>
                    <h2>{selectedProduct.title}</h2>
                    <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: '100%' }} />
                    <p>Цена на последнюю дату: {selectedProduct.price ? `${selectedProduct.price} р.` : 'Не указано'}</p>
                    <p>Дата последнего сканирования: {selectedProduct.date}</p>
                    
                    <Checkbox
                        checked={isTracked}
                        onChange={(e) => handleTrackingChange(e.target.checked)}
                    >
                        Отслеживать
                    </Checkbox>
            
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
        </GoogleOAuthProvider>
    );
};

export default Main;
