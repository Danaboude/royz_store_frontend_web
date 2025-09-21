'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id?: number;
  name?: string;
  email?: string;
  profile_image?: string;
  roleId?: number;
  delivery_id?: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On mount, check for token and set user state
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          id: payload.id, 
          name: payload.name, 
          email: payload.email, 
          roleId: payload.roleId,
          delivery_id: payload.delivery_id 
        });
      } catch (error) {
        console.error('Error parsing token:', error);
        // Invalid token, clear it
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  // Add a fallback effect to handle cases where API call fails but token is valid
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && isLoggedIn && user && !user.delivery_id && user.roleId === 6) {
      // If we have a valid user but no delivery_id for delivery personnel, 
      // try to extract it from the token as fallback
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.delivery_id) {
          console.log('Using delivery_id from token as fallback:', payload.delivery_id);
          setUser(prev => prev ? { ...prev, delivery_id: payload.delivery_id } : null);
        }
      } catch (error) {
        console.error('Error parsing token for delivery_id fallback:', error);
      }
    }
  }, [isLoggedIn, user]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 