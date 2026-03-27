// 博客文章数据
export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  cover?: string;
  views: number;
}

export const articles: Article[] = [
  {
    id: 1,
    title: 'React 18 新特性深度解析',
    excerpt: 'React 18 带来了并发渲染、Automatic Batching、Suspense 等重磅新特性，本文带你深入理解这些变化。',
    content: `## React 18 新特性深度解析

React 18 是近年来最重要的版本更新，引入了**并发渲染（Concurrent Rendering）**机制，让 React 应用能够同时处理多个任务，从而大幅提升用户体验。

### Automatic Batching（自动批处理）

在 React 18 之前，只有 React 事件处理器中的多次 setState 会被批处理。而在 React 18 中，**所有**的 setState 调用都会被自动批处理，包括 fetch 回调、定时器等。

\`\`\`jsx
// 之前：3次渲染
setCount(c => c + 1);
setName('Alice');
setAge(age + 1);

// React 18：只渲染1次！
\`\`\`

### Suspense 与流式 SSR

React 18 对 Server Side Rendering 进行了重大改进，支持流式渲染，配合 \`<Suspense>\` 可以实现：

- 服务端逐步输出 HTML
- 更快的内容可见时间（FCP）
- 支持 Streaming

### useTransition

\`useTransition\` 允许我们将某些状态更新标记为"过渡任务"，这些任务可以被中断，适合处理大量数据更新的场景：

\`\`\`jsx
import { useTransition } from 'react';

function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  
  startTransition(() => {
    // 这些更新可以被中断
    setResults(search(query));
  });
}
\`\`\`

### 总结

React 18 的并发特性为应用性能带来了质的飞跃，建议逐步迁移并充分利用这些新 API。`,
    author: '小明',
    date: '2024-11-15',
    tags: ['React', '前端', 'JavaScript'],
    views: 2847,
  },
  {
    id: 2,
    title: 'TypeScript 5.0 实用技巧分享',
    excerpt: 'TypeScript 5.0 带来了 const 类型参数、装饰器标准化等新特性，这些技巧让你的代码更健壮。',
    content: `## TypeScript 5.0 实用技巧分享

TypeScript 5.0 是一个重要的里程碑版本，本文介绍几个最实用的新特性。

### const 类型参数

\`\`\`typescript
// 之前：需要 as const
function makeRoute<Path extends string>(path: Path) {
  return path;
}
const route = makeRoute('home'); // type = string

// TypeScript 5.0
function makeRoute<const Path extends string>(path: Path) {
  return path;
}
const route = makeRoute('home'); // type = 'home'
\`\`\`

### 装饰器（Decorators）

TypeScript 5.0 终于支持了 ECMAScript 标准装饰器：

\`\`\`typescript
function logged(target: any, context: ClassMemberDecoratorContext) {
  return function(...args) {
    console.log(\`Calling \${String(context.name)}\`);
    return target.apply(this, args);
  };
}

class Calculator {
  @logged
  add(a: number, b: number) {
    return a + b;
  }
}
\`\`\`

### 更智能的类型推导

TypeScript 5.0 对泛型推导进行了大幅优化，特别是在处理复杂联合类型时更加准确。

### 迁移建议

建议项目逐步升级到 TypeScript 5.0，充分利用新特性的同时注意类型兼容性问题。`,
    author: '小红',
    date: '2024-11-10',
    tags: ['TypeScript', '前端', '编程'],
    views: 1932,
  },
  {
    id: 3,
    title: 'Vite 5 完全指南：从入门到精通',
    excerpt: 'Vite 凭借其极快的冷启动和热更新速度，已成为现代前端开发的首选构建工具。本文是完整指南。',
    content: `## Vite 5 完全指南

Vite 是下一代前端构建工具，利用浏览器原生 ES Module 实现了极速的开发体验。

### 核心原理

Vite 开发环境采用**no-bundle**策略，直接利用浏览器 ESM 加载源码，依赖部分通过 \`esbuild\` 预处理。

### 快速开始

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
\`\`\`

### 配置优化

\`\`\`typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
\`\`\`

### 生产构建

Vite 使用 Rollup 进行生产构建，生成高度优化的静态资源。

### 插件生态

Vite 拥有丰富的插件生态，涵盖 Vue、React、Svelte 等主流框架。`,
    author: '阿杰',
    date: '2024-11-05',
    tags: ['Vite', '前端', '构建工具'],
    views: 3561,
  },
  {
    id: 4,
    title: 'Ant Design 5.0 设计系统实践',
    excerpt: 'Ant Design 5.0 带来了全新主题系统、CSSinJS 引擎升级，本文分享企业级设计系统搭建经验。',
    content: `## Ant Design 5.0 设计系统实践

Ant Design 是蚂蚁集团开源的企业级 UI 设计语言，5.0 版本进行了全面升级。

### 全新主题系统

\`\`\`typescript
import { ConfigProvider } from 'antd';
import theme from 'antd/tokens';

<ConfigProvider
  theme={{
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  }}
>
  <App />
</ConfigProvider>
\`\`\`

### CSSinJS 引擎

5.0 使用 Runtime CSSinJS 方案，支持：
- 动态主题切换
- SSR 友好
- 更好的样式隔离

### 组件最佳实践

合理使用 \`Space\`、\`Grid\` 等布局组件，配合 \`Typography\` 实现统一的内容层级。`,
    author: '小美',
    date: '2024-10-28',
    tags: ['Ant Design', '前端', 'UI'],
    views: 2103,
  },
  {
    id: 5,
    title: 'Node.js 性能优化实战',
    excerpt: '从内存管理、CPU 利用率、I/O 优化等维度，全面提升 Node.js 应用性能。',
    content: `## Node.js 性能优化实战

Node.js 性能优化是一个系统工程，需要从多个维度入手。

### 内存管理

使用 \`--max-old-space-size\` 调整堆内存：

\`\`\`bash
node --max-old-space-size=4096 server.js
\`\`\`

定期检查内存泄漏，使用 Chrome DevTools 分析堆快照。

### 集群模式

利用 Cluster 模块充分利用多核 CPU：

\`\`\`javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.listen(3000);
}
\`\`\`

### 异步优化

避免同步阻塞，优先使用异步 API，合理使用 \`Promise.all\` 并行处理。`,
    author: '老王',
    date: '2024-10-20',
    tags: ['Node.js', '后端', '性能优化'],
    views: 1587,
  },
  {
    id: 6,
    title: 'Git 高级操作：让版本控制更高效',
    excerpt: 'Git 不仅是提交代码的工具，这些高级操作让你的协作流程更加流畅。',
    content: `## Git 高级操作

掌握这些 Git 高级操作，让你的版本控制更加得心应手。

### 交互式 Rebase

整理提交历史，让代码审查更清晰：

\`\`\`bash
git rebase -i HEAD~3
\`\`\`

### Bisect 二分查找

快速定位引入 bug 的提交：

\`\`\`bash
git bisect start
git bisect bad
git bisect good v1.0.0
# Git 会自动切换到中间版本进行测试
\`\`\`

### Submodule 和 Subtree

管理多仓库依赖的两种方案，各有适用场景。

### 钩子（Hooks）

利用 pre-commit、post-merge 等钩子自动化工作流。`,
    author: '小明',
    date: '2024-10-15',
    tags: ['Git', '工具', '版本控制'],
    views: 3204,
  },
];
