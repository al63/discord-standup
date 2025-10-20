# Discord Activity: Getting Started Guide

Standup discord activity:

- Setup a `.env` file at repo root with necessary secrets
- Run app and server in respective directories `npm install` -> `npm run dev`
- In Discord developer dashboard, update Activities -> URL Mappings -> Root Mapping to a publicly accessible URL that reverse proxies to our local app. Easiest is to install cloudflared and `cloudflared tunnel --url http://localhost:5173`.

