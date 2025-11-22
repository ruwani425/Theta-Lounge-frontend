// src/redux/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; // FIX: Type-only import
// Assume cookieUtils is available or mock its methods
import { AUTH_ROLE_KEY, AUTH_TOKEN_KEY, getCookie, removeCookie, setCookie, TOKEN_LIFESPAN_DAYS } from '../utils/cookieUtils';

// --- Types ---
interface AuthState {
    isAuthenticated: boolean;
    userRole: 'admin' | 'client' | null;
    isLoading: boolean;
}

// --- Initial State ---
const initialState: AuthState = {
    isAuthenticated: false,
    userRole: null, 
    isLoading: true,
};

// --- Async Thunk: Check Auth Status on Load ---

export const checkAuthStatus = createAsyncThunk(
    'auth/checkAuthStatus',
    async (_, { dispatch }) => {
        const token = getCookie(AUTH_TOKEN_KEY);
        
        if (token) {
            // 1. Get the role from the cookie (returns string | null)
            const role = getCookie(AUTH_ROLE_KEY); 
            
            // 2. Define the initial simulated role based on token content (if role cookie is missing)
            let determinedRole: 'admin' | 'client' | null = null;
            
            if (role === 'admin' || role === 'client') {
                // If the cookie role is valid, use it
                determinedRole = role;
            } else {
                // Otherwise, simulate the role from the token content
                determinedRole = token.includes('admin') ? 'admin' : 'client'; 
            }
            
            dispatch(authSlice.actions.setAuth({ 
                isAuthenticated: true, 
                userRole: determinedRole // determinedRole is now guaranteed to be 'admin' | 'client' | null
            }));
        } else {
            dispatch(authSlice.actions.setAuth({ 
                isAuthenticated: false, 
                userRole: null 
            }));
        }
    }
);

// --- Auth Slice ---
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action: PayloadAction<{ isAuthenticated: boolean; userRole: AuthState['userRole'] }>) => {
            state.isAuthenticated = action.payload.isAuthenticated;
            state.userRole = action.payload.userRole;
            state.isLoading = false;
        },
        loginAction: (state, action: PayloadAction<{ token?: string; role: 'admin' | 'client' }>) => { // 💡 FIX: Narrowed role type for loginAction payload
            // 1. Update cookies/storage
            const token = action.payload.token || `simulated_jwt_token_${action.payload.role}`;
            setCookie(AUTH_TOKEN_KEY, token, TOKEN_LIFESPAN_DAYS);
            // 💡 FIX: action.payload.role is now guaranteed to be a string ('admin' | 'client')
            setCookie(AUTH_ROLE_KEY, action.payload.role, TOKEN_LIFESPAN_DAYS); 

            // 2. Update Redux state
            state.isAuthenticated = true;
            state.userRole = action.payload.role;
            state.isLoading = false;
        },
        logoutAction: (state) => {
            // 1. Clear cookies/storage
            removeCookie(AUTH_TOKEN_KEY);
            removeCookie(AUTH_ROLE_KEY); 
            
            // 2. Update Redux state
            state.isAuthenticated = false;
            state.userRole = null;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state) => {
                // Logic handled by setAuth in the thunk
            })
            .addCase(checkAuthStatus.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.userRole = null;
            });
    }
});

export const { loginAction, logoutAction } = authSlice.actions;
export default authSlice.reducer;