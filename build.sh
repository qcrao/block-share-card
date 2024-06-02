#!/bin/bash

# 安装依赖
npm install

# 运行构建命令
npx roamjs-scripts build --depot

# 获取东八区当前时间
BUILD_TIME=$(TZ="Asia/Shanghai" date +"%Y-%m-%d %H:%M:%S %Z")

# 输出构建时间（可选）
echo "Build completed at: $BUILD_TIME"