import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'principal' | 'registrar' | 'hod' | 'program-head' | 'employee';
  department?: string;
  branch?: string;
  avatar?: string;
  permissions: {
    canApprove: boolean;
    canViewAllDepartments: boolean;
    canManageWorkflows: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

type RolePermissions = User['permissions'];

const ROLE_PERMISSIONS: Record<User['role'], RolePermissions> = {
  principal: {
    canApprove: true,
    canViewAllDepartments: true,
    canManageWorkflows: true,
    canViewAnalytics: true,
    canManageUsers: true,
  },
  registrar: {
    canApprove: true,
    canViewAllDepartments: true,
    canManageWorkflows: true,
    canViewAnalytics: true,
    canManageUsers: false,
  },
  hod: {
    canApprove: true,
    canViewAllDepartments: false,
    canManageWorkflows: true,
    canViewAnalytics: true,
    canManageUsers: false,
  },
  'program-head': {
    canApprove: true,
    canViewAllDepartments: false,
    canManageWorkflows: true,
    canViewAnalytics: true,
    canManageUsers: false,
  },
  employee: {
    canApprove: true,
    canViewAllDepartments: false,
    canManageWorkflows: true,
    canViewAnalytics: true,
    canManageUsers: false,
  },
};

function getUserPermissions(role: string): RolePermissions {
  return ROLE_PERMISSIONS[role as User['role']] ?? ROLE_PERMISSIONS.employee;
}

// Mock recipients data that was previously in Supabase
export const MOCK_RECIPIENTS = [
  { user_id: 'u1', name: 'Dr. John Doe', email: 'john.doe@university.edu', role: 'Principal', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'u2', name: 'Dr. Jane Smith', email: 'jane.smith@university.edu', role: 'Registrar', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'u3', name: 'Dr. Maria Garcia', email: 'maria.garcia@university.edu', role: 'HOD', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'u4', name: 'Prof. Robert Brown', email: 'robert.brown@university.edu', role: 'Program Head', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'u5', name: 'Alice Wilson', email: 'alice.wilson@university.edu', role: 'EMPLOYEE', department: 'Computer Science', branch: 'Main', avatar: '' },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user from sessionStorage immediately to avoid loading state
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('iaoms-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Update permissions to ensure they match current configuration
        const updatedUser = {
          ...parsedUser,
          permissions: getUserPermissions(parsedUser.role)
        };
        // Save updated user back to sessionStorage
        sessionStorage.setItem('iaoms-user', JSON.stringify(updatedUser));
        return updatedUser;
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        sessionStorage.removeItem('iaoms-user');
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;

  async function login(role: string): Promise<void> {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const roleTypeMap: Record<string, string> = {
        'principal': 'Principal',
        'registrar': 'Registrar',
        'hod': 'HOD',
        'program-head': 'Program Head',
        'employee': 'EMPLOYEE'
      };

      const roleType = roleTypeMap[role] || 'EMPLOYEE';

      const recipient = MOCK_RECIPIENTS.find(r =>
        r.role === roleType ||
        (roleType === 'EMPLOYEE' && r.role === 'EMPLOYEE')
      );

      if (!recipient) {
        throw new Error(`No user found with role: ${role}`);
      }

      const authenticatedUser: User = {
        id: recipient.user_id,
        name: recipient.name,
        email: recipient.email,
        role: role as User['role'],
        department: recipient.department,
        branch: recipient.branch,
        avatar: recipient.avatar,
        permissions: getUserPermissions(role)
      };

      console.log('✅ [AuthContext] User authenticated (Mock):', {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        role: authenticatedUser.role
      });

      setUser(authenticatedUser);

      // Store in sessionStorage for persistence during browser session only
      sessionStorage.setItem('iaoms-user', JSON.stringify(authenticatedUser));

      // Check if this is the first login for tutorial
      const hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore');
      if (!hasLoggedInBefore) {
        localStorage.setItem('isFirstLogin', 'true');
        localStorage.setItem('hasLoggedInBefore', 'true');
      }

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function logout(): void {
    setUser(null);
    setIsLoading(false);
    sessionStorage.clear();
  }

  useEffect(() => {
    localStorage.removeItem('iaoms-user');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};