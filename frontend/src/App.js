import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './css/global.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ManageUsers from './pages/ManageUsers';
import FarmerProfile from './pages/FarmerProfile';
import ManageFarmerDetails from './pages/ManageFarmerDetails';
import AccountInfo from './pages/AccountInfo';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/marketplace" element={<Marketplace />} />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute allowedRoles={['Kaluppa Foundation', 'DTI']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer-profile"
          element={
            <ProtectedRoute allowedRoles={['Farmer']}>
              <FarmerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-farmer-details"
          element={
            <ProtectedRoute allowedRoles={['Kaluppa Foundation', 'DTI', 'Group Manager']}>
              <ManageFarmerDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account-info"
          element={
            <ProtectedRoute allowedRoles={['Farmer', 'Buyer', 'Kaluppa Foundation', 'DTI', 'Group Manager']}>
              <AccountInfo />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/marketplace" />} />
      </Routes>
    </Router>
  );
}

export default App;
