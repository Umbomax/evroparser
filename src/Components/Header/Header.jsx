import React, { useState, useEffect } from "react";
import { Button, Menu } from "antd";
import { useNavigate } from "react-router-dom";
import classes from "./Header.module.css";

const Header = ({ email, onLogin }) => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token")); // Состояние для отслеживания, вошел ли пользователь

    const handleMenuClick = (route) => {
        navigate(route);
    };

    const onLogout = () => {
        localStorage.removeItem("token");
    };

    const handleLogout = () => {
        onLogout(); // Вызов функции выхода
        setIsLoggedIn(false); // Обновление состояния
    };

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, [localStorage.getItem('token')]);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("token"));
    }, [email]);

    return (
        <header className={classes.header}>
            <div className={classes.headerContent}>
                <h1 className={classes.siteTitle}>e-dostavka graphics</h1>
                {isLoggedIn && (
                    <nav className={classes.menu}>
                        <li onClick={() => handleMenuClick("/")}>Главная</li>
                        <li onClick={() => handleMenuClick("/tracked-products")}>Отслеживаемые товары</li>
                    </nav>
                )}
                <div className={classes.userActions}>
                    {isLoggedIn ? (
                        <>
                            <span className={classes.userEmail}>Вы вошли как {email}</span>
                            <Button type="primary" onClick={handleLogout}>
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <Button type="primary" onClick={onLogin}>
                            Войти
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
