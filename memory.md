# 项目记忆库

---

# 📋 新模型/新会话快速上手指南

> 本文档帮助后续 AI 模型或新会话快速了解项目架构，防止误操作。

---

## 1️⃣ 项目概览

| 项目 | 值 |
|------|-----|
| 项目名称 | 我的博客 (My Blog) |
| 技术栈 | React + Vite + TypeScript + Ant Design |
| 后端 | Express.js + Supabase PostgreSQL |
| 部署平台 | Vercel (前端 + API) |
| 数据库 | Supabase (PostgreSQL) |

---

## 2️⃣ 关键文件位置

```
D:\Work\ForAI\blog\
├── api/index.js           # 后端 API 主文件 (~711 行)
├── src/
│   ├── App.tsx            # React 主组件
│   ├── main.tsx           # 入口文件
│   ├── contexts/AuthContext.tsx    # 认证上下文
│   ├── pages/
│   │   ├── admin/         # 管理后台页面
│   │   │   ├── AdminArticles.tsx   # 文章管理
│   │   │   └── ArticleEditor.tsx   # 文章编辑器
│   │   └── ...
│   └── components/        # 公共组件
├── server/.env            # 本地环境变量
├── vercel.json            # Vercel 配置
└── memory.md              # 本文件
```

---

## 3️⃣ 数据库信息

### 连接信息
```
Host: db.otwnztyawygxcjnkzkku.supabase.co
Port: 5432
User: postgres
Password: UtdPwd123..
Database: postgres
```

### 核心表结构

**users 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| username | VARCHAR | 用户名（唯一） |
| email | VARCHAR | 邮箱（唯一） |
| password | VARCHAR | bcrypt 加密密码 |
| nickname | VARCHAR | 昵称 |
| role | VARCHAR | 角色：admin/user |
| avatar | VARCHAR | 头像 URL |
| created_at | TIMESTAMP | 创建时间 |

**articles 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| title | VARCHAR | 标题 |
| content | TEXT | Markdown 内容 |
| excerpt | VARCHAR | 摘要 |
| author_name | VARCHAR | 作者名 |
| tags | JSONB | 标签数组 |
| views | INTEGER | 阅读数 |
| created_at | TIMESTAMP | 创建时间 |

**comments 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| article_id | INTEGER | 文章 ID |
| user_id | INTEGER | 用户 ID |
| user_name | VARCHAR | 评论者名 |
| content | TEXT | 评论内容 |
| created_at | TIMESTAMP | 创建时间 |

**email_codes 表**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| email | VARCHAR | 邮箱 |
| code | VARCHAR | 验证码 |
| action | VARCHAR | 用途：register/login/reset |
| expires_at | TIMESTAMP | 过期时间 |

### 现有用户数据
| ID | username | email | role |
|----|----------|-------|------|
| 1 | test | test@test.com | user |
| 2 | memeflyfly | 1624318455@qq.com | admin |

### 现有文章数据
| ID | title | author | views |
|----|-------|--------|-------|
| 1 | React 18 新特性深度解析 | 小明 | 2855 |
| 2 | TypeScript 5.0 实用技巧分享 | 小红 | 1935 |
| 3 | Vite 5 完全指南 | 阿杰 | 3568 |
| 4 | 测试自动保存功能 | memeflyfly | 4 |
| 5 | 测试markdown实时预览功能 | memeflyfly | 1 |
| 6 | AI代码提交后vercel自动部署环节报错的处理 | memeflyfly | 17 |

---

## 4️⃣ API 路由清单

### 认证相关
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/email-register | 邮箱注册 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |

### 文章（公开）
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/articles | 文章列表 | 否 |
| GET | /api/articles/:id | 文章详情 | 否 |
| GET | /api/articles/user/:username | 用户文章 | 否 |

### 评论
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/comments/:articleId | 评论列表 | 否 |
| POST | /api/comments/:articleId | 发表评论 | 可选 |

### 管理后台（需要 admin 角色）
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/admin/articles | 文章列表 | admin |
| POST | /api/admin/articles | 创建文章 | admin |
| GET | /api/admin/articles/:id | 获取文章 | admin |
| PUT | /api/admin/articles/:id | 更新文章 | admin |
| DELETE | /api/admin/articles/:id | 删除文章 | admin |

---

## 5️⃣ 关键配置

### JWT 配置 ⚠️ 重要
```javascript
// api/index.js 第 10 行
const JWT_SECRET = process.env.JWT_SECRET || 'blog-jwt-secret-key-2024';
```

**警告**：
- Vercel 环境变量中**不要设置** JWT_SECRET
- 如果设置，必须与代码默认值一致，否则会导致 token 验证失败
- 教训：曾因 Vercel 设置 `JWT_SECRET=blog-secret` 导致登录后无法访问管理后台

### Resend API（邮件）
```
RESEND_API_KEY=re_Z1dRVh2U_DCi8ovWPi4yrz6N99ysLq7Yz
```

---

## 6️⃣ 常见任务操作指南

### 登录测试
1. 访问 https://blog-phi-five-62.vercel.app
2. 点击登录按钮
3. 使用 admin 账号：`1624318455@qq.com` / `Memeflyfly123!`
4. 验证：登录后 toast 应显示 "欢迎回来，memeflyfly！"

### 访问管理后台
1. 登录 admin 账号后访问 https://blog-phi-five-62.vercel.app/admin/articles
2. 页面应正常显示文章列表（6 篇文章）
3. 如果返回 401，检查 JWT_SECRET 配置

### 创建/编辑文章
1. 登录 admin 账号
2. 访问 /admin/articles 点击"编辑"按钮
3. 修改标题/内容后点击"更新文章"
4. 验证前台文章页面是否更新

### 数据库操作
- **禁止直接修改生产数据库**
- 如需修改，先确认是本地还是生产环境
- 修改用户 role：`UPDATE users SET role='admin' WHERE email='xxx@xx.com';`

---

## 7️⃣ 调试技巧

### 浏览器控制台测试 API
```javascript
const token = localStorage.getItem('blog_token');
// 获取文章列表
fetch('/api/admin/articles', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json()).then(console.log);

// 更新文章
fetch('/api/admin/articles/6', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token 
  },
  body: JSON.stringify({ title: 'Test', content: 'content', tags: [] })
}).then(r => r.json()).then(console.log);
```

### 检查 Vercel 环境变量
1. 访问 Vercel Dashboard → 项目 → Settings → Environment Variables
2. 确认 JWT_SECRET 未设置或值正确

### 本地运行
```bash
cd D:\Work\ForAI\blog
npm run dev    # 前端开发服务器
# 后端在 Vercel 上运行
```

---

## 8️⃣ 禁止操作清单

| 操作 | 后果 | 替代方案 |
|------|------|----------|
| ⚠️ 在 Vercel 设置 JWT_SECRET | 导致认证失败 | 删除环境变量或确保与代码一致 |
| ⚠️ 直接修改数据库密码 | 可能导致连接失败 | 使用正确的密码 |
| ⚠️ 删除 articles 表数据 | 丢失博客内容 | 确认后再执行 |
| ⚠️ 修改 server/.env 中的 DB_HOST | 数据库连接失败 | 确认再修改 |

---

## 9️⃣ 部署信息

| 环境 | URL |
|------|-----|
| 生产 | https://blog-phi-five-62.vercel.app |
| GitHub | https://github.com/1624318455/blog |

### 部署流程
```bash
cd D:\Work\ForAI\blog
git add .
git commit -m "描述"
git push origin main
# Vercel 自动部署
```

---

## 🔟 联系信息

- 管理员账号：memeflyfly / 1624318455@qq.com / Memeflyfly123!
- 如有疑问先检查 memory.md

---

# 附录：历史经验

## 教训 2026-04-05: JWT Secret 不一致导致认证失败

### 问题
用户使用 admin 账号登录后，访问 `/admin/articles` 管理页面时返回 401 错误 "Token 无效或已过期"。

### 根因
- Vercel 环境变量中设置了错误的 `JWT_SECRET = blog-secret`
- 代码中的默认值是 `blog-jwt-secret-key-2024`
- 登录时用 Vercel 设置的 secret 签名 token
- 验证时用代码默认值验证，导致不匹配

### 解决方案
1. **删除 Vercel 中的 JWT_SECRET 环境变量**
2. **修正代码默认值**为 `blog-jwt-secret-key-2024`
3. **修复 requireAdmin SQL 查询**：移除不存在的 `nickname` 字段

---

## 技巧 2026-04-05: 快速调试浏览器中的 API

```javascript
const token = localStorage.getItem('blog_token');
fetch('/api/admin/articles/6', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ title: 'Test', content: 'content', tags: [] })
}).then(r => r.json()).then(console.log);
```

---

## 决策 2026-04-05: 前端昵称显示逻辑

登录成功后 toast 显示 "欢迎回来，undefined！"

### 决策
在 `/api/auth/login` 返回的用户对象中添加 `nickname: user.nickname || user.username`

---

## 流程 2026-04-05: 端到端验证检查清单

1. **登录流程**：用户名/邮箱 + 密码登录，检查 token 和用户信息
2. **权限验证**：检查返回的用户 role 是否正确
3. **受保护路由**：访问需要 admin 权限的页面
4. **CRUD 操作**：创建、读取、更新、删除功能测试
5. **数据一致性**：验证数据库与前端显示一致

---

## 方法论 2026-04-06: Windows 定时任务 + 飞书通知自动化系统

### 系统架构
- 每日 18:00 北京时间自动执行备份任务
- Windows Task Scheduler (schtasks) 创建定时任务
- PowerShell 脚本执行 Git 备份
- 飞书 CLI 发送任务执行通知

### 关键脚本位置
- `D:\Work\ForAI\scripts\backup-global.ps1` - 全局配置备份
- `D:\Work\ForAI\scripts\backup-projects.ps1` - 项目文件备份
- `D:\Work\ForAI\scripts\publish-summary.ps1` - 总结提取

### 定时任务列表
| 任务名 | 脚本 |
|--------|------|
| `\OpenCode\opencode-daily-backup-global` | backup-global.ps1 |
| `\OpenCode\opencode-daily-backup-projects` | backup-projects.ps1 |
| `\OpenCode\opencode-daily-publish-summary` | publish-summary.ps1 |

### 经验总结
1. **代理环境处理**：飞书 CLI 需要设置 `$env:LARK_CLI_NO_PROXY = "1"` 禁用代理
2. **脚本编码**：PowerShell 脚本需要正确的换行符格式
3. **目录删除问题**：删除临时目录前先离开该目录
4. **Git 推送**：脚本中不需要单独配置 git user，已继承全局配置

### 备份仓库
- GitHub: https://github.com/1624318455/opencode-backup
- 内容：全局 AGENTS.md/memory.md + 项目 AGENTS.md/memory.md

---

## 教训 2026-04-06: 博客文章内容截断问题

### 问题
飞书定时备份与通知实战文章在博客前台显示内容被截断，只显示到"系统架构"部分，后面的"核心实现"、"关键经验总结"、"技术栈"、"总结"等内容全部丢失。

### 根因
1. 最初创建文章时，通过管理后台上传内容，但 React 表单状态未正确更新
2. 数据库中实际只保存了 1011 字符的截断内容
3. Vercel 部署的版本也是截断后的版本

### 解决方案
1. 通过浏览器自动化（Playwright）直接操作管理后台
2. 使用 `Object.getOwnPropertyDescriptor` 强制设置 textarea 值
3. 触发正确的 InputEvent 事件更新 React 状态
4. 点击"更新文章"按钮提交完整内容（2871 字符）

### 验证方法
- API 返回内容长度：2871 字符
- 检查关键字符串："技术栈"、"总结"是否存在
- 直接查看数据库 articles 表 content 字段
