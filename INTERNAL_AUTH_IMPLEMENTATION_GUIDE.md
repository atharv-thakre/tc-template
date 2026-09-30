# Internal Implementation Guide: Authentication & Authorization Across All Modes & Configs

This internal guide defines the exact architectural patterns, header conventions, cookie handling rules, request interceptor mechanisms, and backend extraction logic required when implementing new routes or integrating with `tc_auth` across all **4 operational modes** and **multiple server configurations**.

---

## 1. The Four Operational Modes Summary

| Mode ID | Token Strategy | Transport / Storage | Backend Resolution | Frontend Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Mode 1** | **Single-Token** | **Local Storage / Header** | Extracts `Authorization: Bearer <token>` | Attach Bearer header; handle 401 by redirecting to login. |
| **Mode 2** | **Dual-Token** | **Local Storage / Header** | Extracts `Authorization: Bearer <token>` & `POST /token/refresh` | Store both tokens; intercept 401, execute silent refresh with mutex queue, replay request. |
| **Mode 3** | **Single-Token** | **HttpOnly Cookies** | Extracts `access_token` cookie or session | Enable `withCredentials: true`; zero JS token handling. |
| **Mode 4** | **Dual-Token** | **HttpOnly Cookies** | Extracts `access_token` & `refresh_token` cookies | Enable `withCredentials: true`; automatic cookie rotation on 401 via `POST /token/refresh`. |

---

## 2. Backend Authentication Extraction Rule

When building or adding new backend routes, authentication must be resolved using a unified helper that checks both headers and cookies to seamlessly support both Local Storage and Cookie transport modes:

```typescript
import { Request } from 'express';

export function getAuthenticatedAccountAndSession(req: Request) {
  // 1. Check Authorization Header (Local Storage Modes 1 & 2)
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Fallback to HttpOnly Cookies (Cookie Modes 3 & 4)
  if (!token && req.cookies) {
    token = req.cookies.access_token || req.cookies.token || req.cookies.jwt;
  }

  // 3. Fallback to query params or session if applicable
  if (!token && req.query && typeof req.query.access_token === 'string') {
    token = req.query.access_token;
  }

  if (!token) {
    return null;
  }

  // Resolve token to account & session...
  return resolveTokenToAccount(token);
}
```

---

## 3. Frontend API Client Pattern (Axios / Fetch)

When implementing new API calls or frontend components, always use the configured `apiClient` or `customFetch` client rather than raw `axios.get` or `fetch`.

### Rule 1: Never Hardcode `/tc-auth`
The backend base URL can be configured dynamically (local dev, custom port, remote staging, or live server). The `apiClient` automatically injects the configured base URL (`getCustomBaseUrl()`) and strips any redundant `/tc-auth` prefixes.

### Rule 2: Request Interceptor (Header Mode)
In Local Storage modes, the request interceptor automatically attaches the Bearer token:
```typescript
const token = localStorage.getItem('tc_auth_access_token') || localStorage.getItem('access_token');
if (token && config.headers) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Rule 3: Response Interceptor (Dual-Token & Cookie Refresh)
When a `401 Unauthorized` is received:
1. Check if a `refresh_token` exists in `localStorage` **OR** if Cookie mode is active.
2. If refreshing is already in progress (`isRefreshing === true`), queue the pending request in `failedQueue`.
3. Call `POST /token/refresh` with `{ refresh_token }` (or empty body for cookie mode).
4. Update stored tokens or accept rotated cookies.
5. Replay all queued requests.
6. If refresh fails, clear tokens, clear cookies, and dispatch `auth:unauthorized` or redirect to `/login`.

---

## 4. Implementing New API Routes: Checklist

When adding a new route to the backend:
1. **Apply Authentication Middleware**:
   ```typescript
   router.get('/your-new-endpoint', (req, res) => {
     const auth = getAuthenticatedAccountAndSession(req);
     if (!auth) {
       return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
     }
     // Route logic...
   });
   ```
2. **Support CORS with Credentials**:
   Ensure `withCredentials: true` is enabled on the client and CORS headers allow credentials on the server.
3. **Handle Redirects with HTTP 307**:
   For OAuth logins, magic links, and auth callbacks, always return `HTTP 307 Temporary Redirect` rather than JSON.
4. **Sanitize Tokens on Client**:
   In OAuth or Magic Link callback handlers (`/oauth/callback`), immediately extract tokens, store them according to the active mode, and strip query parameters using `window.history.replaceState`.
