# NRI Dashboard (frontend)

Admin dashboard for the Aionion Capital NRI (NRE / NRO) account opening flow:
Dashboard, Clients, Payments, IPV Verification, BOID Numbers, User Management
and Audit Logs. React + Vite + Tailwind.

It talks to the dashboard API (a separate Lambda) at `VITE_API_URL`.

## Deploy (AWS Amplify)

1. **Connect this repo** to a new Amplify app. The build settings are in `amplify.yml`.
2. **Environment variable.** Set `VITE_API_URL` to the dashboard Lambda's Function URL, with no trailing `/api`.
3. **Rewrites and redirects.** Add one rule so that refreshing a page works:
   - source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
   - target: `/index.html`
   - type: `200 (Rewrite)`

## Local development

```
npm install
npm run dev      # http://localhost:5180 -- proxies /api to the API on http://localhost:5100
```
