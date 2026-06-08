import React from 'react';
import projectData from './project-index.json';
import './ProjectPortal.css';

export default function ProjectPortal() {
  return (
    <div className="project-portal">
      {projectData.map((category) => (
        <div key={category.name} className="category-section">
          <h2 className="category-title">{category.label}</h2>
          <div className="project-grid">
            {category.projects.map((project) => (
              <a key={project.name} href={project.link} className="project-card">
                <div className="project-card-content">
                  <h3 className="project-title">{project.label}</h3>
                  <span className="project-link-text">进入文档 &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
