# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all dev servers together (Laravel + queue + logs + Vite)
composer run dev

# Frontend only
npm run dev

# Production build
npm run build

# Run migrations
php artisan migrate

# Run migrations with seeders (sets up system_status table)
php artisan migrate --seed

# Run tests
php artisan test

# Run a single test file
php artisan test tests/Feature/ExampleTest.php
```

## Architecture Overview

### Stack
- **Laravel 12** + **Inertia.js** (no separate API — pages and JSON endpoints share the same web routes)
- **React 18** (JSX, no TypeScript) with **Vite**
- **ShadCN** (New York style, `components.json` configured) + **Tailwind CSS** + **DaisyUI**
- **Zustand** for global state, **react-hook-form** for form handling, **sonner** for toasts

### Route Structure
All web routes live under a prefix equal to `APP_NAME` (currently `Medical`). Routes are split across:
- `routes/web.php` — entry point, includes the files below
- `routes/auth.php` — SSO logout, unauthorized page
- `routes/general.php` — all authenticated routes (dashboard, profile, admin, inventory)

Every authenticated route goes through `AuthMiddleware` (see below). Admin-only routes also go through `AdminMiddleware`.

Named routes follow the pattern `inventory.index`, `inventory.store`, etc. Use `route('name')` in PHP and `route('name')` via Ziggy in React.

### Authentication (SSO via Authify)
There is **no local login**. `AuthMiddleware` handles all auth by:
1. Reading a token from query string (`?key=`), cookie (`sso_token`), or session
2. Validating it against the `authify` database connection (`authify_sessions` table)
3. Storing employee data in `session('emp_data')` — this is what every page reads

The `emp_data` session object is shared to all Inertia pages via `HandleInertiaRequests`. Access it in React with `usePage().props.emp_data`. It contains `emp_id`, `emp_name`, `emp_dept_id`, etc.

To redirect unauthenticated users, the middleware redirects to `http://127.0.0.1:8001/login?redirect=<url>` (Authify service).

### Multiple Database Connections
Three MySQL connections are defined:
| Connection key | Database | Used for |
|---|---|---|
| `mysql` (default) | `medical` | Application data — inventory, system status |
| `masterlist` | `masterlist` | HRIS employee master list |
| `authify` | `authify` | SSO sessions (read-only, managed by Authify service) |

When using Eloquent, models use the default `mysql` connection unless `protected $connection` is set. When using `DB::connection('authify')` or `DB::connection('masterlist')`, always query read-only — those are external-owned databases.

### Backend Pattern: Controller → Service → Repository
New features should follow this pattern:
- **Repository** — all Eloquent queries, no business logic. Lives in `app/Repositories/`.
- **Service** — business logic, data transformation, orchestration. Lives in `app/Services/`. Injected into controllers via constructor.
- **Controller** — validates the request, calls the service, returns `Inertia::render()` or `response()->json()`.

For pages that serve both an Inertia view and JSON data (like Inventory), the controller has a separate `data()` method returning JSON — the React page calls it via `fetch`/axios after mount.

### Frontend Data Fetching
Pages do **not** receive table data as Inertia props. Instead:
- The Inertia page renders the shell immediately
- A custom hook (`useInventoryData`, etc.) fetches from the JSON endpoint via `window.axios`
- CSRF is handled automatically — `bootstrap.js` puts axios on `window.axios` with `X-Requested-With` set; axios reads the `XSRF-TOKEN` cookie itself. Always use `window.axios`, never raw `fetch`, to get this for free.
- Always reference endpoints via Ziggy's `route('name')` / `route('name', { id })` — never hardcode URL strings. Ziggy is available globally as `route()` in all React components and hooks.
- `AbortController` is passed via `signal` to axios to cancel stale requests on rapid filter changes; check with `axios.isCancel(err)` before handling the error

### Frontend Component Conventions
Path alias `@` maps to `resources/js/`. ShadCN components live in `resources/js/Components/ui/`. **Not all ShadCN components are installed** — only what has been added manually. Before using a ShadCN component, check if the file exists in `resources/js/Components/ui/`. Currently present: `alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `table`, `textarea`, `tooltip`.

The `select.jsx` and `checkbox.jsx` are **custom implementations** (no `@radix-ui/react-select` or `@radix-ui/react-checkbox` installed). The `sheet.jsx` is built on top of `@radix-ui/react-dialog`.

Page-specific components, hooks, and helpers live co-located with the page:
```
Pages/FeatureName/
  FeatureName.jsx          ← Inertia page component
  components/              ← sub-components
  hooks/                   ← data/state hooks
  helpers/                 ← pure utility functions
```

### Theming
Dark/light mode is driven by `next-themes` via `ThemeProvider` in `app.jsx`. The `ThemeContext` is also exposed for components that need direct theme access. CSS variables for all ShadCN tokens are defined in `resources/css/app.css`. To change the primary color, edit the `--primary` HSL variable in that file.

### Sidebar & Navigation
`AuthenticatedLayout` wraps every authenticated page. To add a new navigation link, edit `resources/js/Components/sidebar/Navigation.jsx` — add a `<SidebarLink>` with a `lucide-react` icon and a Ziggy `route()` call.

### System Maintenance Mode
A custom maintenance system (separate from Laravel's built-in) lives in `SystemStatus` model / `SystemStatusService`. When enabled, `AuthMiddleware` intercepts every request and renders the `Maintenance` Inertia page. Bypass routes (logout, system-status toggles) are whitelisted in `AuthMiddleware::isBypassRoute()`.
