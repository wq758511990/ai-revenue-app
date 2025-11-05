# TabBar 图标配置指南

## 问题说明
当前 TabBar 图标显示为空白，需要替换为清晰可见的图标。

## 解决方案

### 方案一：使用 Iconfont（推荐）

1. 访问 [Iconfont](https://www.iconfont.cn/)
2. 搜索并下载以下图标：
   - **首页图标**：搜索 "home" 或 "房子"
   - **个人中心图标**：搜索 "user" 或 "人像"

3. 下载要求：
   - 尺寸：81x81 像素
   - 格式：PNG
   - 颜色：
     - 未选中：#999999（灰色）
     - 选中：#667eea（紫蓝色）

4. 将下载的图标重命名并替换到 `src/static/icons/` 目录：
   - `home.png` - 首页（未选中）
   - `home-active.png` - 首页（选中）
   - `profile.png` - 我的（未选中）
   - `profile-active.png` - 我的（选中）

### 方案二：在线图标资源

可以从以下网站下载免费图标：

1. **IconPark**：https://iconpark.oceanengine.com/
   - 字节跳动出品，质量高
   - 支持在线调整颜色和大小

2. **RemixIcon**：https://remixicon.com/
   - 简洁现代的图标库
   - 可直接下载 PNG

3. **Feather Icons**：https://feathericons.com/
   - 轻量级线条图标
   - 适合小程序使用

### 方案三：使用临时方案

在获取到合适图标之前，可以修改 `pages.json` 使用 emoji 作为临时图标：

```json
"tabBar": {
  "color": "#666666",
  "selectedColor": "#667eea",
  "backgroundColor": "#FFFFFF",
  "list": [
    {
      "pagePath": "pages/index/index",
      "text": "🏠首页"
    },
    {
      "pagePath": "pages/profile/profile",
      "text": "👤我的"
    }
  ]
}
```

注意：去掉 `iconPath` 和 `selectedIconPath` 字段，emoji 会直接显示。

## 推荐图标样式

- **首页**：房子轮廓、首页图标
- **我的**：人像轮廓、用户图标

## 技术规范

- **尺寸**：81x81 像素（推荐）或 40x40 像素（最小）
- **格式**：PNG（支持透明背景）
- **大小**：< 40KB
- **颜色要求**：
  - 未选中状态：浅灰色（#999999）
  - 选中状态：品牌色（#667eea）

## 快速测试

替换图标后，运行以下命令重新编译：

```bash
cd frontend
npm run dev:mp-weixin
```

在微信开发者工具中查看效果。

