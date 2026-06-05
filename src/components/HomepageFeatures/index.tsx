import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '统一入口，全矩阵覆盖',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        打破各产品线信息孤岛。将色谱仪器、光谱设备、上位机软件、环保平台等所有
        产品线的使用手册、二次开发协议、故障排查指南统一汇聚于此。
      </>
    ),
  },
  {
    title: '高交互的动态说明',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        基于 React 与 MDX 架构，突破传统纸质或 PDF 说明书的限制。
        直接在文档中嵌入气路动态仿真、通信协议在线测试等强交互组件。
      </>
    ),
  },
  {
    title: 'AI 与自动化运维',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        完美契合 GitOps 工作流与大语言模型。AI 自动生成或更新内容后，
        触发服务器 WebHook 自动静默编译，多站点分钟级同步上线。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
