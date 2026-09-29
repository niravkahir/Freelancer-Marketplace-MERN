import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/common/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import UserProfile from './pages/profile/UserProfile';

import Projects from './pages/projects/Projects';
import CreateProject from './pages/projects/CreateProject';
import ProjectDetail from './pages/projects/ProjectDetail';
import EditProject from './pages/projects/EditProject';
import MyProjects from './pages/projects/MyProjects';

import MyProposals from './pages/proposals/MyProposals';
import ProjectProposals from './pages/proposals/ProjectProposals';

import Inbox from './pages/messages/Inbox';
import Chat from './pages/messages/Chat';

import Notifications from './pages/notifications/Notifications';

import Contracts from './pages/contracts/Contracts';
import ContractDetail from './pages/contracts/ContractDetail';
import CreateContract from './pages/contracts/CreateContract';

import Payments from './pages/payments/Payments';
import PaymentDetail from './pages/payments/PaymentDetail';

import Support from './pages/support/Support';
import TicketDetail from './pages/Support/TicketDetail';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageProjects from './pages/admin/ManageProjects';
import ManageTickets from './pages/admin/ManageTickets';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';

import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* ---------- Public ---------- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---------- Projects ---------- */}
          <Route path="/projects" element={<Projects />} />

          <Route
            path="/projects/my"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <MyProjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/create"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <CreateProject />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:projectId/proposals"
            element={
              <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
                <ProjectProposals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <EditProject />
              </ProtectedRoute>
            }
          />

          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* ---------- User ---------- */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path="/profile/edit"
            element={<ProtectedRoute><EditProfile /></ProtectedRoute>}
          />

          {/* Public user profile */}
          <Route path="/users/:id" element={<UserProfile />} />

          {/* ---------- Proposals ---------- */}
          <Route
            path="/proposals/my"
            element={
              <ProtectedRoute allowedRoles={['FREELANCER']}>
                <MyProposals />
              </ProtectedRoute>
            }
          />

          {/* ---------- Messages ---------- */}
          <Route
            path="/messages"
            element={<ProtectedRoute><Inbox /></ProtectedRoute>}
          />
          <Route
            path="/messages/:id"
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />

          {/* ---------- Notifications ---------- */}
          <Route
            path="/notifications"
            element={<ProtectedRoute><Notifications /></ProtectedRoute>}
          />

          {/* ---------- Contracts ---------- */}
          <Route
            path="/contracts"
            element={<ProtectedRoute><Contracts /></ProtectedRoute>}
          />
          <Route
            path="/contracts/create/:proposalId"
            element={
              <ProtectedRoute allowedRoles={['CLIENT']}>
                <CreateContract />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={<ProtectedRoute><ContractDetail /></ProtectedRoute>}
          />

          {/* ---------- Payments ---------- */}
          <Route
            path="/payments"
            element={<ProtectedRoute><Payments /></ProtectedRoute>}
          />
          <Route
            path="/payments/:id"
            element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>}
          />

          {/* ---------- Support Tickets ---------- */}
          <Route
            path="/support"
            element={<ProtectedRoute><Support /></ProtectedRoute>}
          />
          <Route
            path="/support/:id"
            element={<ProtectedRoute><TicketDetail /></ProtectedRoute>}
          />

            {/* ---------- Admin ---------- */}
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/users"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageUsers /></ProtectedRoute>}
          />
          <Route
            path="/admin/projects"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageProjects /></ProtectedRoute>}
          />
          <Route
            path="/admin/support"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageTickets /></ProtectedRoute>}
          />
          <Route
            path="/admin/support/:id"
            element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminTicketDetail /></ProtectedRoute>}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;