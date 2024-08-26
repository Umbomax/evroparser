import React from 'react';
import { Button } from 'antd';
import classes from "./Header.module.css";

const Header = ({ onLogin }) => {
    return (
        <header className={classes.header}>
            <div className={classes.headerContent}>
                <h1 className={classes.siteTitle}>e-dostavka graphics</h1>
                <Button type="primary" onClick={onLogin}>Войти</Button>
            </div>
        </header>
    );
};

export default Header;
