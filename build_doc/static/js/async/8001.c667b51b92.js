"use strict";(self.rspackChunkrspress_doc_template=self.rspackChunkrspress_doc_template||[]).push([[8001],{3448(e,r,i){i.r(r);var t=i(4848),a=i(8453),o=i(2110);function l(e){return(0,t.jsx)(o.default,{})}function s(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{wrapper:r}={...(0,a.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}s.__RSPRESS_PAGE_META={},s.__RSPRESS_PAGE_META["explore.mdx"]={toc:[],title:"🔍 探索所有项目",headingTitle:"",frontmatter:{pageType:"custom",title:"🔍 探索所有项目",sidebar:!1}},i.d(r,{default:()=>s})},2110(e,r,i){i.r(r);var t=i(4848),a=i(6540),o=i(1437);i.d(r,{},{default:()=>{let{_:e,d:r}=o,[i,l]=(0,a.useState)([]),s=0===i.length?r:r.filter(e=>i.every(r=>e.tags.includes(r)));return(0,t.jsxs)("div",{className:"explore-container",children:[(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}}),(0,t.jsxs)("aside",{className:"explore-sidebar",children:[(0,t.jsx)("div",{className:"sidebar-title",children:"筛选标签"}),(0,t.jsx)("div",{className:"filter-list",children:e.map(e=>(0,t.jsxs)("label",{className:"filter-label",children:[(0,t.jsx)("input",{type:"checkbox",checked:i.includes(e),onChange:()=>{l(r=>r.includes(e)?r.filter(r=>r!==e):[...r,e])}}),e]},e))})]}),(0,t.jsxs)("main",{className:"explore-main",children:[(0,t.jsxs)("div",{className:"results-header",children:["找到 ",s.length," 个相关项目"]}),(0,t.jsx)("div",{className:"explore-grid",children:s.map(e=>(0,t.jsxs)("a",{href:e.link,className:"explore-card",children:[(0,t.jsxs)("h4",{className:"ex-card-title",children:[e.icon," ",e.title]}),(0,t.jsx)("div",{className:"ex-card-desc",children:e.description}),(0,t.jsx)("div",{className:"ex-card-tags",children:e.tags.map(e=>(0,t.jsx)("span",{className:"ex-tag",children:e},e))})]},e.id))})]})]})}})},1437(e){e.exports=JSON.parse('{"_":["硬件","嵌入式","核心","PLC","解决方案","软件","云平台","桌面应用","分析工具"],"d":[{"id":"micro-gc","title":"MICRO-GC","description":"微型气相色谱仪硬件架构、主板协议及嵌入式软件说明。","tags":["硬件","嵌入式","核心"],"icon":"🔬","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/micro-gc/tcd-gas-flow"},{"id":"h2o2-plc","title":"双氧水工艺PLC系统","description":"双氧水工艺监控系统 PLC 梯形图开发文档及控制逻辑说明。","tags":["硬件","PLC","解决方案"],"icon":"⚙️","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/h2o2-plc/plc-manual-offline"},{"id":"peabss","title":"PeaBSS 物联网平台","description":"企业级物联网设备接入与管理中枢，提供设备连接、数据处理和可视化服务。","tags":["软件","云平台","核心"],"icon":"🌐","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/peabss/"},{"id":"workstation","title":"色谱工作站","description":"跨平台、高性能的气相色谱仪控制与数据分析软件。","tags":["软件","桌面应用","分析工具"],"icon":"📈","repo":"git@github.com:connorzhang/peaiot-website.git","link":"/workstation/intro"}]}')}}]);