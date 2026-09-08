# H Carwash POS

H Carwash POS is a web-based point-of-sale and operations system for H Breakfast to Bar. It supports carwash checkout, service and promotion management, staff assignments and commissions, transaction monitoring, reporting, and role-based access control.

## Features

### Point of sale

- Guided checkout flow for customer, vehicle, service, add-ons, promotion, payment, and staff assignment.
- Supports four-wheel and two-wheel vehicle classifications.
- Stores service and add-on prices as transaction snapshots.
- Supports cash and QR payments.
- Assigns one or more staff members to a transaction.
- Records optional add-on sellers for top-up commission tracking.
- Displays a live queue for pending and in-progress vehicles.
- Allows authorized users to start washing and mark vehicles completed.
- Refreshes the queue after checkout and after status changes.

### Admin dashboard

- Today's revenue and transaction KPIs.
- Cash and QR payment breakdown.
- Active vehicle count.
- Weekly revenue chart.
- Popular services chart.
- Active wash queue.

### Management

- Service and service-size management.
- Inclusion management for service packages.
- Add-on management.
- Promotion management.
- Staff management.
- Transaction history with search and status information.
- Staff commission summaries and recent commission activity.

### Reports

The admin Reports page supports:

- Date presets and custom date ranges.
- Philippine timezone handling using `Asia/Manila`.
- Status, service, payment method, staff, and text search filters.
- Revenue and transaction KPIs.
- Revenue by day and service.
- Payment method breakdown.
- Add-on performance.
- Staff commission summaries.
- Paginated transaction results.
- CSV, Excel, and PDF exports.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Clerk authentication and organization roles
- Supabase database and Realtime
- TanStack Query
- Axios
- Tailwind CSS 4
- Recharts
- React Day Picker
- shadcn-style UI components
- jsPDF and jsPDF AutoTable
- html-to-image
- SheetJS (`xlsx`)
- Lucide icons

## Requirements

- Node.js compatible with the installed Next.js version
- npm
- A Clerk application with organization roles enabled
- A Supabase project

## Local setup

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CLERK_ORGANIZATION_ID=your-clerk-organization-id
```

`NEXT_PUBLIC_BASE_URL` is optional during local development and defaults to `http://localhost:3000`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other package scripts:

```bash
npm run build
npm run start
npm run lint
```

## Authentication and authorization

Authentication is provided by Clerk. Organization roles currently used by the application are:

| Role         | Access                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| `org:admin`  | Admin dashboard, management pages, reports, transactions, commissions, and POS |
| `org:member` | POS checkout, catalog reads, queue access, and transaction status actions      |

The request flow is:

1. `proxy.ts` checks the Clerk session for application routes.
2. Unauthenticated page requests redirect to `/login`.
3. Unauthenticated API requests receive a JSON `401` response.
4. Admin pages under `/admin` require `org:admin`.
5. POS pages under `/pos` require `org:admin` or `org:member`.
6. API handlers call `requireRole()` for route-level authorization.
7. Unauthorized users are sent to `/unauthorized` for page requests.

The shared API authorization helper is located at [app/api/helpers/requireRole.ts](app/api/helpers/requireRole.ts).

Use it in API route handlers like this:

```ts
const authResult = await requireRole("org:admin");
if (authResult.error) return authResult.error;
```

For routes available to both roles:

```ts
const authResult = await requireRole(["org:admin", "org:member"]);
if (authResult.error) return authResult.error;
```

The helper validates the Clerk user, active organization, and allowed organization role.

## Application routes

### Pages

| Route                 | Purpose                          | Access                                   |
| --------------------- | -------------------------------- | ---------------------------------------- |
| `/`                   | Role-aware entry point           | Public entry, redirects based on session |
| `/login`              | Clerk login page                 | Public                                   |
| `/dashboard`          | Legacy role redirect path        | Authenticated users                      |
| `/admin`              | Admin dashboard                  | Admin                                    |
| `/admin/services`     | Service and inclusion management | Admin                                    |
| `/admin/promos`       | Promotion management             | Admin                                    |
| `/admin/staff`        | Staff and commission management  | Admin                                    |
| `/admin/transactions` | Transaction history              | Admin                                    |
| `/admin/reports`      | Reports, analytics, and exports  | Admin                                    |
| `/pos`                | POS checkout and live queue      | Admin and member                         |
| `/unauthorized`       | Access-denied screen             | Public fallback                          |

### API routes

| Endpoint                            | Methods         | Access                           | Purpose                                                        |
| ----------------------------------- | --------------- | -------------------------------- | -------------------------------------------------------------- |
| `/api/services`                     | `GET`, `POST`   | Read: admin/member; write: admin | List and create services                                       |
| `/api/services/[id]`                | `PUT`, `DELETE` | Admin                            | Update or delete services                                      |
| `/api/inclusions`                   | `GET`, `POST`   | Read: admin/member; write: admin | List and create inclusions                                     |
| `/api/add-ons`                      | `GET`, `POST`   | Read: admin; write: admin        | List and create add-ons                                        |
| `/api/add-ons/[id]`                 | `PUT`, `DELETE` | Admin                            | Update or delete add-ons                                       |
| `/api/promos`                       | `GET`, `POST`   | Read: admin/member; write: admin | List and create promotions                                     |
| `/api/promos/[id]`                  | `PUT`           | Admin                            | Update a promotion                                             |
| `/api/staff`                        | `GET`, `POST`   | Read: admin/member; write: admin | List and create staff                                          |
| `/api/staff/[id]`                   | `PUT`, `DELETE` | Admin                            | Update or delete staff                                         |
| `/api/staff/commissions/recent`     | `GET`           | Admin                            | Recent commission activity                                     |
| `/api/staff/commissions/summary`    | `GET`           | Admin                            | Commission totals by staff member                              |
| `/api/transactions`                 | `GET`           | Admin                            | Transaction history with optional status filter                |
| `/api/admin/reports`                | `GET`           | Admin                            | Filtered report data, KPIs, charts, and export rows            |
| `/api/pos/checkout`                 | `POST`          | Admin/member                     | Create a pending transaction with add-ons and staff            |
| `/api/pos/transactions/[id]/status` | `PATCH`         | Admin/member                     | Update transaction status and calculate completion commissions |

All protected API routes return JSON `401` or `403` responses when authorization fails.

## POS checkout flow

The POS form is implemented in [hooks/useCheckoutForm.ts](hooks/useCheckoutForm.ts) and the page is [app/(dashboard)/pos/page.tsx](<app/(dashboard)/pos/page.tsx>).

The checkout process is:

1. Validate customer, plate, service, payment, and staff fields.
2. Calculate the service price.
3. Add selected add-on prices.
4. Apply the selected fixed or percentage promotion.
5. Submit the payload to `/api/pos/checkout`.
6. Create a transaction with `pending` status.
7. Insert transaction add-ons with price and seller snapshots.
8. Insert assigned staff rows.
9. Invalidate React Query transaction data.
10. Clear the form after a successful response.

The checkout API expects the current form payload shape:

```ts
{
  customer_name: string;
  contact_number?: string;
  plate_number: string;
  vehicle_classification: string;
  vehicle_size: string;
  service_id: string;
  service_price: number;
  add_ons?: {
    id: string;
    price: number;
    seller_id?: string | null;
  }[];
  promo?: unknown;
  payment_method: string;
  staff?: string[];
  total_price: number;
}
```

## Transaction statuses and commissions

Supported transaction statuses are:

- `pending`
- `in_progress`
- `completed`
- `cancelled`

When a transaction changes to `completed`:

- `vehicle_out` is set to the current timestamp.
- The current commission rate is `25%`.
- The commission pool is divided among assigned staff.
- Commission amounts and the rate used are stored in `transaction_staff`.

The current commission rate is defined in [app/api/pos/transactions/[id]/status/route.ts](app/api/pos/transactions/%5Bid%5D/status/route.ts). Update the business rule there if commission policy changes.

## Realtime behavior

The POS uses [hooks/useTransactionsRealtime.ts](hooks/useTransactionsRealtime.ts) to subscribe to Supabase Postgres changes on the `transactions` table. Realtime events invalidate React Query keys beginning with `transactions`.

The checkout hook also invalidates the transaction query immediately after a successful checkout. This provides a fast local refresh while Supabase Realtime handles changes made by other clients.

For cross-client updates to work, enable Realtime replication for the `transactions` table in Supabase.

## Data and database expectations

The application currently reads and writes tables including:

- `transactions`
- `services`
- `transaction_add_ons`
- `transaction_staff`
- `staffs`
- `promos`
- `add_ons`
- `inclusions`

Important transaction fields include:

- `order_id`
- `customer_name`
- `contact_number`
- `plate_number`
- `vehicle_classification`
- `vehicle_size`
- `service_id`
- `service_price`
- `total_price`
- `payment_method`
- `status`
- `vehicle_in`
- `vehicle_out`
- `promo`
- `created_at`

The application uses the Supabase anonymous client configured in [lib/supabase.ts](lib/supabase.ts). Database Row Level Security and organization-level data isolation should be reviewed before using the system as a multi-organization product.

## Project structure

```text
app/
  (auth)/login/                 Clerk login page
  (dashboard)/admin/             Admin pages and layout
  (dashboard)/pos/               POS page and checkout flow
  api/                           API route handlers
  unauthorized/                  Access-denied page
  globals.css                    Global styles
  layout.tsx                     Clerk and React Query providers
  page.tsx                       Role-aware application entry point

components/
  dashboard/                     Admin cards, charts, tables, and dialogs
  pos/checkout/                  POS checkout steps and queue sheet
  ui/                            Shared UI primitives

hooks/                           React Query and POS state hooks
lib/                             Supabase and Axios clients
schema/                          Request schema files
types/                            Shared TypeScript data contracts
proxy.ts                         Clerk middleware and route protection
```

## Reporting and timezone rules

Reports interpret date filters using the Philippine timezone, `Asia/Manila`. The report API converts the selected start date to the beginning of that day and uses an exclusive end boundary for the day after the selected end date.

The Reports API calculates:

- Revenue from completed transactions.
- Completed, cancelled, and pending/in-progress counts.
- Average ticket value.
- Revenue by day and service.
- Payment method counts.
- Add-on count and revenue.
- Staff commission totals.

Exports use the active report filters. CSV and Excel exports contain filtered transaction rows. PDF exports include report summaries and visual sections.

## Validation and development checks

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run ESLint:

```bash
npm run lint
```

Build the production bundle:

```bash
npm run build
```

Start the production server after a successful build:

```bash
npm run start
```

Recommended manual checks:

- Sign in as an admin and verify every `/admin` page.
- Sign in as a member and verify that `/admin` redirects to `/unauthorized`.
- Verify members can use `/pos` but cannot call admin mutation APIs.
- Create a transaction and confirm the form clears.
- Confirm the new transaction appears in the POS queue.
- Change a transaction from pending to in-progress to completed.
- Verify commission calculations after completion.
- Test report filters across Philippine midnight boundaries.
- Test empty report results and CSV, Excel, and PDF exports.
- Verify Supabase Realtime updates from a second browser session.

## Known considerations

- Dashboard and transaction screens currently fetch and aggregate transaction history in application code. Large datasets should eventually use bounded queries, database-side aggregation, pagination, or database views/RPCs.
- The current Supabase client uses the public anonymous key. Confirm Supabase RLS policies before production deployment.
- Organization identifiers are validated by Clerk, but database records do not currently document an organization ownership column in this codebase. Multi-tenant isolation requires an explicit database design.
- Some legacy files contain lint warnings or explicit `any` types even though the main POS and RBAC paths are type-checked.
- The application uses `NEXT_PUBLIC_BASE_URL` for Axios requests. Set it to the deployed application URL in production.

## Deployment checklist

1. Configure Clerk production keys, OAuth settings, and organization roles.
2. Configure Supabase production URL, anonymous key, tables, relationships, and RLS.
3. Set `NEXT_PUBLIC_BASE_URL` to the production URL.
4. Enable Supabase Realtime for the `transactions` table.
5. Run `npm run build` in CI or before deployment.
6. Test admin and member access separately.
7. Verify report exports and timezone boundaries.
8. Confirm logs do not expose sensitive transaction data.

## License

No license has been specified for this project.
