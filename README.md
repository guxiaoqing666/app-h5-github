# 小满上岸计划

一个给家庭自用的公职/事业编备考 H5：学习计划、每日打卡、考试倒计时、目标单位和个人档案。

## 本地运行

```bash
npm.cmd install
npm.cmd run dev
```

不配置 Supabase 时会进入本地预览模式，数据保存在当前浏览器里。

## Supabase 云同步

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 复制 `.env.example` 为 `.env.local`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
4. 重新运行 `npm.cmd run dev`。

密码 svynd8jU7UsrnHMO

Supabase anon key 可以放在前端，数据隔离由 Row Level Security 策略控制。

## GitHub Pages 发布

1. 把仓库推送到 GitHub。
2. 在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Settings -> Pages 选择 GitHub Actions。
4. 推送到 `main` 分支后自动构建发布。

## 常用命令

```bash
npm.cmd run build
npm.cmd run preview
```
