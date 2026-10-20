import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../features/auth/authSlice.js';
import { setAccessToken } from '../../api/axios.js';

// Listens for global auth:logout events dispatched by the axios interceptor
// (e.g. when a refresh token is invalid) and clears client auth state.
export const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onLogout = () => {
      setAccessToken(null);
      dispatch(clearAuth());
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [dispatch]);

  return children;
};

export default AuthBootstrap;
