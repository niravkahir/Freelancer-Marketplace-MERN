import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isClient, isFreelancer, isAdmin } = useAuth();
  const navigate = useNavigate();

  const clientCards = [
    { title: 'My Projects', desc: 'View and manage your posted projects', btn: 'View Projects', path: '/projects/my' },
    { title: 'Post a Project', desc: 'Describe your needs and hire talent', btn: 'Post Now', path: '/projects/create' },
    { title: 'Proposals', desc: 'Review freelancer applications', btn: 'Review', path: '/projects/my' },
    { title: 'Messages', desc: 'Chat with freelancers', btn: 'Open Inbox', path: '/messages' },
  ];

  const freelancerCards = [
    { title: 'Browse Projects', desc: 'Find work that matches your skills', btn: 'Explore', path: '/projects' },
    { title: 'My Proposals', desc: 'Track your submitted applications', btn: 'View Proposals', path: '/proposals/my' },
    { title: 'Active Contracts', desc: 'See your ongoing work', btn: 'View Contracts', path: '/contracts' },
    { title: 'Messages', desc: 'Chat with clients', btn: 'Open Inbox', path: '/messages' },
  ];

  const adminCards = [
    { title: 'Manage Users', desc: 'View and moderate accounts', btn: 'Manage', path: '/admin/users' },
    { title: 'Manage Projects', desc: 'Review marketplace activity', btn: 'View All', path: '/admin/projects' },
    { title: 'Manage Skills', desc: 'Add skills for freelancers', btn: 'Manage', path: '/admin/skills' },
    { title: 'Manage Categories', desc: 'Add categories for clients', btn: 'Manage', path: '/admin/categories' },
    { title: 'Support Tickets', desc: 'Resolve user issues', btn: 'View Tickets', path: '/admin/support' },
  ];

  const cards = isClient
    ? clientCards
    : isFreelancer
    ? freelancerCards
    : adminCards;

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

      <div className={`auth-home-cards ${isAdmin ? 'admin-grid' : ''}`}>
        {cards.map((c, i) => (
          <div key={i} className="dash-card">
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <button
              className="dash-card-btn"
              onClick={() => navigate(c.path)}
            >
              {c.btn} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;