import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const MoviesPage = lazy(() => import('./pages/MoviesPage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const ShowsPage = lazy(() => import('./pages/ShowsPage'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));
const BookingReviewPage = lazy(() => import('./pages/BookingReviewPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const BookingHistoryPage = lazy(() => import('./pages/BookingHistoryPage'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMovies = lazy(() => import('./pages/admin/AdminMovies'));
const AdminTheatres = lazy(() => import('./pages/admin/AdminTheatres'));
const AdminShows = lazy(() => import('./pages/admin/AdminShows'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminScreens = lazy(() => import('./pages/admin/AdminScreens'));

// Automatically scroll window to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p>Checking authentication...</p></div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.role !== 'customer') {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <main>
          <Suspense
            fallback={
              <div className="loading-container" role="status" aria-live="polite">
                <div className="spinner" />
                <p>Loading page...</p>
              </div>
            }
          >
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/movies/:id" element={<MovieDetailPage />} />
              <Route path="/movies/:id/shows" element={<ShowsPage />} />

              {/* Customer routes */}
              <Route path="/shows/:showId/seats" element={
                <CustomerRoute><SeatSelectionPage /></CustomerRoute>
              } />
              <Route path="/bookings/:bookingId/review" element={
                <CustomerRoute><BookingReviewPage /></CustomerRoute>
              } />
              <Route path="/bookings/:bookingId/pay" element={
                <CustomerRoute><PaymentPage /></CustomerRoute>
              } />
              <Route path="/bookings/:bookingId/confirmation" element={
                <ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <CustomerRoute><BookingHistoryPage /></CustomerRoute>
              } />
              <Route path="/bookings/:id" element={
                <ProtectedRoute><BookingDetailPage /></ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/movies" element={
                <ProtectedRoute adminOnly><AdminMovies /></ProtectedRoute>
              } />
              <Route path="/admin/theatres" element={
                <ProtectedRoute adminOnly><AdminTheatres /></ProtectedRoute>
              } />
              <Route path="/admin/screens" element={
                <ProtectedRoute adminOnly><AdminScreens /></ProtectedRoute>
              } />
              <Route path="/admin/shows" element={
                <ProtectedRoute adminOnly><AdminShows /></ProtectedRoute>
              } />
              <Route path="/admin/bookings" element={
                <ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
