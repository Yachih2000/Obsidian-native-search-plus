# 原生搜索增强

这是一个 Obsidian 插件，用来增强原生搜索：

1. 可在设置中开启“隐藏笔记名称”，搜索结果只展示匹配结果。
2. 可在设置中开启“选中文本实时搜索”，在当前文档中选中文字后，自动把原生搜索内容更新为选中的文字。

两个功能都只在插件设置中提供开关，不新增或改变 Obsidian 原生搜索面板的 UI 布局。

## 安装

1. 运行 `npm install`。
2. 运行 `npm run build`。
3. 将 `manifest.json`、`main.js`、`styles.css` 复制到你的库目录：`.obsidian/plugins/native-search-plus-cn/`。
4. 在 Obsidian 设置 → 第三方插件中启用“原生搜索增强”。
