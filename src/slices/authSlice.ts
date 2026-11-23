import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState { isAuthenticated: boolean; userID: number | null; token: string | null; isModerator:boolean; loading: boolean; error: string | null }
// По условию лабораторной Redux сбрасывается при F5. JWT остаётся в localStorage
// только для демонстрации в Application / Postman; Redux не восстанавливается из него.
const initialState: AuthState = { isAuthenticated: false, userID: null, token: null, isModerator:false, loading: false, error: null };
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    loginStarted(state) { state.loading = true; state.error = null; },
    loginSuccess(state, action: PayloadAction<{userID: number; token: string;isModerator:boolean}>) {
      state.isAuthenticated = true;
      state.userID = action.payload.userID;
      state.token = action.payload.token;
      state.isModerator=action.payload.isModerator;
      state.loading = false;
      state.error = null;
    },
    loginFailed(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.userID = null;
      state.token = null;
      state.isModerator=false;
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) { Object.assign(state, initialState); },
  },
});
export const { loginStarted, loginSuccess, loginFailed, logout } = authSlice.actions;
export default authSlice.reducer;
