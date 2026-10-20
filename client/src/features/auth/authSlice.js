import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/apiSlice.js';

const initialState = {
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  twoFactorRequired: false,
  pendingEmail: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    setTwoFactorRequired: (state, action) => {
      state.twoFactorRequired = Boolean(action.payload);
    },
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.status = 'unauthenticated';
      state.twoFactorRequired = false;
    },
    setBootstrapped: (state, action) => {
      state.bootstrapped = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.getMe.matchPending, (state) => {
        state.status = 'loading';
      })
      .addMatcher(api.endpoints.getMe.matchFulfilled, (state, { payload }) => {
        state.user = payload.data.user;
        state.status = 'authenticated';
        state.bootstrapped = true;
      })
      .addMatcher(api.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        state.bootstrapped = true;
      })
      .addMatcher(api.endpoints.login.matchFulfilled, (state, { payload }) => {
        if (payload.twoFactorRequired) {
          state.twoFactorRequired = true;
          return;
        }
        state.user = payload.data.user;
        state.status = 'authenticated';
        state.twoFactorRequired = false;
        state.bootstrapped = true;
      })
      .addMatcher(api.endpoints.passkeyLoginVerify.matchFulfilled, (state, { payload }) => {
        state.user = payload.data.user;
        state.status = 'authenticated';
        state.twoFactorRequired = false;
        state.bootstrapped = true;
      })
      .addMatcher(api.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
        state.twoFactorRequired = false;
      })
      .addMatcher(api.endpoints.updateProfile.matchFulfilled, (state, { payload }) => {
        state.user = payload.data.user;
      });
  },
});

export const { setUser, setTwoFactorRequired, setPendingEmail, clearAuth, setBootstrapped } = authSlice.actions;
export default authSlice.reducer;
