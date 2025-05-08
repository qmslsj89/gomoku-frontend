### 移除现有的 .git 文件夹及其所有内容，包括子文件夹和文件。
### 这个操作会删除当前项目的 Git 仓库历史记录，请谨慎使用。
### 如果你只是想重置仓库状态而不是移除历史，可以考虑其他 Git 命令。
```powershell
Remove-Item -Recurse -Force .git
```

### 初始化一个新的 Git 仓库。这会在当前目录创建一个 .git 文件夹，
### 用于跟踪项目中的文件更改和版本历史。
```bash
git init
```

### 配置 Git 以自动转换行尾符（Line Ending）。当在 Windows 系统上检出文件时，
### Git 会将行尾符转换为 CRLF（回车换行），而在提交时会转换为 LF（换行）。
### --global 标志表示这个设置会被应用到用户的所有的 Git 仓库中。
### 注意：如果你希望保持仓库中的行尾格式不变，或者项目只会在使用 LF 行尾的系统上运行，
### 可以将 core.autocrlf 设置为 'input' 或 'false'。
```bash
git config --global core.autocrlf true
```

### 将当前目录下的所有文件添加到暂存区（staging area）。
### 这意味着你准备将这些文件的最新版本包含在下一个提交中。
### 被 .gitignore 文件忽略的文件不会被添加。
```bash
git add .
```

### 创建一个新提交，将暂存区的所有更改永久保存到 Git 仓库的历史记录中。
### -m 参数后面跟着的是提交信息，这里的信息是 "Initial commit"，
### 通常用于第一次提交，表示这是项目的初始版本。
```bash
git commit -m "Initial commit"
```

### 添加一个名为 'origin' 的远程仓库，指向给定的 GitHub 仓库 URL。
### 这里的 URL 是一个 SSH 格式的地址，需要确保你已经在 GitHub 上配置了 SSH 密钥。
### 'origin' 是默认的远程仓库名称，当你克隆一个仓库时，Git 会自动将其命名为 'origin'。
```bash
git remote add origin git@github.com:qmslsj89/gomoku-frontend.git
```

### 将本地的 'main' 分支推送到名为 'origin' 的远程仓库。
### -u 参数设置了上游分支，这样以后就可以简单地使用 `git push` 和 `git pull`
### 而不需要指定远程和分支名称。
### --force 强制推送，即使这会导致远程仓库的历史记录被改写。
### **警告**：使用 --force 可能会导致远程仓库丢失提交，应该谨慎使用，
### 特别是在团队协作环境中。如果你不确定是否要使用 --force，可以先尝试不带此参数进行推送。
```bash
git push -u origin main --force
Remove-Item -Recurse -Force .git
git init
git config --global core.autocrlf true
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:qmslsj89/gomoku-frontend.git
git push -u origin main --force
```

### 从远程仓库拉取最新的更改
```bash
git pull origin main
```
### 强制覆盖本地更改
```bash
git fetch origin
git reset --hard origin/main
```

### 前端启动指令
前端启动指令：
```bash
npm run serve
```

### 后端项目文件夹打包压缩为 .zip 文件的指令
```bash
zip -r gomoku-backend.zip ~/gomoku-backend
```

### 后端启动脚本指令
运行以下命令启动后端服务：
```bash
bash ~/gomoku-backend/startMyGame.sh
```

