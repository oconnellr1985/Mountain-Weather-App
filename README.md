# Mountain Window App

A deployable Next.js app for alpine / ski weather-window monitoring.

## What works now

- Live Open-Meteo forecast/archive fetch through backend API route
- Explicit summit / mid / valley elevation requests
- Route-specific 3-day window scoring
- Model availability/raw model table
- NO DATA fail-safe when live data fails
- Real test alert route using Resend + Twilio
- Vercel Cron route for scheduled checks

## What is still intentionally limited

- Avalanche Canada / NWAC bulletins are not wired yet.
- Alert rules are environment-variable based, not user-saved in a database yet.
- RAP / GEPS are listed as future backend connectors.
- This is decision support only; it is not a go/no-go safety tool.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Required environment variables

Set these in Vercel Project Settings → Environment Variables:

```env
RESEND_API_KEY=
ALERT_FROM_EMAIL=
ALERT_TO_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_PHONE=
ALERT_TO_PHONE=
CRON_SECRET=
ALERT_CLIMB_ID=adams-sw-chutes
ALERT_MIN_QUALITY=8
ALERT_MIN_CONFIDENCE=5.5
```

## Deployment steps

1. Create a new GitHub repository, for example `mountain-window-app`.
2. Upload/push all files in this folder to that repository.
3. In Vercel, click Add New → Project → Import this GitHub repo.
4. Add the environment variables listed above.
5. Deploy.
6. Visit the deployed app and click `Send test alert`.
7. Check `/api/check-alerts?secret=YOUR_CRON_SECRET` manually once in the browser.
8. Vercel Cron will then run every 6 hours using `vercel.json`.

## Testing the alert providers

The Send test alert button calls:

```http
POST /api/send-test-alert
```

It sends both email and SMS using your Vercel environment variables.

## Cron alert logic

The cron route checks the objective set by `ALERT_CLIMB_ID`. If the best window quality and confidence exceed your thresholds, it sends a combined email/SMS alert.

```http
GET /api/check-alerts?secret=YOUR_CRON_SECRET
```
