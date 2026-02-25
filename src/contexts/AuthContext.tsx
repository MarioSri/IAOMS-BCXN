import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { roleScopedStorage, STORAGE_KEYS } from '@/utils/RoleScopedStorage';
import { isAllowedMockData } from '@/utils/roleUtils';
import { verifyGoogleUser, signOut, AuthResult } from '@/services/AuthService';
import { userProfileService } from '@/services/UserProfileService';

// ── JWT helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true when the persisted session token has definitely expired.
 * We add a 60-second safety buffer so we never serve a token that is
 * about to expire in the next request cycle.
 */
function isJwtExpired(expiresAt: number | undefined): boolean {
  if (!expiresAt) return false; // unknown expiry — let Supabase decide
  return Date.now() / 1000 > expiresAt - 60;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'principal' | 'demo-work' | 'registrar' | 'hod' | 'program-head' | 'employee';
  department?: string;
  branch?: string;
  avatar?: string;
  employee_id?: string;
  designation?: string;
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
  /** Legacy role-picker login — only for 'demo-work'. Real auth goes through AuthService. */
  login: (role: string) => Promise<void>;
  loginWithResult: (result: AuthResult, supabaseUserId?: string) => void;
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
 * Real roles must never appear here.
 */
export const MOCK_RECIPIENTS = [
  {
    user_id: 'demo-work-001',
    name: 'Demo Work Role',
    email: 'demo.work@university.edu',
    role: 'Demo Work Role',
    department: 'Administration',
    branch: 'Main',
    avatar: '',
  },
  { user_id: 'demo-u1', name: 'Dr. John Doe', email: 'john.doe@demo.university.edu', role: 'Principal', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'demo-u2', name: 'Dr. Jane Smith', email: 'jane.smith@demo.university.edu', role: 'Registrar', department: 'Administration', branch: 'Main', avatar: '' },
  { user_id: 'demo-u3', name: 'Dr. Maria Garcia', email: 'maria.garcia@demo.university.edu', role: 'HOD', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'demo-u4', name: 'Prof. Robert Brown', email: 'robert.brown@demo.university.edu', role: 'Program Department Head', department: 'Computer Science', branch: 'Main', avatar: '' },
  { user_id: 'demo-u5', name: 'Alice Wilson', email: 'alice.wilson@demo.university.edu', role: 'Employee', department: 'Computer Science', branch: 'Main', avatar: '' },
];

function buildUserFromResult(result: AuthResult, supabaseUserId?: string): User {
  const role = (result.role ?? 'employee') as User['role'];
  return {
    id: supabaseUserId ?? `${role}-${Date.now()}`,
    name: result.name ?? '',
    email: result.email ?? '',
    role,
    department: result.department ?? '',
    branch: result.branch ?? '',
    employee_id: result.employee_id ?? '',
    designation: result.designation ?? '',
    avatar: result.avatar ?? '',
    permissions: getUserPermissions(role),
  };
}

/** Persisted user shape — includes optional JWT expiry for stale-session detection. */
interface PersistedUser extends User {
  _jwtExpiresAt?: number; // Unix timestamp (seconds)
}

function persistUser(u: User, session?: Session): void {
  const payload: PersistedUser = {
    ...u,
    _jwtExpiresAt: session?.expires_at ?? undefined,
  };
  sessionStorage.setItem('iaoms-user', JSON.stringify(payload));
}

function clearPersistedUser(): void {
  sessionStorage.removeItem('iaoms-user');
}

function loadPersistedUser(): User | null {
  const saved = sessionStorage.getItem('iaoms-user');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as PersistedUser;

    // Reject persisted sessions whose JWT has already expired
    // (real roles only — demo-work has no JWT).
    if (!isAllowedMockData(parsed.role) && isJwtExpired(parsed._jwtExpiresAt)) {
      console.warn('[AuthContext] Persisted session JWT expired — clearing.');
      sessionStorage.removeItem('iaoms-user');
      return null;
    }

    const { _jwtExpiresAt: _, ...user } = parsed;
    return { ...user, permissions: getUserPermissions(user.role) };
  } catch {
    sessionStorage.removeItem('iaoms-user');
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadPersistedUser());
  // Only show loading when there is NO persisted user and we need to wait
  // for Supabase to resolve the session (e.g. fresh OAuth redirect).
  // If a persisted user exists we render immediately — Supabase validation
  // runs silently in the background without blocking the UI.
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const persisted = loadPersistedUser();
    // Persisted user exists (any role) → no loading needed
    if (persisted) return false;
    // No persisted user → show loading while we check for a Supabase session
    return true;
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    let mounted = true;

    // Whether a persisted user was available at mount time.
    // When true, ALL session checks run silently — isLoading is never set
    // to true, which prevents the HITAM tree animation from flashing.
    const hadPersistedUser = !!loadPersistedUser();

    // Safety net: if the Supabase session check takes too long and we had
    // no persisted user, stop blocking the UI after 5 seconds.
    const loadingTimeout = !hadPersistedUser
      ? setTimeout(() => {
        if (mounted) {
          console.warn('[AuthContext] Session check timed out — showing login page');
          setIsLoading(false);
        }
      }, 5000)
      : null;

    // ── getSession() — the single source of truth for initial load ──
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;

        if (session?.user) {
          // Silently refresh user data from Supabase (no loading state change)
          await handleSupabaseSession(session);
        } else {
          // No Supabase session found.
          const persisted = loadPersistedUser();
          if (persisted && isAllowedMockData(persisted.role)) {
            // Demo-work users don't need a Supabase session — keep them in.
            setUser(persisted);
          } else if (persisted) {
            // Real role user but Supabase session is gone (expired / logged out
            // elsewhere). Clear the stale persisted user and redirect to login.
            console.warn('[AuthContext] Supabase session expired — clearing persisted user');
            clearPersistedUser();
            setUser(null);
          }
          // If no persisted user and no session → user stays null → login page
        }
      })
      .catch((err) => {
        console.error('[AuthContext] getSession failed:', err);
        // On error, keep the persisted user so the app doesn't kick them out
        // due to a transient network glitch.
        const persisted = loadPersistedUser();
        if (persisted && mounted) {
          // Retain the currently persisted user — don't clear on error
          setUser(persisted);
          console.log('[AuthContext] Keeping persisted user despite getSession error');
        }
      })
      .finally(() => {
        if (mounted && !hadPersistedUser) {
          // Only flip isLoading for the case where there was no persisted user
          setIsLoading(false);
        }
      });

    // ── onAuthStateChange — handles live auth events ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'INITIAL_SESSION') {
          // Supabase v2 fires this on mount — getSession() is our single
          // source of truth, so skip to avoid duplicate DB calls.
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // On page refresh, SIGNED_IN may fire redundantly.  If we
          // already have a persisted user OR getSession() is handling
          // things, just skip.
          if (hadPersistedUser) {
            console.log('[AuthContext] SIGNED_IN skipped — persisted user present');
            return;
          }

          // Genuine new sign-in (e.g. returning from OAuth redirect with
          // no persisted user). Show loading only in this case.
          setIsLoading(true);
          await handleSupabaseSession(session);
          if (mounted) setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          clearPersistedUser();
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // JWT was silently refreshed by Supabase (every ~55 min).
          // Re-validate the user's profile in case their role changed,
          // and update the persisted expiry so the stale-session check
          // stays accurate across page reloads.
          console.log('[AuthContext] TOKEN_REFRESHED — re-validating profile');
          await handleSupabaseSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSupabaseSession(session: Session): Promise<void> {
    const email = session.user.email ?? '';
    const result = await verifyGoogleUser(email);

    if (!result.success) {
      console.error('[AuthContext] Supabase user not allowed:', result.error);
      await signOut();
      clearPersistedUser();
      setUser(null);
      return;
    }

    const authenticatedUser = buildUserFromResult(result, session.user.id);
    setUser(authenticatedUser);
    // Pass session so expiry metadata is stored alongside the user profile.
    persistUser(authenticatedUser, session);

    roleScopedStorage.clearRoleStorage('demo-work');

    console.log('[AuthContext] Supabase session authenticated:', {
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      email: authenticatedUser.email,
      expiresAt: session.expires_at,
    });
  }

  /**
   * loginWithResult — called by AuthenticationCard after a successful Employee ID login
   * or after manual Google result verification.
   */
  function loginWithResult(result: AuthResult, supabaseUserId?: string): void {
    if (!result.success) {
      console.error('[AuthContext] loginWithResult called with failed result');
      return;
    }
    // Prefer the UID embedded in the result (set by signInWithEmployeeId after
    // a successful Supabase Auth sign-in) over the optional override parameter.
    const uid = result.supabaseUserId ?? supabaseUserId;
    const authenticatedUser = buildUserFromResult(result, uid);
    setUser(authenticatedUser);
    // No Session object here — expiry will be populated when getSession()
    // fires in the background and calls handleSupabaseSession.
    persistUser(authenticatedUser);

    if (!isAllowedMockData(authenticatedUser.role)) {
      roleScopedStorage.clearRoleStorage('demo-work');
    }

    if (!localStorage.getItem('hasLoggedInBefore')) {
      localStorage.setItem('isFirstLogin', 'true');
      localStorage.setItem('hasLoggedInBefore', 'true');
    }

    // After Employee ID sign-in, Supabase has already created the session.
    // Fetch it once so we can persist the JWT expiry immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        persistUser(authenticatedUser, session);
        console.log('[AuthContext] JWT expiry persisted after Employee ID login:', session.expires_at);
      }
    }).catch(() => { /* non-critical */ });

    console.log(`[AuthContext] loginWithResult: ${authenticatedUser.name} (${authenticatedUser.role}) uid=${uid}`);
  }

  /**
   * Legacy login — ONLY used for the 'demo-work' role selector.
   * All real roles MUST use Google OAuth or Employee ID login.
   */
  async function login(role: string): Promise<void> {
    if (!isAllowedMockData(role)) {
      throw new Error(
        `Use Google OAuth or Employee ID login for real roles. Role "${role}" cannot use mock login.`
      );
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const recipient = MOCK_RECIPIENTS.find(r => r.role === 'Demo Work Role');
      if (!recipient) throw new Error('Demo Work recipient not found in mock data');

      const authenticatedUser: User = {
        id: recipient.user_id,
        name: recipient.name,
        email: recipient.email,
        role: 'demo-work',
        department: recipient.department,
        branch: recipient.branch,
        avatar: recipient.avatar,
        permissions: getUserPermissions('demo-work'),
      };

      setUser(authenticatedUser);
      persistUser(authenticatedUser);

      console.log('[AuthContext] Demo Work user authenticated (Mock)');

      if (!localStorage.getItem('hasLoggedInBefore')) {
        localStorage.setItem('isFirstLogin', 'true');
        localStorage.setItem('hasLoggedInBefore', 'true');
      }
    } catch (error) {
      console.error('Demo Work login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function logout(): void {
    if (user) {
      roleScopedStorage.clearRoleStorage(user.role);
    }

    // Clear the profile cache so a subsequent login doesn't see
    // the previous user's data before the new fetch resolves.
    userProfileService.clearCache();

    signOut().catch(err => console.error('Supabase signOut error:', err));

    setUser(null);
    setIsLoading(false);
    clearPersistedUser();
    sessionStorage.clear();
  }

  // Remove legacy non-scoped localStorage key on mount
  useEffect(() => {
    localStorage.removeItem('iaoms-user');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      loginWithResult,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};