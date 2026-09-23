import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, setStoredToken, getStoredUser, setStoredUser, api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setStoredUser(profile);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    setToken(res.token);
    setUser(res.user);
    setStoredToken(res.token);
    setStoredUser(res.user);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
    setStoredUser(null);
  };

  const quickSwitchRole = async (username) => {
    try {
      await login(username, 'password123');
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    quickSwitchRole,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isNurse: user?.role === 'nurse',
    isReceptionist: user?.role === 'receptionist',
    isLabStaff: user?.role === 'lab_staff',
    isPharmacist: user?.role === 'pharmacist',
    isAccountant: user?.role === 'accountant'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
