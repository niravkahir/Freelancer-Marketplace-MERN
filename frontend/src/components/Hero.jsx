import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  // const stats = [
  //   { value: '12,400+', label: 'Active Freelancers' },
  //   { value: '8,900+', label: 'Projects Completed' },
  //   { value: '2,300+', label: 'Hiring Clients' },
  //   { value: '98%', label: 'Satisfaction Rate' },
  // ];

  return (
    <section className="hero">
      <div className="hero-eyebrow">
        <span className="line"></span>
        <span className="text">TRUSTED BY THOUSANDS WORLDWIDE</span>
        <span className="line"></span>
      </div>

      <h1 className="hero-title">
        CONNECT. COLLABORATE.<br />
        CREATE SOMETHING GREAT.
      </h1>

      <p className="hero-subtitle">
        The marketplace where skilled freelancers meet ambitious clients.
        Post projects, receive proposals, hire talent, and pay securely —
        all in one place.
      </p>

      <div className="hero-actions">
        <Link to="/register" className="hero-btn-primary">
          FIND TALENT →
        </Link>
        <Link to="/projects" className="hero-btn-secondary">
          BROWSE PROJECTS
        </Link>
      </div>

      {/* <div className="hero-stats">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div> */}
    </section>
  );
};

export default Hero;