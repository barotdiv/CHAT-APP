import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // When the app loads, check if we have a token saved in localStorage
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('chatAppToken');

      if (token) {
        try {
          // If we have a token, ask the backend if it's still valid
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('chatAppToken');
          }
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }
      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error('Login failed');

    const data = await res.json();
    localStorage.setItem('chatAppToken', data.token); // Save the VIP pass!
    setUser({ _id: data._id, name: data.name, email: data.email });
  };

  const signup = async (name, email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) throw new Error('Signup failed');

    const data = await res.json();
    localStorage.setItem('chatAppToken', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chatAppToken');
  };

  // We are skipping updateProfile for now to keep it simple!

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);