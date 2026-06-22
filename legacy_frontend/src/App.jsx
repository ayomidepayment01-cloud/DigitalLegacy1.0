import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { Toaster } from 'react-hot-toast'; 
import Landing from './Landing';
import Dashboard from './Dashboard';
import Login from './Login';
import Register from './Register';
import Claim from './Claim'; 
import VerifyEmail from './VerifyEmail';
import Enable2FA from './Enable2FA';
import Confirm2FA from './Confirm2FA';
import Profile from './Profile';
import ThemeToggle from './ThemeToggle';

function App() {
  return (
    <ThemeProvider> 
      <Toaster position="top-right" reverseOrder={false} />
      <ThemeToggle />
      
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/enable-2fa" element={<Enable2FA />} />
          <Route path="/confirm-2fa" element={<Confirm2FA />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/claim" element={<Claim />} /> 
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;