#!/bin/bash

# 安装依赖
npm install

# 运行构建命令
npx roamjs-scripts build --depot

# 获取东八区当前时间
BUILD_TIME=$(TZ="Asia/Shanghai" date +"%Y-%m-%d %H:%M:%S %Z")

# 创建一个 index.html 文件
cat <<EOF > index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Build Time</title>
</head>
<body>
    <h1>Last Build Time: $BUILD_TIME</h1>
</body>
</html>
EOF

# 输出一些信息
echo "Index.html with build time created."
