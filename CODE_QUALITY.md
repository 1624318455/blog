# 代码质量检查指南

## 本地验证

在提交代码前，运行以下命令进行本地验证：

### 1. 类型检查
```bash
npm run type-check
```
检查 TypeScript 类型错误和未使用的变量。

### 2. ESLint 检查
```bash
npm run lint
```
检查代码风格和潜在问题。

### 3. 自动修复
```bash
npm run lint:fix
```
自动修复 ESLint 可以修复的问题。

### 4. 完整验证
```bash
npm run validate
```
同时运行类型检查和 ESLint 检查。

## 自动检查流程

### Git Hooks（Husky + lint-staged）

提交代码时会自动运行：
1. **ESLint 检查** — 检查代码风格
2. **TypeScript 检查** — 检查类型错误

如果检查失败，提交会被阻止。

### 修复未使用变量

如果遇到"变量声明但未使用"的错误，有两种方式处理：

#### 方式 1：使用下划线前缀（推荐）
```typescript
// 不使用的参数用 _ 前缀
const handleCropComplete = (_croppedArea: any, croppedAreaPixels: CropArea) => {
  setCroppedAreaPixels(croppedAreaPixels)
}
```

#### 方式 2：删除未使用的变量
```typescript
// 直接删除不需要的导入或变量
// import { DeleteOutlined } from '@ant-design/icons'  // ❌ 删除
```

## CI/CD 集成

### Vercel 部署前检查

Vercel 会在部署前运行：
```bash
npm run build
```

这会执行：
1. `tsc -b` — TypeScript 编译检查
2. `vite build` — 构建优化

## 常见问题

### Q: 为什么提交被阻止了？
A: 运行 `npm run validate` 查看具体错误，然后修复。

### Q: 如何跳过 Git Hooks？
A: 不推荐，但可以用 `git commit --no-verify` 跳过（仅用于紧急情况）。

### Q: ESLint 自动修复不了怎么办？
A: 手动修复，或在代码中用 `// eslint-disable-next-line` 禁用（需要有充分理由）。

## 最佳实践

1. **提交前运行 `npm run validate`** — 确保代码质量
2. **使用 `npm run lint:fix`** — 自动修复可修复的问题
3. **避免 `// eslint-disable`** — 除非有充分理由
4. **定期更新依赖** — 保持工具最新
5. **遵循 TypeScript 严格模式** — 提高代码安全性

## 配置文件

- `tsconfig.app.json` — TypeScript 配置
- `eslint.config.js` — ESLint 规则
- `.lintstagedrc.json` — lint-staged 配置
- `.husky/pre-commit` — Git Hook 脚本
