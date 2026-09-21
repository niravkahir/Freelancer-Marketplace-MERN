import { Link } from 'react-router-dom';
import './ProjectCard.css';

const ProjectCard = ({ project }) => {
  const {
    _id,
    projectId,
    title,
    description,
    budget,
    category,
    skillsRequired,
    deadline,
    status,
    clientId,
    proposalsCount,
  } = project;

  const daysLeft = Math.ceil(
    (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link to={`/projects/${projectId}`} className="project-card">
      <div className="project-card-header">
        <span className="project-status">{status}</span>
        <span className="project-category">{category}</span>
      </div>

      <h3 className="project-title">{title}</h3>

      <p className="project-desc">
        {description?.length > 120
          ? description.slice(0, 120) + '...'
          : description}
      </p>

      <div className="project-skills">
        {skillsRequired?.slice(0, 4).map((s, i) => (
          <span key={i} className="skill-chip">{s}</span>
        ))}
        {skillsRequired?.length > 4 && (
          <span className="skill-chip more">+{skillsRequired.length - 4}</span>
        )}
      </div>

      <div className="project-card-footer">
        <div className="project-budget">₹{budget?.toLocaleString()}</div>
        <div className="project-meta">
          {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'} · {proposalsCount || 0} proposals
        </div>
      </div>

      {clientId?.name && (
        <div className="project-client">by {clientId.name}</div>
      )}
    </Link>
  );
};

export default ProjectCard;