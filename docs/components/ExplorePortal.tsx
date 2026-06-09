import React, { useState } from 'react';
import projectsData from './projects.json';

const ExplorePortal = () => {
  const { tags, projects } = projectsData;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredProjects = selectedTags.length === 0
    ? projects
    : projects.filter(p => selectedTags.every(t => p.tags.includes(t)));

  return (
    <div className="explore-container">
      <style dangerouslySetContent={{__html: `
        .explore-container {
          display: flex;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          gap: 2rem;
          min-height: calc(100vh - 100px);
        }
        .explore-sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid var(--rp-c-divider);
          padding-right: 2rem;
        }
        .sidebar-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--rp-c-text-1);
        }
        .filter-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .filter-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--rp-c-text-2);
          font-size: 0.95rem;
          transition: color 0.2s;
        }
        .filter-label:hover {
          color: var(--rp-c-brand);
        }
        .explore-main {
          flex-grow: 1;
        }
        .results-header {
          margin-bottom: 1.5rem;
          color: var(--rp-c-text-2);
          font-size: 0.95rem;
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.2rem;
        }
        .explore-card {
          padding: 1.2rem;
          border: 1px solid var(--rp-c-divider);
          border-radius: 8px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          background: var(--rp-c-bg);
          transition: border-color 0.2s;
        }
        .explore-card:hover {
          border-color: var(--rp-c-brand);
        }
        .ex-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--rp-c-text-1);
        }
        .ex-card-desc {
          font-size: 0.85rem;
          color: var(--rp-c-text-2);
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .ex-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: auto;
        }
        .ex-tag {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          background: var(--rp-c-bg-mute);
          border-radius: 4px;
          color: var(--rp-c-text-3);
        }
        @media (max-width: 768px) {
          .explore-container {
            flex-direction: column;
            padding: 1rem;
          }
          .explore-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--rp-c-divider);
            padding-right: 0;
            padding-bottom: 1.5rem;
          }
        }
      `}} />

      <aside className="explore-sidebar">
        <div className="sidebar-title">筛选标签</div>
        <div className="filter-list">
          {tags.map(tag => (
            <label key={tag} className="filter-label">
              <input 
                type="checkbox" 
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </aside>

      <main className="explore-main">
        <div className="results-header">
          找到 {filteredProjects.length} 个相关项目
        </div>
        <div className="explore-grid">
          {filteredProjects.map(project => (
            <a key={project.id} href={project.link} className="explore-card">
              <h4 className="ex-card-title">{project.icon} {project.title}</h4>
              <div className="ex-card-desc">{project.description}</div>
              <div className="ex-card-tags">
                {project.tags.map(t => (
                  <span key={t} className="ex-tag">{t}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ExplorePortal;