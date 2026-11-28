# 生产环境响应头配置（Cloudflare）

站点当前的部署链路是：**GitHub Pages（源站） → Cloudflare（CDN 反代）**。
GitHub Pages 不允许自定义响应头（它对 `/assets/*` 只给 `max-age=14400`、HTML 给 `max-age=600`），
所以在仓库里放的 `public/_headers`、`vercel.json` 在 **GitHub Pages 上都不会生效**。
真正让下面两类头生效，需要在 **Cloudflare 控制台**配置。配置一次即可，之后一直生效。

> 如果你的 Cloudflare 是「代理（橙云）」模式（当前就是），以下 Transform Rules 都能正常工作。

---

## 1）静态资源长缓存（对应优化项 #1）

目标：带内容哈希的 `/assets/*`（如 `index-wBA6l4lF.js`）改为**一年强缓存 + immutable**，
回访用户不再回源校验，加载更快。HTML 保持较短缓存（保证能拿到新版本）。

**路径：** Cloudflare 控制台 → 你的域名(zone) → Rules → Transform Rules → **Modify Response Header** → Create rule

- **Rule name:** `assets-immutable-cache`
- **When incoming requests match:** Custom filter expression
  ```
  (starts_with(http.request.uri.path, "/assets/"))
  ```
- **Then… Modify response header → Set static:**
  | Header name | Value |
  |---|---|
  | `Cache-Control` | `public, max-age=31536000, immutable` |

保存。

> 备选：也可用 **Cache Rules**（Rules → Cache Rules）匹配 `starts_with(http.request.uri.path, "/assets/")`，
> 把 Edge TTL / Browser TTL 设为 Override 一年。效果等价；上面「改响应头」方式更直观、和 `_headers` 一致。

---

## 2）安全响应头（对应优化项 #5）

**路径：** Rules → Transform Rules → **Modify Response Header** → Create rule

- **Rule name:** `security-headers`
- **When incoming requests match:** All incoming requests（或用表达式 `true`）
- **Then… Modify response header → Set static：**

| Header name | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |

### HSTS
不要在 Transform Rule 里手写 HSTS，用 Cloudflare 专门开关更稳妥：
**SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS) → Enable**，`max-age` 建议先 6 个月，确认无问题再加到 2 年。

### CSP（内容安全策略）—— 请先用「仅报告」模式验证
CSP 配错容易误伤应用（白屏、接口被拦）。建议先用 **`Content-Security-Policy-Report-Only`** 观察 1–2 天：
浏览器控制台若没有 CSP 违规报错，再改成 `Content-Security-Policy`（去掉 `-Report-Only`）正式启用。

针对本站（自托管字体、Supabase 实时、天气/资讯等外部接口）建议的值：

```
default-src 'self';
script-src 'self' https://static.cloudflareinsights.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://ipwho.is https://ipapi.co https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://api.vvhan.com https://api.rss2json.com https://api.allorigins.win https://cloudflareinsights.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

- 先以 `Content-Security-Policy-Report-Only` 这个头名添加；
- 观察浏览器 Console 无违规后，改成 `Content-Security-Policy` 正式生效。
- `style-src 'unsafe-inline'` 是必须的（组件里大量用内联 `style`）；字体因已自托管，`font-src 'self'` 即可，不再需要 `fonts.gstatic.com`。

---

## 3）（可选，长期）迁移到 Cloudflare Pages

如果想进一步简化：把静态站从 GitHub Pages 迁到 **Cloudflare Pages**，
则仓库根/`public` 里的 `_headers`、`_redirects` 会直接被读取，上面的缓存与安全头都写在文件里、随代码版本管理，不必再在控制台点。
但这属于部署链路变更，可另开一轮做。

---

## 验证方式

配置后可用命令行确认响应头是否生效：

```bash
# 资源长缓存
curl -sI https://fuxk.indevs.in/assets/index-xxxx.js | grep -i cache-control
# 应为: cache-control: public, max-age=31536000, immutable

# 安全头
curl -sI https://fuxk.indevs.in/ | grep -iE 'x-content-type-options|x-frame-options|referrer-policy|permissions-policy|strict-transport-security|content-security-policy'
```
