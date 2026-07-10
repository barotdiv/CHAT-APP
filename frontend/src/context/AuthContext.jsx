import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user on mount
    const storedUser = localStorage.getItem('chatAppUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email) => {
    const now = new Date().toISOString();
    // Try to preserve existing user data if they are already in local storage to keep their createdAt date
    const existingStr = localStorage.getItem('chatAppUser');
    let existingUser = null;
    if (existingStr) {
      try {
        existingUser = JSON.parse(existingStr);
      } catch (e) {
        // ignore
      }
    }
    
    const userData = {
      email,
      name: existingUser?.name || email.split('@')[0],
      avatar: existingUser?.avatar || null,
      id: existingUser?.id || Math.random().toString(36).substring(7),
      createdAt: existingUser?.createdAt || now,
      lastLogin: now,
    };
    setUser(userData);
    localStorage.setItem('chatAppUser', JSON.stringify(userData));
  };

  const signup = (fullName, email) => {
    const now = new Date().toISOString();
    const userData = {
      email,
      name: fullName,
      avatar: null,
      id: Math.random().toString(36).substring(7),
      createdAt: now,
      lastLogin: now,
    };
    setUser(userData);
    localStorage.setItem('chatAppUser', JSON.stringify(userData));
  };

  const updateProfile = (data) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...data };
      localStorage.setItem('chatAppUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chatAppUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
