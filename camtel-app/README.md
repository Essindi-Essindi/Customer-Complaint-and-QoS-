# CAMTEL Customer Complaint & QoS Tracking Platform

Complete React + TypeScript frontend for CAMTEL complaint management.

## Stack

- React 19 + TypeScript
- React Router v7 (compatible with v6 API)
- Plain CSS (single `index.css`)
- Mock data & async placeholders (no backend)

## Quick start

```bash
cd camtel-app
npm install
npm run dev
```

Open http://localhost:5173

## Demo credentials

| Role       | Email / Phone      | Password  |
|------------|--------------------|-----------|
| Subscriber | `0600000000`       | `password`|
| Agent      | `agent@camtel.cm`  | `agent`   |
| Manager    | `manager@camtel.cm`| `manager` |

## Routes

### Public
- `/register` — Account creation
- `/login` — Subscriber login
- `/internal/login` — Staff login

### Subscriber (auth required)
- `/submit-complaint`
- `/my-complaints`
- `/my-complaints/:ticketNumber`

### Agent
- `/agent/complaints`

### Manager
- `/manager/dashboard`
- `/manager/heatmap`
- `/manager/kpis`
- `/manager/reports`
- `/manager/users`
- `/manager/config`

## Features implemented

- Auth context with role-based ProtectedRoute
- Client-side form validation
- Status badges, progress steps, star ratings
- Modals for ticket update / user CRUD / config
- Toast notifications (auto-dismiss 3s)
- Offline draft banner, CAPTCHA placeholders
- KPI cards, filter bars, chart placeholders
- Heat map region cards + breakdown panel
- Report generation with loading spinner
- User management with conditional fields by role
- Complaint categories + notification templates

All 13 pages are navigable with mock data.
