import { useAuth } from '../contexts/AuthContext';
import './AuthHome.css';

const AuthHome = () => {
  const { user, isClient, isFreelancer, isAdmin } = useAuth();

  return (
    <div className="auth-home">
      <section className="auth-home-hero">
        <div className="auth-home-eyebrow">
          <span className="line"></span>
          <span className="text">DASHBOARD</span>
          <span className="line"></span>
        </div>

        <h1>WELCOME, {user?.name?.toUpperCase()}</h1>
        <p className="auth-home-sub">
          {isClient && 'Manage your projects and hire top freelancers.'}
          {isFreelancer && 'Find new projects and grow your freelance career.'}
          {isAdmin && 'Oversee the marketplace and keep it healthy.'}
        </p>
      </section>

      <div className="auth-home-cards">
        {isClient && (
          <>
            <div className="dash-card"><h3>My Projects</h3><p>View and manage your posted projects</p></div>
            <div className="dash-card"><h3>Post a Project</h3><p>Describe your needs and hire talent</p></div>
            <div className="dash-card"><h3>Proposals</h3><p>Review freelancer applications</p></div>
            <div className="dash-card"><h3>Messages</h3><p>Chat with freelancers</p></div>
          </>
        )}

        {isFreelancer && (
          <>
            <div className="dash-card"><h3>Browse Projects</h3><p>Find work that matches your skills</p></div>
            <div className="dash-card"><h3>My Proposals</h3><p>Track your submitted applications</p></div>
            <div className="dash-card"><h3>Active Contracts</h3><p>See your ongoing work</p></div>
            <div className="dash-card"><h3>Messages</h3><p>Chat with clients</p></div>
          </>
        )}

        {isAdmin && (
          <>
            <div className="dash-card"><h3>Manage Users</h3><p>View and moderate accounts</p></div>
            <div className="dash-card"><h3>All Projects</h3><p>Review marketplace activity</p></div>
            <div className="dash-card"><h3>Reports</h3><p>Handle flagged content</p></div>
            <div className="dash-card"><h3>Support Tickets</h3><p>Resolve user issues</p></div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthHome;