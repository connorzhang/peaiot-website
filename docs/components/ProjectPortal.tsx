import React, { useState } from 'react';
import projectsData from './projects.json';

const ProjectPortal = () => {
  const [activeTag, setActiveTag] = useState('全部');

  const { tags, projects } = projectsData;
  const filteredProjects = activeTag === '全部' 
    ? projects 
    : projects.filter(p => p.tags.includes(activeTag));

  return (
    <div className="project-portal-container">
      <style dangerouslySetInnerHTML={{__html: `
        .project-portal-container {
          padding: 2rem 0;
          max-width: 1200px;
          margin: 0 auto;
        }
        .tag-filter-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          justify-content: center;
        }
        .tag-chip {
          padding: 0.5rem 1.2rem;
          border-radius: 9999px;
          border: 1px solid var(--rp-c-divider);
          background: var(--rp-c-bg-soft);
          color: var(--rp-c-text-2);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }
        .tag-chip:hover {
          border-color: var(--rp-c-brand);
          color: var(--rp-c-brand);
        }
        .tag-chip.active {
          background: var(--rp-c-brand);
          color: white;
          border-color: var(--rp-c-brand);
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .project-card {
          background: var(--rp-c-bg);
          border: 1px solid var(--rp-c-divider);
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
        }
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1);
          border-color: var(--rp-c-brand);
        }
        .project-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .project-icon {
          font-size: 2.5rem;
          background: var(--rp-c-bg-mute);
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .project-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--rp-c-text-1);
          margin: 0;
          line-height: 1.3;
        }
        .project-desc {
          color: var(--rp-c-text-2);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        .project-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: auto;
        }
        .badge {
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          background: var(--rp-c-bg-mute);
          color: var(--rp-c-text-3);
          border-radius: 4px;
          font-weight: 500;
        }
      `}} />

      {/* 标签过滤区 */}
      <div className="tag-filter-container">
        <button 
          className={`tag-chip ${activeTag === '全部' ? 'active' : ''}`}
          onClick={() => setActiveTag('全部')}
        >
          全部项目
        </button>
        {tags.map(tag => (
          <button 
            key={tag}
            className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 卡片展示区 */}
      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <a key={project.id} href={project.link} className="project-card">
            <div className="project-card-header">
              <div className="project-icon">{project.icon || '📁'}</div>
              <h3 className="project-title">{project.title}</h3>
            </div>
            <p className="project-desc">{project.description || '点击查看详细文档'}</p>
            <div className="project-badges">
              {project.tags.map(tag => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div style={{textAlign: 'center', padding: '4rem', color: 'var(--rp-c-text-3)'}}>
          暂无匹配的项目
        </div>
      )}
    </div>
  );
};

export default ProjectPortal;