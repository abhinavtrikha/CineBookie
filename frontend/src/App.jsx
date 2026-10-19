import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ShowsPage from './pages/ShowsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BookingReviewPage from './pages/BookingReviewPage';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import BookingDetailPage from './pages/BookingDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminShows from './pages/admin/AdminShows';
import AdminBookings from './pages/admin/AdminBookings';
import AdminScreens from './pages/admin/AdminScreens';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'customer') return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
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
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
