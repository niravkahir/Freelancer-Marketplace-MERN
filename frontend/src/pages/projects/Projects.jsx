import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ProjectCard from '../../components/ProjectCard';
import './Projects.css';

const Projects = () => {
  const { isClient } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (category) params.append('category', category);

      const { data } = await api.get(`/projects?${params.toString()}`);
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    try {
      const { data } = await api.get('/users/my-projects');
      setMyProjects(data.projects || []);
    } catch (err) {
      // silent — client may not have projects yet
    }
  };

  useEffect(() => {
    fetchProjects();
    if (isClient) fetchMyProjects();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="projects-header">
        <div>
          <h1>EXPLORE PROJECTS</h1>
          <p>Discover work that matches your skills</p>
        </div>
        {isClient && (
          <Link to="/projects/create" className="btn-primary">
            + Post a Project
          </Link>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="projects-search">
        <input
          placeholder="Search by title, description, or skill..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Web Development">Web Development</option>
          <option value="Mobile Development">Mobile Development</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Writing">Writing</option>
        </select>
        <button type="submit" className="btn-search">Search</button>
      </form>

      {/* My Projects (Client only) */}
      {isClient && myProjects.length > 0 && (
        <section className="my-projects-section">
          <h2 className="section-heading">MY PROJECTS</h2>
          <div className="projects-grid">
            {myProjects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* All Projects */}
      <section className="all-projects-section">
        <h2 className="section-heading">
          {isClient ? 'OTHER PROJECTS' : 'ALL PROJECTS'}
        </h2>

        {loading && <div className="projects-state">Loading...</div>}
        {error && <div className="projects-state error">{error}</div>}

        {!loading && !error && projects.length === 0 && (
          <div className="projects-state">No projects found.</div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Projects;