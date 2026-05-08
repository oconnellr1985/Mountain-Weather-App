Mountain Window update

Files included:
- app/api/weather/route.ts
- app/api/cron/check-alerts/route.ts
- vercel.json.example

This replaces the fake weather backend with a truthful SpotWX CSV backend and adds a minimal daily email-alert cron route.

Important:
- No fake model values are returned. If SpotWX fails, the app shows NO DATA.
- Model rows are limited by expected forecast horizon: RDPS 84h, HRDPS 48h, RAP 21h, HRRR 48h, NAM 84h, etc.
- SpotWX metadata is requested. If model elevation is available, TMP is adjusted to summit elevation using 6.5°C/km.

Required Vercel env vars:
- SPOTWX_API_KEY
- RESEND_API_KEY
- ALERT_FROM_EMAIL
- ALERT_TO_EMAIL
- CRON_SECRET

For Vercel Hobby, use the daily cron schedule in vercel.json.example.
