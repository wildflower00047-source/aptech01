import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('authsec-theme') || 'dark';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    sidebarOpen: false,
  },
  reducers: {
    initTheme: (state) => {
      applyTheme(state.theme);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('authsec-theme', state.theme);
      applyTheme(state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('authsec-theme', action.payload);
      applyTheme(state.theme);
    },
    toggleSidebar: (state, action) => {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
  },
});

export const { initTheme, toggleTheme, setTheme, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
