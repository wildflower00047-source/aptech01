import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { initTheme, toggleTheme, setTheme } from '../features/ui/uiSlice.js';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    dispatch(initTheme());
  }, [dispatch]);

  return {
    theme,
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (value) => dispatch(setTheme(value)),
    isDark: theme === 'dark',
  };
};

export default useTheme;
