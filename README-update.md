# Mountain Window Backend Update

Update these files in GitHub:

- Replace `app/page.tsx` with the updated canvas version.
- Add/replace `app/api/weather/route.ts` from this bundle.
- Add/replace `app/api/avalanche/route.ts` from this bundle.

Add this Vercel environment variable:

- `SPOTWX_API_KEY`

Then redeploy.

What changed:

- Weather is now fetched server-side from the SpotWX CSV API.
- The weather route attempts GFS, GEPS, GDPS, RDPS, HRDPS, NAM, HRRR, RAP, ECMWF IFS, and ECMWF AIFS depending on objective region.
- Missing/out-of-range model days are excluded, not treated as zeros.
- Avalanche Canada is fetched live from the point forecast endpoint.
- NWAC is explicitly shown as seasonal/unavailable rather than faked.
- Fake avalanche bulletin histories are no longer used by the updated frontend.
