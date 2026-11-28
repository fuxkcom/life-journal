# 字体策略说明

## 现行方案：系统原生中文字体（零下载）

`src/index.css` 与 `tailwind.config.js` 里的字体栈都优先使用**操作系统自带的中文字体**：

| 用途 | 字体栈（优先→回退） |
|---|---|
| 正文/UI（sans） | 苹方 PingFang SC · 冬青黑 Hiragino Sans GB · 微软雅黑 Microsoft YaHei · Noto Sans SC · system-ui … |
| 标题（serif） | 宋体-简 Songti SC · STSong · Noto Serif SC · 宋体 SimSun · Georgia … |
| 手写点缀（hand） | 楷体-简 Kaiti SC · STKaiti · KaiTi · cursive |

**为什么这么做（而不是自托管 Noto / 行书字体）：**
- 中文字体体积巨大：一套 CJK 变量字体拆分成 ~100 个 unicode-range 分片后，
  `@font-face` 声明会让主 CSS 从约 8KB 膨胀到约 **150KB(gzip)**，且是**渲染阻塞**的。
  对一个重速度、面向中国大陆用户的站点，这是净负担。
- 系统自带的苹方 / 微软雅黑 / 宋体 / 楷体本身质量很高，**零字节、秒渲染、无跨墙风险**。
- 之前的 Google Fonts 在中国大陆经常被墙，加载失败反而回退系统字体——现在直接把系统字体作为首选，行为稳定可预期。

## 若确实想还原 Noto Serif SC / Zhi Mang Xing 品牌字体（可选）

在**不在意首屏体积**、更看重品牌一致性时，可以自托管（仍不依赖 Google Fonts）：

```bash
pnpm add @fontsource-variable/noto-sans-sc @fontsource-variable/noto-serif-sc @fontsource/zhi-mang-xing
```

在 `src/main.tsx` 顶部加入：

```ts
import '@fontsource-variable/noto-sans-sc'
import '@fontsource-variable/noto-serif-sc'
import '@fontsource/zhi-mang-xing'
```

并把 `tailwind.config.js` 与 `src/index.css` 里的字体栈改为以
`'Noto Sans SC Variable'`、`'Noto Serif SC Variable'`、`'Zhi Mang Xing'` 开头。
（注意：变量字体包对外暴露的 family 名带 `Variable` 后缀。）

权衡：首屏会多加载约 100–150KB(gzip) 的字体 CSS，字体文件再按 unicode-range 按需下载。
