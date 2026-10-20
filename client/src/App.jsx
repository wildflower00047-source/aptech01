import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGetMeQuery } from './api/apiSlice.js';
import { useAuth } from './hooks/useAuth.js';
import AuthBootstrap from './components/common/AuthBootstrap.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import AnimatedBackground from './components/layout/AnimatedBackground.jsx';
import ProtectedRoute, { PublicOnlyRoute, FullScreenLoader } from './components/common/ProtectedRoute.jsx';
import PageTransition from './components/common/PageTransition.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Security = lazy(() => import('./pages/Security.jsx'));
const AdminOverview = lazy(() => import('./pages/admin/Overview.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'));
const AdminAudit = lazy(() => import('./pages/admin/AuditLogs.jsx'));
const AdminThreats = lazy(() => import('./pages/admin/Threats.jsx'));
const AdminRbac = lazy(() => import('./pages/admin/Rbac.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));
const Unauthorized = lazy(() => import('./pages/Unauthorized.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const wrap = (node) => <PageTransition>{node}</PageTransition>;

const App = () => {
  const location = useLocation();
  const { bootstrapped } = useAuth();

  // Bootstraps the session from the httpOnly refresh cookie on first load.
  useGetMeQuery(undefined, { skip: false });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  if (!bootstrapped) return <FullScreenLoader />;

  return (
    <AuthBootstrap>
      <AnimatedBackground />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<FullScreenLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={wrap(<Landing />)} />

                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={wrap(<Login />)} />
                  <Route path="/register" element={wrap(<Register />)} />
                </Route>

                <Route path="/verify-email" element={wrap(<VerifyEmail />)} />
                <Route path="/forgot-password" element={wrap(<ForgotPassword />)} />
                <Route path="/reset-password" element={wrap(<ResetPassword />)} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={wrap(<Dashboard />)} />
                  <Route path="/profile" element={wrap(<Profile />)} />
                  <Route path="/security" element={wrap(<Security />)} />
                </Route>

                <Route element={<ProtectedRoute minRole="moderator" />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={wrap(<AdminOverview />)} />
                    <Route path="users" element={wrap(<AdminUsers />)} />
                    <Route path="threats" element={wrap(<AdminThreats />)} />
                    <Route path="audit" element={wrap(<AdminAudit />)} />
                    <Route path="rbac" element={wrap(<AdminRbac />)} />
                    <Route path="settings" element={wrap(<AdminSettings />)} />
                  </Route>
                </Route>

                <Route path="/unauthorized" element={wrap(<Unauthorized />)} />
                <Route path="*" element={wrap(<NotFound />)} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthBootstrap>
  );
};

export default App;
