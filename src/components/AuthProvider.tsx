// src/components/AuthProvider.tsx
import React, { useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
// 1. FIX: Use type-only imports for types (AppDispatch, RootState)
import type { AppDispatch, RootState } from '../redux/store';
import { store } from '../redux/store'; 
// 2. FIX: Import action creators from the slice
import { checkAuthStatus, loginAction, logoutAction } from '../redux/authSlice';


// Re-defining AuthProviderProps using React's standard types
interface AuthProviderProps {
    children: React.ReactNode;
}

// --- AuthInitializer Component ---

// 💡 Inner component to handle initial loading and dispatch
const AuthInitializer: React.FC<AuthProviderProps> = ({ children }) => {
    // You need to be inside a Provider to use hooks, so we wrap this component in the main Provider.
    const dispatch = useDispatch<AppDispatch>();
    // useSelector correctly uses RootState (which is correctly imported as a type)
    const { isLoading } = useSelector((state: RootState) => state.auth); 

    // Initial check on mount
    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);

    // This replaces your original loading screen logic
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Loading authentication status...</p>
            </div>
        );
    }
    
    // Once loading is complete, render children
    return <>{children}</>;
}


// --- AuthProvider Component ---

// 💡 Outer component is the definitive Redux Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <AuthInitializer>{children}</AuthInitializer>
        </Provider>
    );
};


// --- useAuth Hook ---

// 💡 useAuth hook (Replaces your original hook, now based on Redux)
export const useAuth = () => {
    // useDispatch and useSelector are correctly typed using AppDispatch/RootState
    const dispatch = useDispatch<AppDispatch>();
    const auth = useSelector((state: RootState) => state.auth);

    return {
        isAuthenticated: auth.isAuthenticated,
        userRole: auth.userRole,
        isLoading: auth.isLoading,
        // FIX: loginAction and logoutAction are now correctly imported and used
        login: (role: 'admin' | 'client', token?: string) => dispatch(loginAction({ role, token })),
        logout: () => dispatch(logoutAction()),
    };
};