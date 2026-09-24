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

  // Filters
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (category) params.append('category', category);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const { data } = await api.get(`/projects/search?${params.toString()}`);
      let list = data.projects || [];

      // Sort client-side
      if (sort === 'newest') {
        list = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (sort === 'budget-high') {
        list = [...list].sort((a, b) => b.budget - a.budget);
      } else if (sort === 'budget-low') {
        list = [...list].sort((a, b) => a.budget - b.budget);
      } else if (sort === 'deadline') {
        list = [...list].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        );
      }

      setProjects(list);
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
      // silent
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

  const clearFilters = () => {
    setKeyword('');
    setCategory('');
    setMinBudget('');
    setMaxBudget('');
    setSort('newest');
    setTimeout(fetchProjects, 0);
  };

  // ✅ Filter out client's own projects from "Other Projects"
  const myProjectIds = new Set(myProjects.map((p) => p._id));
  const otherProjects = isClient
    ? projects.filter((p) => !myProjectIds.has(p._id))
    : projects;

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

      {/* Search + Filters */}
      <form onSubmit={handleSearch} className="projects-search">
        <input
          className="search-input"
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
          <option value="Data Science">Data Science</option>
        </select>

        <input
          type="number"
          placeholder="Min ₹"
          value={minBudget}
          onChange={(e) => setMinBudget(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max ₹"
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
        />

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="budget-high">Budget: High → Low</option>
          <option value="budget-low">Budget: Low → High</option>
          <option value="deadline">Deadline Soonest</option>
        </select>

        <button type="submit" className="btn-search">Search</button>
        <button type="button" className="btn-clear" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {/* My Projects (Client only) */}
      {isClient && myProjects.length > 0 && (
        <section className="my-projects-section">
          <h2 className="section-heading">
            MY PROJECTS ({myProjects.length})
          </h2>
          <div className="projects-grid">
            {myProjects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Other / All Projects */}
      <section className="all-projects-section">
        <h2 className="section-heading">
          {isClient ? 'OTHER PROJECTS' : 'ALL PROJECTS'} ({otherProjects.length})
        </h2>

        {loading && <div className="projects-state">Loading...</div>}
        {error && <div className="projects-state error">{error}</div>}

        {!loading && !error && otherProjects.length === 0 && (
          <div className="projects-state">
            {isClient
              ? 'No other projects from clients yet.'
              : 'No projects found. Try changing filters.'}
          </div>
        )}

        {!loading && !error && otherProjects.length > 0 && (
          <div className="projects-grid">
            {otherProjects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Projects;