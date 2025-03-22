import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks";
import { WatchHistoryProvider } from "@/contexts/watch-history";
import { UserPreferencesProvider } from "@/contexts/user-preferences";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Trending from "./pages/Trending";
import MovieDetails from "./pages/MovieDetails";
import TVDetails from "./pages/TVDetails";
import Player from "./pages/Player";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import WatchHistory from "./pages/WatchHistory";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

// AnimatedRoutes component to handle route transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movie" element={<Movies />} />
        <Route path="/tv" element={<TVShows />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/tv/:id" element={<TVDetails />} />
        <Route path="/player/movie/:id" element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } />
        <Route path="/player/tv/:id/:season/:episode" element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/watch-history" element={
          <ProtectedRoute>
            <WatchHistory />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <WatchHistoryProvider>
            <Toaster />
            <Sonner />
            <Router>
              <AnimatedRoutes />
            </Router>
          </WatchHistoryProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
