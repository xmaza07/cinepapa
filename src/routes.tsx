import { Routes, Route, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const Movies = lazy(() => import('./pages/Movies'));
const TVShows = lazy(() => import('./pages/TVShows'));
const Sports = lazy(() => import('./pages/Sports'));
const Search = lazy(() => import('./pages/Search'));
const WatchHistory = lazy(() => import('./pages/WatchHistory'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const TVDetails = lazy(() => import('./pages/TVDetails'));
const SportMatch = lazy(() => import('./pages/SportMatch'));
const Player = lazy(() => import('./pages/Player'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Trending = lazy(() => import('./pages/Trending'));

// Legal pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ContentRemoval = lazy(() => import('./pages/ContentRemoval'));
const DMCANotice = lazy(() => import('./pages/DMCANotice'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/watch-history" element={<WatchHistory />} />
        </Route>

        {/* Content routes */}
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/tv" element={<TVShows />} />
        <Route path="/tv/:id" element={<TVDetails />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/sports/:id" element={<SportMatch />} />
        <Route path="/watch/:type/:id" element={<Player />} />
        <Route path="/search" element={<Search />} />
        <Route path="/trending" element={<Trending />} />

        {/* Legal routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/content-removal" element={<ContentRemoval />} />
        <Route path="/dmca" element={<DMCANotice />} />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}