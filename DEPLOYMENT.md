# Khateeb PWA deployment

## Required environment variables

- Web host (Vercel or Netlify): `EXPO_PUBLIC_API_URL=https://api.example.com`
- API host: `MOBILE_CORS_ORIGINS=https://app.example.com`
- API host: `REVENUE_DATA_FOLDER=/var/data`

Do not commit `.env` or the Revenue Control data directory. Copy the current
Revenue Control `data` contents to the API host's persistent `/var/data` disk.
This includes `system/app_settings.db`, which keeps the same users, roles, and
permissions as the main system.

## Local run

From the repository root:

```powershell
python -m uvicorn mobile:app --reload --host 0.0.0.0 --port 8004
```

In a second terminal:

```powershell
cd mobile_app
Copy-Item .env.example .env
npm install
npm run web
```

Set `EXPO_PUBLIC_API_URL=http://<computer-ip>:8004` in `.env` when testing from
another device on the same network.

## Vercel

Import `mobile_app` as the project root, add `EXPO_PUBLIC_API_URL`, and deploy.
`vercel.json` runs the Expo web export and serves the SPA routes.

## Netlify

Import `mobile_app`, add `EXPO_PUBLIC_API_URL`, and deploy. `netlify.toml`
contains the build command, publish directory, SPA redirect, and PWA headers.

## Add to iPhone Home Screen

Open the deployed HTTPS URL in Safari, tap Share, choose **Add to Home Screen**,
then tap **Add**. Khateeb opens in standalone full-screen mode from its icon.
