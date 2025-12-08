// src/components/AuthProvider.tsx
import React, { useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import { store } from '../redux/store'; 
// FIX: Import AuthUser for correct type hinting
import { checkAuthStatus, loginAction, logoutAction } from '../redux/authSlice'; 
import type { AuthUser } from '../redux/authSlice'; // <-- FIX: Use 'import type' for AuthUser

interface AuthProviderProps {
    children: React.ReactNode;
}

// --- AuthInitializer Component ---

const AuthInitializer: React.FC<AuthProviderProps> = ({ children }) => {
// ... (AuthInitializer content remains the same)
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.auth); 

    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Loading authentication status...</p>
            </div>
        );
    }
    
    return <>{children}</>;
}


// --- AuthProvider Component ---

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <AuthInitializer>{children}</AuthInitializer>
        </Provider>
    );
};


// --- useAuth Hook ---

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const auth = useSelector((state: RootState) => state.auth);

    return {
        isAuthenticated: auth.isAuthenticated,
        userRole: auth.userRole,
        user: auth.user, // <-- FIX: Return the user object
        isLoading: auth.isLoading,
        // FIX: Update login signature to accept user data
        login: (role: 'admin' | 'client', token?: string, user?: AuthUser) => dispatch(loginAction({ role, token, user })),
        logout: () => dispatch(logoutAction()),
    };
};