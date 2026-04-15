import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { userAPI } from '../js/api';
import '../css/AccountInfo.css';

function AccountInfo() {
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    password: '',
    verificationCertificateUrl: '',
  });
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMe = async () => {
    try {
      const me = await userAPI.getMe();
      setUser(me);
      setForm((prev) => ({
        ...prev,
        fullname: me.fullname || '',
        email: me.email || '',
        verificationCertificateUrl: me.verificationCertificateUrl || '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to load account info');
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const saveAccount = async () => {
    setMessage('');
    setError('');

    try {
      const payload = {
        fullname: form.fullname,
        email: form.email,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const result = await userAPI.updateMe(payload);
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify({
        ...(JSON.parse(localStorage.getItem('user') || '{}')),
        fullname: result.user.fullname,
        email: result.user.email,
        isVerified: result.user.isVerified,
      }));
      setMessage('Account info updated successfully.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message || 'Failed to update account info');
    }
  };

  const submitVerification = async () => {
    setMessage('');
    setError('');

    try {
      const result = await userAPI.verifyMe(form.verificationCertificateUrl);
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify({
        ...(JSON.parse(localStorage.getItem('user') || '{}')),
        isVerified: result.user.isVerified,
        verificationCertificateUrl: result.user.verificationCertificateUrl,
      }));
      setMessage('Verification submitted successfully.');
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  const shouldVerify = user && ['Buyer', 'Farmer'].includes(user.role);

  return (
    <div className="account-info-page">
      <Sidebar />

      <div className="account-info-content">
        <h1>Account Info</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="account-card">
          <label>
            Full Name
            <input value={form.fullname} onChange={(e) => setForm((prev) => ({ ...prev, fullname: e.target.value }))} />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </label>

          <label>
            New Password
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          </label>

          <button className="save-btn" onClick={saveAccount}>Save Account Info</button>

          {shouldVerify && (
            <div className="verify-box">
              <h2>
                Verification Status: {user?.isVerified ? 'Verified' : 'Unverified'}
              </h2>
              <label>
                Certificate URL
                <input
                  value={form.verificationCertificateUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, verificationCertificateUrl: e.target.value }))}
                  placeholder="Paste your certificate link"
                />
              </label>
              {!user?.isVerified && (
                <button className="verify-btn" onClick={submitVerification}>Submit Verification</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountInfo;
