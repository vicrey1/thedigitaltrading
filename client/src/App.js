import GroupChat from './pages/GroupChat';
import NotificationProvider from './contexts/NotificationProvider';
import AboutPage from './pages/AboutPage';
import LegalDisclaimerPage from './pages/LegalDisclaimerPage';
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RefreshProvider } from './contexts/RefreshContext';
import { UserProvider } from './contexts/UserContext';
import { AdminAuthProvider } from './auth/AdminAuthProvider';
import { UserDataRefreshProvider } from './contexts/UserDataRefreshContext';
import Sidebar from './components/Sidebar';
import './App.css';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminUsers from './pages/admin/Users';
import AdminFunds from './pages/admin/Funds';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminSettings from './pages/admin/Settings';
import AdminLogin from './pages/admin/Login';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminSendEmail from './pages/admin/AdminSendEmail';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminPlans from './pages/AdminPlans';
import UserInvestmentsAdmin from './pages/admin/UserInvestmentsAdmin';
import AdminIndex from './pages/admin';
import SupportAdmin from './pages/SupportAdmin';
import AdminMirror from './pages/admin/AdminMirror';
import RoiApprovals from './pages/admin/RoiApprovals';
import AdminColdWallet from './pages/admin/AdminColdWallet';

// Client imports
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import InvestmentDetail from './pages/InvestmentDetail';
import Register from './pages/Register';
import Announcements from './pages/Announcements';
import EducationCenter from './components/EducationCenter';
// import MobileAppPreview from './components/MobileAppPreview';
// import Leaderboard from './components/Leaderboard';
import LandingPage from './pages/LandingPage';
import FundDetailPage from './pages/FundDetailPage';
import BlogDetailPage from './pages/BlogDetailPage';
import EventDetailPage from './pages/EventDetailPage';
import UserLogin from './pages/UserLogin';
import FundPerformance from './pages/FundPerformance';
import MyGoals from './pages/MyGoals';
import Settings from './pages/Settings';
import DashboardLayout from './components/DashboardLayout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import KYCPage from './pages/KYCPage';
import FundProspectus from './pages/FundProspectus';
import Statements from './pages/Statements';
import SupportChat from './pages/SupportChat';
import VerifyEmail from './pages/VerifyEmail';
import InviteFriends from './pages/InviteFriends';
import VerifySuccess from './pages/VerifySuccess';
import VerifyFailed from './pages/VerifyFailed';

function AppLayout({ sidebarCollapsed, setSidebarCollapsed, hasNewAnnouncement, children }) {
  console.log('AppLayout rendered');
  const location = useLocation();
  const hideSidebarRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/dashboard', '/verify-email'];
  // Hide sidebar for /dashboard and its subroutes
  const hideSidebar = hideSidebarRoutes.some((route) => location.pathname.startsWith(route));
  return (
    <div className="flex min-h-screen">
      {!hideSidebar && (
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} hasNewAnnouncement={hasNewAnnouncement} />
      )}
      <div className="flex-1 transition-all duration-300">{children}</div>
    </div>
  );
}

function App() {
  console.log('App rendered');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState(false);

  return (
    <BrowserRouter>
      <NotificationProvider>
        <UserDataRefreshProvider>
          <AdminAuthProvider>
            <UserProvider>
              <RefreshProvider>
                <AppLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} hasNewAnnouncement={hasNewAnnouncement}>
                  <Routes>
                    {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminIndex />} />
                    <Route path="plans" element={<AdminPlans />} />
                    <Route path="user-investments" element={<UserInvestmentsAdmin />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="funds" element={<AdminFunds />} />
                    <Route path="withdrawals" element={<AdminWithdrawals />} />
                    <Route path="deposits" element={<AdminDeposits />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="send-email" element={<AdminSendEmail />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                    <Route path="support" element={<SupportAdmin />} />
                    <Route path="mirror" element={<AdminMirror />} />
                    <Route path="roi-approvals" element={<RoiApprovals />} />
                    {/* <Route path="market-updates" element={<AdminMarketUpdates />} /> */}
                    <Route path="cold-wallet" element={<AdminColdWallet />} />
                  </Route>

                  {/* Client Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/legal" element={<LegalDisclaimerPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/group-chat" element={<GroupChat />} />
                  <Route path="/dashboard" element={<DashboardLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}>
                    <Route index element={<Dashboard />} />
                    <Route path="portfolio" element={<Portfolio />} />
                    <Route path="deposit" element={<Deposit />} />
                    <Route path="withdraw" element={<Withdraw />} />
                    <Route path="investment/:id" element={<InvestmentDetail />} />
                    <Route path="kyc" element={<KYCPage />} />
                    <Route path="announcements" element={<Announcements onNewAnnouncement={setHasNewAnnouncement} />} />
                    <Route path="education" element={<EducationCenter />} />
                    <Route path="performance" element={<FundPerformance />} />
                    <Route path="goals" element={<MyGoals />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="fund-prospectus" element={<FundProspectus />} />
                    <Route path="statements" element={<Statements />} />
                    <Route path="support" element={<SupportChat />} />
                    <Route path="invite-friends" element={<InviteFriends />} />
                  </Route>
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<UserLogin />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  <Route path="/verify-success" element={<VerifySuccess />} />
                  <Route path="/verify-failed" element={<VerifyFailed />} />
                  {/* Dynamic Fund, Blog, Event Detail Routes */}
                  <Route path="/funds/:slug" element={<FundDetailPage />} />
                  <Route path="/blog/:slug" element={<BlogDetailPage />} />
                  <Route path="/events/:slug" element={<EventDetailPage />} />
                </Routes>
                </AppLayout>
              </RefreshProvider>
            </UserProvider>
          </AdminAuthProvider>
        </UserDataRefreshProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;