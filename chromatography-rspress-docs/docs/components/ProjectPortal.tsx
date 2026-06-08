import React from 'react';
import projectData from './project-index.json';
import './ProjectPortal.css';

export default function ProjectPortal() {
  return (
    <div className="custom-portal-layout">
      <div className="portal-hero">
        <h1 className="portal-title">企业产品文档中心</h1>
        <p className="portal-subtitle">
          这是我们为全线硬件设备、软件项目以及生态工具提供技术文档的统一在线门户。<br/>
          请在下方选择您需要查阅的产品系列与具体项目。
        </p>
      </div>

      <div className="portal-content">
        {projectData.map((category) => (
          <div key={category.name} className="category-section">
            <h2 className="category-title">{category.label}</h2>
            <div className="project-grid">
              {category.projects.map((project) => (
                <a key={project.name} href={project.link} className="project-card">
                  <div className="project-card-content">
                    <h3 className="project-title">{project.label}</h3>
                    <div className="project-card-footer">
                      <span className="project-link-text">阅读文档</span>
                      <span className="project-arrow">&rarr;</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="portal-footer-hint">
        <div className="hint-icon">💡</div>
        <div className="hint-text">
          <strong>系统提示：</strong>
          本页内容会根据各业务项目自动同步并生成。开发者只需在项目中使用 <code>publish-to-docs</code> 技能，文档即可全自动在此处生成入口，并获得独立的菜单与阅读空间。
        </div>
      </div>
    </div>
  );
}
