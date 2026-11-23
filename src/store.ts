import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uninterruptiblePowerSuppliesReducer from './slices/upsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    uninterruptible_power_supplies: uninterruptiblePowerSuppliesReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
