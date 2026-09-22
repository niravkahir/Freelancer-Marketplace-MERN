import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import EditProject from './pages/projects/EditProject';
import MyProjects from './pages/projects/MyProjects';
import Home from './pages/common/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import Projects from './pages/projects/Projects';
import CreateProject from './pages/projects/CreateProject';
import ProjectDetail from './pages/projects/ProjectDetail';
import MyProposals from './pages/proposals/MyProposals';
import ProjectProposals from './pages/proposals/ProjectProposals';

import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute><EditProfile /></ProtectedRoute>
          } />
          <Route path="/projects/create" element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <CreateProject />
            </ProtectedRoute>
          } />
          <Route path="/projects/my" element={
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <MyProjects />
    </ProtectedRoute>
  }
/>

          <Route
          path="/projects/:id/edit" element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <EditProject />
            </ProtectedRoute>
          } />
         <Route path="/proposals/my" element={
    <ProtectedRoute allowedRoles={['FREELANCER']}>
      <MyProposals />
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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;