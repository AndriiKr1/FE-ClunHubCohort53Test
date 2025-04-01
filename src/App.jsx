import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux'; // Додаємо Provider для Redux
import store from './store/store'; // Імпортуємо ваш Redux store
import WelcomePage from './components/WelcomePage/WelcomePage';
import RegisterPage from './components/Registration/RegisterPage';
import LoginPage from './components/Login/LoginPage';
import ForgotPasswordPage from './components/ForgotPassword/ForgotPasswordPage';
import Calendar from './components/Calendar/Calendar'; // Імпортуємо Calendar

// Заглушки для майбутніх компонентів

const Dashboard = () => <div>Dashboard Page</div>;

function App() {
  return (
    <Provider store={store}> {/* Обгортаємо додаток у Provider */}
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
        <Route path="/dashboard" element={<Calendar />} /> {/* Можна залишити і тут */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </Provider>
  );
}

export default App;
