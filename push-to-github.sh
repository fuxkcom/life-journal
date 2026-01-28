#!/bin/bash

# Life Journal GitHub 推送脚本
# 使用方法：将此脚本保存到您的项目根目录，然后运行

echo "🚀 Life Journal GitHub 推送脚本"
echo "================================"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "❌ 错误：当前目录不是正确的Git项目目录"
    echo "请确保您在 life-journal-github 目录下运行此脚本"
    exit 1
fi

# 设置Git配置（如果还没有设置）
echo "📋 检查Git配置..."
if ! git config user.name >/dev/null 2>&1; then
    echo "请设置您的Git用户名："
    read -p "用户名: " username
    git config user.name "$username"
fi

if ! git config user.email >/dev/null 2>&1; then
    echo "请设置您的Git邮箱："
    read -p "邮箱: " email
    git config user.email "$email"
fi

# 检查远程仓库
echo "🔗 检查远程仓库..."
remote_exists=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ 远程仓库已设置: $remote_exists"
else
    echo "📌 添加远程仓库..."
    read -p "GitHub用户名: " github_username
    git remote add origin https://github.com/$github_username/life-journal.git
    echo "✅ 远程仓库已添加"
fi

# 推送到GitHub
echo ""
echo "🚀 开始推送到GitHub..."
echo "如果遇到认证问题，请使用以下方法之一："
echo "1. 使用GitHub Personal Access Token"
echo "2. 使用SSH密钥"
echo "3. 使用GitHub CLI"
echo ""

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "🎉 推送成功！"
    echo "您的项目现在可以在GitHub上访问："
    echo "https://github.com/$github_username/life-journal"
else
    echo ""
    echo "⚠️ 推送失败，请检查以下问题："
    echo "1. 网络连接是否正常"
    echo "2. GitHub认证是否正确"
    echo "3. 远程仓库是否存在"
    echo ""
    echo "请手动运行以下命令："
    echo "git push -u origin main"
fi

echo ""
echo "✅ 脚本执行完成"