# TableReserve

A restaurant booking and staff management platform. Restaurants get their own booking page where customers can reserve tables online. Staff manage bookings from a dashboard, and managers handle shift planning weekly.

---

## Features

### For Customers
- Online table reservation at `/{restaurant-slug}/book`
- Instant booking confirmation
- Cancellation link in confirmation email
- GDPR-compliant — data deleted 30 days after visit

### For Restaurant Staff
- Dashboard to view today's bookings and upcoming reservations
- Confirm, seat, and cancel bookings
- Role-based access — staff only see what they need

### For Managers & Owners
- Full booking management with filters by date and status
- Table management (add, edit, activate/deactivate tables)
- Staff management (add staff, set roles, departments, contract hours)
- Weekly shift planning — staff submit availability, manager generates and releases the plan
- Restaurant settings (operating hours, timezone, locale, currency)
- Automated email notifications via n8n webhooks

### For Platform Admins
- Admin panel at `/admin` to manage all restaurants on the platform
- Create new restaurants, manage subscriptions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Authentication | NextAuth.js (credentials) |
| UI | Tailwind CSS + shadcn/ui + Lucide icons |
| Forms | React Hook Form + Zod |
| Email | Resend |
| Notifications | n8n webhooks |
| Deployment | Vercel / PM2 |

---

## Roles

| Role | Access |
|------|--------|
| `OWNER` | Everything — bookings, tables, staff, shifts, settings |
| `MANAGER` | Bookings, tables, staff, shifts (no settings) |
| `STAFF` | Bookings only (view, confirm, seat, cancel) |

---

## Project Structure

```
src/
├── app/
│   ├── [slug]/book/          # Public customer booking page
│   ├── dashboard/            # Staff/Manager/Owner dashboard
│   │   ├── bookings/         # Booking management
│   │   ├── tables/           # Table management
│   │   ├── staff/            # Staff management
│   │   ├── shifts/           # Shift planning
│   │   └── settings/         # Restaurant settings
│   ├── admin/                # Platform admin panel
│   ├── restaurant-login/     # Login role selector page
│   └── staff-availability/   # Public shift availability form
├── components/
│   └── dashboard/            # Reusable dashboard components
└── lib/
    ├── auth.js               # NextAuth configuration
    ├── tenant.js             # Multi-tenant DB routing
    ├── n8nWebhook.js         # Webhook event helpers
    ├── shiftPlanner.js       # Shift auto-planning algorithm
    └── email.js              # Transactional email helpers
prisma/
├── schema.prisma             # Database schema
└── seed.js                   # Demo data seed
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- n8n instance (optional — for email notifications)

### 1. Clone and install

```bash
git clone https://github.com/your-username/tablereserve.git
cd tablereserve
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_db"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# n8n webhooks (optional)
N8N_WEBHOOK_BASE_URL="https://your-n8n.com/webhook"

# Resend email (optional)
RESEND_API_KEY="re_xxxxxxxxxx"
EMAIL_FROM="bookings@yourdomain.com"

# Encryption key — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY="your_key_here"
```

### 3. Set up the database

```bash
npx prisma db push
npx prisma db seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials (from seed):**
- Owner: `admin@mario.com` / `password123`
- Staff: `giulia@mario.com` / `waiter123`
- Admin panel: `/admin/login`

---

## Deployment

### Option A — Vercel (Recommended for quick start)

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com) → New Project
3. Set all environment variables in Vercel dashboard
4. Deploy

```bash
# After first deploy, run migrations against your DB
npx prisma db push
npx prisma db seed
```

### Option B — Self-hosted with PM2

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "tablereserve" -- start
pm2 save
```

Nginx config example:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## n8n Webhook Events

The platform fires these events to your n8n instance:

| Event | Trigger |
|-------|---------|
| `booking-created` | New booking submitted |
| `booking-status-changed` | Booking confirmed / cancelled |
| `shift-plan-ready` | Shift plan released to staff |
| `shift-shortage` | Not enough staff for a shift |
| `availability-reminder` | Weekly reminder sent to staff |

Set `N8N_WEBHOOK_BASE_URL` in your environment to activate.

---

## Shift Planning Flow

1. Manager sends availability link to staff (via n8n)
2. Staff submit which days they can work via `/staff-availability?token=...`
3. Manager clicks **Generate Plan** in the shifts dashboard
4. Algorithm assigns shifts based on availability, contract hours, and department needs
5. Manager reviews, adjusts if needed, then clicks **Release**
6. n8n sends each staff member their schedule by email/WhatsApp

---

## License

Private project. All rights reserved.
