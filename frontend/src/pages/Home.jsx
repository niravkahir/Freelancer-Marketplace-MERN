import Hero from '../components/Hero';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: '◈',
      title: 'Post a Project',
      desc: 'Describe your needs, set a budget, and publish in minutes.'
    },
    {
      icon: '◆',
      title: 'Receive Proposals',
      desc: 'Skilled freelancers send tailored proposals to your project.'
    },
    {
      icon: '◇',
      title: 'Hire the Best',
      desc: 'Compare profiles, ratings, and portfolios — then pick your match.'
    },
    {
      icon: '◉',
      title: 'Pay Securely',
      desc: 'Milestone-based payments protected every step of the way.'
    },
  ];

  return (
    <>
      <Hero />

      <section className="features">
        <div className="features-header">
          <h2>HOW IT WORKS</h2>
          <p>From idea to delivery — four simple steps.</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;