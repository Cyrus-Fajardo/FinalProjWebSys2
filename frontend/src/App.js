import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './css/global.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ManageUsers from './pages/ManageUsers';
import ManageFarmers from './pages/ManageFarmers';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute allowedRoles={['Farmer', 'Buyer', 'Kaluppa Foundation']}>
              <Marketplace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute allowedRoles={['Kaluppa Foundation', 'DTI']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-farmers"
          element={
            <ProtectedRoute allowedRoles={['Farmer', 'Kaluppa Foundation', 'DTI', 'Group Manager']}>
              <ManageFarmers />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
