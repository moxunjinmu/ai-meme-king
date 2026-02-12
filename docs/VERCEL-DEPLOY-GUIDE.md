# 🚀 Vercel 部署完全指南（小白秒懂版）

本文档手把手教你把项目部署到 Vercel，并连接 PostgreSQL 数据库。不需要懂代码，跟着点就行！

---

## 📋 前置准备

在开始之前，确保你有：
- ✅ 一个 GitHub 账号
- ✅ 项目代码已推送到 GitHub
- ✅ 一个 Vercel 账号（可以用 GitHub 直接登录）

---

## 第一步：导入项目到 Vercel

### 1.1 登录 Vercel
1. 打开 [vercel.com](https://vercel.com)
2. 点击右上角 **"Sign Up"**
3. 选择 **"Continue with GitHub"**（用 GitHub 账号登录）

![登录示意图](https://i.imgur.com/login-placeholder.png)

### 1.2 导入 GitHub 项目
1. 登录后，点击 **"Add New..."** 按钮
2. 选择 **"Project"**

![添加项目](https://i.imgur.com/add-project-placeholder.png)

3. 在列表中找到你的项目（比如 `ai-meme-king`）
4. 点击 **"Import"**

![导入项目](https://i.imgur.com/import-placeholder.png)

### 1.3 配置项目
1. **Project Name**：保持默认或改个名字（比如 `ai-meme-king`）
2. **Framework Preset**：选择 **"Next.js"**（系统会自动检测）
3. **Root Directory**：保持 `./`（不变）

![项目配置](https://i.imgur.com/config-placeholder.png)

4. 点击 **"Deploy"** 按钮

⏳ **等待部署完成...**（大约 1-3 分钟）

---

## 第二步：创建 PostgreSQL 数据库

项目首次部署会失败（因为没有数据库），别慌，这是正常的！

### 2.1 进入 Storage 页面
1. 在 Vercel Dashboard，点击顶部导航的 **"Storage"**

![Storage 入口](https://i.imgur.com/storage-tab-placeholder.png)

2. 点击 **"Create Database"**

![创建数据库](https://i.imgur.com/create-db-placeholder.png)

### 2.2 选择 Postgres
1. 选择 **"Postgres"** → **"Continue"**

![选择 Postgres](https://i.imgur.com/select-postgres-placeholder.png)

2. **Region（地区）**：选择 `Hong Kong (hong-kong)` 或 `Tokyo (tokyo)`（离中国近，速度快）

![选择地区](https://i.imgur.com/select-region-placeholder.png)

3. 勾选同意条款，点击 **"Create"**

⏳ **等待数据库创建...**（大约 30 秒）

### 2.3 连接数据库到项目
1. 数据库创建完成后，点击 **"Connect"**

![连接数据库](https://i.imgur.com/connect-db-placeholder.png)

2. 选择你的项目（比如 `ai-meme-king`）
3. 点击 **"Connect"**

✅ **完成！** 数据库已连接，Vercel 会自动添加环境变量。

---

## 第三步：添加其他环境变量

除了数据库，还需要添加几个配置：

### 3.1 进入环境变量设置
1. 点击顶部 **"Settings"** 标签
2. 左侧选择 **"Environment Variables"**

![环境变量入口](https://i.imgur.com/env-vars-placeholder.png)

### 3.2 添加 SecondMe OAuth 配置

点击 **"Add"** 添加以下变量：

#### 变量 1：Client ID
- **Name**: `NEXT_PUBLIC_SECONDME_CLIENT_ID`
- **Value**: `9141c8d7-3d15-4ba8-bc5d-1034423009cb`

![添加 Client ID](https://i.imgur.com/add-client-id-placeholder.png)

#### 变量 2：回调地址
- **Name**: `NEXT_PUBLIC_SECONDME_REDIRECT_URI`
- **Value**: `https://你的项目名.vercel.app/api/auth/callback`
  - ⚠️ **注意**：把 `你的项目名` 改成你实际的项目名！
  - 比如：`https://ai-meme-king.vercel.app/api/auth/callback`

![添加回调地址](https://i.imgur.com/add-redirect-uri-placeholder.png)

### 3.3 保存环境变量
点击 **"Save"** 保存。

✅ **环境变量配置完成！**

---

## 第四步：重新部署项目

### 4.1 手动触发重新部署
1. 点击顶部 **"Deployments"** 标签
2. 找到最新的部署记录
3. 点击右侧的 **"..."**（三个点）
4. 选择 **"Redeploy"**

![重新部署](https://i.imgur.com/redeploy-placeholder.png)

5. 弹窗中点击 **"Redeploy"** 确认

⏳ **等待部署完成...**

---

## 第五步：初始化数据库（重要！）

项目部署成功后，还需要创建数据库表结构。

### 5.1 在本地执行迁移（推荐）

在本地项目目录打开终端，运行：

```bash
# 1. 确保在正确的项目目录
cd ai-meme-king

# 2. 拉取 Vercel 环境变量
vercel env pull .env.production.local

# 3. 执行数据库迁移（创建表结构）
npx prisma migrate deploy

# 4. 填充种子数据（示例数据）
npx prisma db seed
```

✅ **完成！** 数据库已初始化。

### 5.2 如果没有 Vercel CLI

可以在 Vercel Dashboard 的 **Console** 中执行：

1. 进入 **Deployments** → 最新部署
2. 点击 **...** → **Open in Source Editor**
3. 在终端运行：
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 🎉 完成！访问你的网站

1. 部署成功后，Vercel 会显示一个网址：
   ```
   https://你的项目名.vercel.app
   ```

2. 点击网址即可访问！

![部署成功](https://i.imgur.com/deploy-success-placeholder.png)

---

## 🔧 常见问题

### Q1: 部署失败，显示 "DATABASE_URL not found"
**解决**：检查是否已创建 Postgres 数据库并连接到项目（见第二步）。

### Q2: 登录功能无法使用
**解决**：检查 `NEXT_PUBLIC_SECONDME_REDIRECT_URI` 是否正确，确保域名和实际部署的域名一致。

### Q3: 数据库迁移失败
**解决**：
1. 确认 `POSTGRES_URL` 环境变量已正确设置
2. 检查数据库是否已连接（Storage 页面查看状态）
3. 重新执行 `npx prisma migrate deploy`

### Q4: 如何更新代码后重新部署？
**解决**：
1. 本地修改代码
2. `git push origin master` 推送到 GitHub
3. Vercel 会自动检测并重新部署

### Q5: 如何绑定自定义域名？
**解决**：
1. Vercel Dashboard → 项目 → **Settings** → **Domains**
2. 输入你的域名（如 `www.yourdomain.com`）
3. 按提示在域名服务商处添加 DNS 记录

---

## 📚 相关链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

---

**恭喜！🎊 你现在已经成功把项目部署到 Vercel 并连接了数据库！**

如有问题，请提交 Issue 到 GitHub 仓库。
