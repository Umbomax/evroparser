import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivacyPolicy from './Components/PrivacyPolicy/PrivacyPolicy.jsx';
import TermsOfService from './Components/TermsOfService/TermsOfService.jsx';
import Main from './Components/Main/Main.jsx';
import './App.css';



const App = () => {




    return (
       
            <Router>
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/tracked-products" element={<Main showTrackedProducts={true} />} />
                </Routes>
            </Router>
        
    );
};

export default App;
