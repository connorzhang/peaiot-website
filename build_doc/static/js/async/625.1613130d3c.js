"use strict";(self.rspackChunkrspress_doc_template=self.rspackChunkrspress_doc_template||[]).push([[625],{24(e,r,t){t.r(r);var i=t(4848),a=t(6540),o=t(1437);t.d(r,{},{default:()=>{let[e,r]=(0,a.useState)("全部"),{_:t,d:c}=o,n="全部"===e?c:c.filter(r=>r.tags.includes(e));return(0,i.jsxs)("div",{className:"project-portal-container",children:[(0,i.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}}),(0,i.jsxs)("div",{className:"tag-filter-container",children:[(0,i.jsx)("button",{className:`tag-chip ${"全部"===e?"active":""}`,onClick:()=>r("全部"),children:"全部项目"}),t.map(t=>(0,i.jsx)("button",{className:`tag-chip ${e===t?"active":""}`,onClick:()=>r(t),children:t},t))]}),(0,i.jsx)("div",{className:"projects-grid",children:n.map(e=>(0,i.jsxs)("a",{href:e.link,className:"project-card",children:[(0,i.jsxs)("div",{className:"project-card-header",children:[(0,i.jsx)("div",{className:"project-icon",children:e.icon||"📁"}),(0,i.jsx)("h3",{className:"project-title",children:e.title})]}),(0,i.jsx)("p",{className:"project-desc",children:e.description||"点击查看详细文档"}),(0,i.jsx)("div",{className:"project-badges",children:e.tags.map(e=>(0,i.jsx)("span",{className:"badge",children:e},e))})]},e.id))}),0===n.length&&(0,i.jsx)("div",{style:{textAlign:"center",padding:"4rem",color:"var(--rp-c-text-3)"},children:"暂无匹配的项目"})]})}})},1437(e){e.exports=JSON.parse('{"_":["硬件","嵌入式","核心","PLC","解决方案","软件","云平台","桌面应用","分析工具","软件系统","网络工具","SD-WAN","Rust","客户端","工控","上位机"],"d":[{"id":"micro-gc","title":"MICRO-GC","description":"微型气相色谱仪硬件架构、主板协议及嵌入式软件说明。","tags":["硬件","嵌入式","核心"],"icon":"🔬","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/micro-gc/tcd-gas-flow"},{"id":"h2o2-plc","title":"双氧水工艺PLC系统","description":"双氧水工艺监控系统 PLC 梯形图开发文档及控制逻辑说明。","tags":["硬件","PLC","解决方案"],"icon":"⚙️","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/h2o2-plc/plc-manual-offline"},{"id":"peabss","title":"PeaBSS 物联网平台","description":"企业级物联网设备接入与管理中枢，提供设备连接、数据处理和可视化服务。","tags":["软件","云平台","核心"],"icon":"🌐","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/peabss/"},{"id":"workstation","title":"色谱工作站","description":"跨平台、高性能的气相色谱仪控制与数据分析软件。","tags":["软件","桌面应用","分析工具"],"icon":"📈","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/workstation/intro"},{"id":"subnetra-studio","title":"Subnetra Studio","description":"基于 Subnetra 核心引擎开发的现代化 SD-WAN 网络配置与管理控制台","tags":["软件系统","网络工具","SD-WAN","Rust","客户端"],"icon":"🌐","repo":"git@github.com:peaiot/subnetra-studio.git","link":"/subnetra-studio/"},{"id":"h2o2_system","title":"双氧水生产控制系统","description":"双氧水工艺生产过程中的PLC硬件控制与上位机监控系统","tags":["工控","Rust","PLC","上位机"],"icon":"🏭","repo":"git@github.com:connorzhang/Hydrogen_peroxide_production_system.git","link":"/h2o2_system/"}]}')}}]);