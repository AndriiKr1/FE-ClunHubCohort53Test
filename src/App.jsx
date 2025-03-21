import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage/WelcomePage';
import RegisterPage from './components/Registration/RegisterPage';
import LoginPage from './components/Login/LoginPage';
import ForgotPasswordPage from './components/ForgotPassword/ForgotPasswordPage';

// Заглушки для майбутніх компонентів

const Dashboard = () => <div>Dashboard Page</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
