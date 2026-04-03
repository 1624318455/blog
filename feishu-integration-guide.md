# AI Agent 接入飞书完整指南

> 让 AI Agent 通过自然语言控制飞书

## 什么是飞书集成

将飞书 (Lark/Feishu) 与 AI Agent (如 OpenCode、Cursor、Claude Code) 集成后，你可以用自然语言控制飞书：

- 📱 发送消息到群聊
- 📄 创建和搜索文档
- 📅 管理日历日程
- ✅ 创建和管理任务
- 📧 发送邮件
- 📊 操作多维表格

## 快速开始

### 步骤 1：创建飞书应用

1. 打开 [飞书开放平台开发者后台](https://open.larksuite.com/)
2. 点击「创建应用」→ 选择「自建应用」
3. 填写应用名称（如 "AI 助手"）并创建
4. 获取 **App ID** 和 **App Secret**

![创建应用](https://example.com/create-app.png)

### 步骤 2：配置应用权限

在应用管理页面添加所需权限：

| 权限名称 | 用途 |
|---------|------|
| `im:chat:readonly` | 获取群聊列表 |
| `im:message:send_as_bot` | 发送消息 |
| `im:chat` | 群聊管理 |
| `im:message` | 消息相关操作 |
| `contact:user.base:readonly` | 读取用户信息 |

添加权限后，点击「发布应用」。

### 步骤 3：安装 Feishu CLI

使用 npx 运行 Feishu CLI（无需全局安装）：

```bash
# 测试安装
npx @larksuite/cli --version

# 配置应用凭证
echo "your-app-secret" | npx @larksuite/cli config init --app-id your-app-id --app-secret-stdin
```

### 步骤 4：安装为 AI Skill

让 AI Agent 可以用自然语言调用飞书功能：

```bash
npx skills add larksuite/cli -y -g
```

安装 20 个 Skills：
- `lark-im` - 消息发送/回复/搜索
- `lark-doc` - 文档操作
- `lark-base` - 多维表格
- `lark-calendar` - 日历管理
- `lark-contact` - 用户搜索
- `lark-wiki` - 知识库
- `lark-task` - 任务管理
- `lark-mail` - 邮件管理
- `lark-vc` - 会议记录
- 等等...

## 常用命令

### 消息操作

```bash
# 发送消息到群聊
npx @larksuite/cli im +messages-send --chat-id "oc_xxx" --text "你好"

# 查询群聊消息
npx @larksuite/cli im +chat-messages-list --chat-id "oc_xxx"

# 根据群名查找群聊ID
npx @larksuite/cli im +chat-search --query "项目群"

# 列出所有群聊
npx @larksuite/cli im chats list
```

### 文档操作

```bash
# 搜索文档
npx @larksuite/cli doc +search --query "会议纪要"

# 创建文档
npx @larksuite/cli doc +create --title "周报" --markdown "# 本周工作..."

# 读取文档
npx @larksuite/cli doc +get --token "doc_xxx"
```

### 日历操作

```bash
# 查看今日日程
npx @larksuite/cli calendar +agenda

# 创建事件
npx @larksuite/cli calendar events create --title "会议" --start "2024-01-01T10:00:00Z"
```

## 自然语言指令示例

安装 Skill 后，你可以直接用自然语言：

| 指令 | 说明 |
|------|------|
| "发送消息'大家好'到群聊'Detroit'" | 自动查找群聊并发送 |
| "总结群聊'项目群'中今天的内容" | 获取并总结今日消息 |
| "搜索包含'技术方案'的文档" | 搜索云文档 |
| "查看今天的日历" | 获取今日日程 |
| "创建一个任务：完成报告" | 创建任务 |

## 技术细节

### 凭证管理

Feishu CLI 使用 OAuth 2.0 设备流认证，凭证安全存储在操作系统密钥链中。

### 身份类型

- `user` - 代表当前用户操作
- `bot` - 使用机器人身份操作

### API 层级

1. **快捷命令** (`+` 前缀) - 推荐，简单易用
2. **API 命令** - 精确控制
3. **原始 API** - 访问全部 2500+ 端点

## 常见问题

### Q: 为什么发送消息失败？

检查应用权限：
- 需要 `im:message:send_as_bot`
- 需要在目标群聊中添加机器人

### Q: 如何查看群聊 ID？

使用 `im +chat-search` 命令按群名搜索，或 `im chats list` 列出所有群聊。

### Q: 支持国际版 Lark 吗？

支持，配置时使用 `--brand lark` 参数。

## 相关资源

- [飞书开放平台](https://open.larksuite.com/)
- [Feishu CLI 官方文档](https://feishu-cli.com/)
- [GitHub 仓库](https://github.com/larksuite/cli)

---

*本文档由 AI Agent 生成*
