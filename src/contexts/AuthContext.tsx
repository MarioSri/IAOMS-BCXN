import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { roleScopedStorage, STORAGE_KEYS } from '@/utils/RoleScopedStorage';
import { isAllowedMockData } from '@/utils/roleUtils';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'principal' | 'demo-work' | 'registrar' | 'hod' | 'program-head' | 'employee';
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
  'demo-work': {
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

/**
 * MOCK_RECIPIENTS: ONLY for 'demo-work' role.
 * Real roles (Principal, Registrar, HOD, Program Head, Employee) MUST NOT appear here.
 * Their names, profiles, and recipient lists are fetched exclusively from Supabase
 * via UserProfileService and RecipientService (role_recipients table).
 */
export const MOCK_RECIPIENTS = [
  {
    user_id: 'demo-work-001',
    name: 'Demo Work Role',
    email: 'demo.work@university.edu',
    role: 'Demo Work Role',
    department: 'Administration',
    branch: 'Main',
    avatar: ''
  },
  // Additional mock recipients strictly for Demo Work demo data only
  { user_id: 'demo-u1', name: 'Dr. John Doe', email: 'john.doe@demo.university.edu', role: 'Principal', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'demo-u2', name: 'Dr. Jane Smith', email: 'jane.smith@demo.university.edu', role: 'Registrar', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'demo-u3', name: 'Dr. Maria Garcia', email: 'maria.garcia@demo.university.edu', role: 'HOD', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'demo-u4', name: 'Prof. Robert Brown', email: 'robert.brown@demo.university.edu', role: 'Program Department Head', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'demo-u5', name: 'Alice Wilson', email: 'alice.wilson@demo.university.edu', role: 'Employee', department: 'Computer Science', branch: 'Main', avatar: '' },
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

      const isDemoWork = isAllowedMockData(role);
      let authenticatedUser: User;

      if (isDemoWork) {
        // Demo Work: load identity from MOCK_RECIPIENTS
        const recipient = MOCK_RECIPIENTS.find(r => r.role === 'Demo Work Role');

        if (!recipient) {
          throw new Error('Demo Work recipient not found in mock data');
        }

        authenticatedUser = {
          id: recipient.user_id,
          name: recipient.name,
          email: recipient.email,
          role: role as User['role'],
          department: recipient.department,
          branch: recipient.branch,
          avatar: recipient.avatar,
          permissions: getUserPermissions(role)
        };

        console.log('✅ [AuthContext] Demo Work user authenticated (Mock):', {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          role: authenticatedUser.role,
        });
      } else {
        // Real Roles (Principal, Registrar, HOD, Program Head, Employee):
        // Create a minimal placeholder identity. The actual name and profile
        // are fetched in real-time from Supabase (role_recipients table) by:
        //   - RoleDashboard.tsx via UserProfileService.fetchProfileByEmail
        //   - Profile.tsx via UserProfileService.fetchProfileByEmail
        //   - RecipientSelector.tsx via RecipientService.fetchRecipients
        //
        // NO mock names are used here.
        const roleDisplayMap: Record<string, string> = {
          'principal': 'Principal',
          'registrar': 'Registrar',
          'hod': 'HOD',
          'program-head': 'Program Department Head',
          'employee': 'Employee'
        };

        const sessionId = `${role}-${Date.now()}`;

        authenticatedUser = {
          id: sessionId,
          name: '', // Will be populated from Supabase in profile/dashboard components
          email: '',  // Will be populated from Supabase via Google OAuth email
          role: role as User['role'],
          department: '',
          branch: '',
          avatar: '',
          permissions: getUserPermissions(role)
        };

        console.log(`✅ [AuthContext] Real role "${roleDisplayMap[role] || role}" authenticated — profile will load from Supabase`);
      }

      // Phase 5: Role-scoped storage cleanup
      if (!isDemoWork) {
        // Real role: Clear any old unscoped keys (migration)
        const oldKeys = Object.values(STORAGE_KEYS);
        if (roleScopedStorage.hasOldUnscopedKeys(oldKeys)) {
          console.log('🔄 [AuthContext] Migrating old unscoped keys to real: scope');
          roleScopedStorage.migrateOldKeys(role, oldKeys);
        }

        // Clear demo-work storage to prevent contamination
        roleScopedStorage.clearRoleStorage('demo-work');
        console.log('🧹 [AuthContext] Cleared demo-work storage for real role');
      } else {
        // Demo Work role: Keep demo storage, don't touch real storage
        console.log('ℹ️ [AuthContext] Demo Work role - using demo-work: scoped storage');
      }

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
    // Phase 5: Clear role-scoped storage on logout
    if (user) {
      roleScopedStorage.clearRoleStorage(user.role);
      console.log(`🧹 [AuthContext] Cleared ${user.role} storage on logout`);
    }

    setUser(null);
    setIsLoading(false);
    sessionStorage.clear();
    console.log('🧹 [AuthContext] Cleaned up on logout');
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