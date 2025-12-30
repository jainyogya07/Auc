import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useAuctionStore } from './store/useAuctionStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeams from './pages/admin/AdminTeams';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminAuctionControl from './pages/admin/AdminAuctionControl';
import AdminSettings from './pages/admin/AdminSettings';
import TeamDashboard from './pages/team/TeamDashboard';
import TeamAuctionArena from './pages/team/TeamAuctionArena';
import TeamBidHistory from './pages/team/TeamBidHistory';
import TeamSquad from './pages/team/TeamSquad';
import AuctioneerDashboard from './pages/auctioneer/AuctioneerDashboard';
import AuctioneerTeams from './pages/auctioneer/AuctioneerTeams';
import TeamLogin from './pages/team/TeamLogin';
import AdminLogin from './pages/AdminLogin';
import AuctioneerLogin from './pages/auctioneer/AuctioneerLogin';
import ProjectorView from './pages/ProjectorView';
import LandingPage from './pages/LandingPage';

import AdminSetManagement from './pages/admin/AdminSetManagement';
import AuctioneerUpcoming from './pages/auctioneer/AuctioneerUpcoming';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useAuctionStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, connectSocket, disconnectSocket]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Login Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/auctioneer/login" element={<AuctioneerLogin />} />
        <Route path="/team/login" element={<TeamLogin />} />

        {/* Projector View (Public) */}
        <Route path="/projector" element={<ProjectorView />} />


        {/* Protected Admin Routes */}
        <Route path="/admin" element={isAuthenticated ? <DashboardLayout role="admin" /> : <Navigate to="/admin/login" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="control" element={<AdminAuctionControl />} />
          <Route path="sets" element={<AdminSetManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Protected Team Routes */}
        <Route path="/team" element={isAuthenticated ? <DashboardLayout role="team" /> : <Navigate to="/team/login" />}>
          <Route index element={<TeamDashboard />} />
          <Route path="arena" element={<TeamAuctionArena />} />
          <Route path="history" element={<TeamBidHistory />} />
          <Route path="squad" element={<TeamSquad />} />
        </Route>

        {/* Protected Auctioneer Routes */}
        <Route path="/auctioneer" element={isAuthenticated ? <DashboardLayout role="auctioneer" /> : <Navigate to="/auctioneer/login" />}>
          <Route index element={<AuctioneerDashboard />} />
          <Route path="upcoming" element={<AuctioneerUpcoming />} />
          <Route path="teams" element={<AuctioneerTeams />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
