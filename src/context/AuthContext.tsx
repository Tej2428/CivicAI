import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/civic';
import { MOCK_USERS } from '../data/mockData';
import { loadCurrentUser, saveCurrentUser } from '../utils/storage';

interface AuthContextType {
  currentUser: UserProfile;
  role: UserRole;
  isDemoRoleSwitch: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (name: string, email: string, role?: UserRole, department?: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => loadCurrentUser());
  const [isDemoRoleSwitch, setIsDemoRoleSwitch] = useState<boolean>(true);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  const switchDemoRole = (newRole: UserRole) => {
    // Find matching mock user for role
    const matched = MOCK_USERS.find((u) => u.role === newRole) || {
      id: `user_${newRole}_${Date.now()}`,
      name: newRole === 'admin' ? 'Administrator' : newRole === 'officer' ? 'Municipal Officer' : 'Citizen',
      email: `${newRole}@civicai.org`,
      role: newRole,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(matched);
    setIsDemoRoleSwitch(true);
  };

  const login = async (email: string, preferredRole?: UserRole): Promise<boolean> => {
    // Match existing user or create realistic session
    const existing = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      return true;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' '),
      email,
      role: preferredRole || 'citizen',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    return true;
  };

  const register = async (
    name: string,
    email: string,
    preferredRole?: UserRole,
    department?: string
  ): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: preferredRole || 'citizen',
      department: preferredRole !== 'citizen' ? department || 'Public Works Department' : undefined,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    // Revert to default citizen
    setCurrentUser(MOCK_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        isDemoRoleSwitch,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
