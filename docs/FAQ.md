# Frequently Asked Questions (FAQ)

Developer and user FAQ for IshBor.uz — the Uzbekistan freelance marketplace with escrow payments.

---

## General

### What is IshBor.uz?

IshBor.uz is a freelance marketplace for Uzbekistan — similar to Kwork or Upwork, localized for the Uzbek market. Employers post projects or buy fixed-price services; freelancers deliver work and receive payment through an escrow-protected wallet.

### What languages are supported?

Uzbek (default), Russian, and English. Switch language from the site header or user settings.

### Which regions are supported?

All 14 viloyatlar of Uzbekistan are available in profile and filter settings, defined in `src/domain/constants/regions.ts`.

### Is IshBor.uz live in production?

The platform is in late MVP stage (~75–80% complete). Core marketplace, chat, escrow simulation, and admin panel work in staging/development. Production deployment and live payment providers are pending. See [plan-status.md](../plan-status.md).

---

## For users

### How do I create an account?

1. Go to [ishbor.uz/register](https://ishbor.uz/register) (or `/register` locally)
2. Enter email and password
3. Complete onboarding (role: employer or freelancer)
4. Accept Terms of Service when prompted

### What is the difference between employer and freelancer?

| Role | Can do |
|------|--------|
| **Employer (client)** | Post projects, buy services, hire freelancers, manage orders |
| **Freelancer** | Create services, apply to projects, deliver orders, receive payments |

You select your primary role during onboarding. Some actions are role-specific.

### How do I get verified?

Submit verification documents in Profile → Settings:

- **Identity** — passport or ID (freelancers)
- **Company** — STIR and company documents (employers)
- **Bank account** — for withdrawals

Admin reviews submissions in the verification queue. Approved users receive a verified badge.

### How do payments work?

1. Employer funds an order (wallet balance or payment provider)
2. Funds are held in **escrow** until work is delivered
3. Employer confirms completion (or auto-release after configured period)
4. Funds release to the freelancer's wallet
5. Freelancer withdraws to a verified bank account

> In the current MVP, wallet top-up uses **sandbox mode**. Live Click and Payme integration requires merchant credentials. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

### What currency is used?

All prices and balances are in **Uzbek soʻm** (UZS). Amounts may display as "mln soʻm" for millions. US dollar symbols are not used.

### How do I open a dispute?

From the order detail page in your dashboard, select "Open dispute" when work is not satisfactory. An admin mediates and can release or refund escrow funds.

### How does chat work?

Each order creates a conversation thread. You can also message from the inbox (`/dashboard/messages`). Real-time updates use Supabase Realtime. File attachments are supported via private storage.

### Is two-factor authentication available?

Yes. Enable TOTP 2FA in Profile → Security. You will need an authenticator app (Google Authenticator, Authy, etc.).

### How do I delete my account?

Contact hello@ishbor.uz with your registered email. Account deletion is processed per our [Privacy Policy](./PRIVACY_POLICY.md).

### Who do I contact for support?

| Channel | Contact |
|---------|---------|
| Email | hello@ishbor.uz |
| Telegram | @IshBorUz |
| Help page | `/help` |

---

## For freelancers

### How do I create a service?

1. Dashboard → Services → Create
2. Fill title, description, category, price (soʻm), delivery time
3. Add packages (optional tiers)
4. Publish — service may enter moderation pending admin approval

### How do I set my public profile URL?

Set a username in profile settings. Your public page will be at `/freelancer/{username}`.

### When do I get paid?

After the employer confirms order completion, escrow funds release to your wallet. You can then request withdrawal to a verified bank account.

### What is the platform commission?

Commission rates are defined in domain constants and may vary by service type. Check the order receipt for the exact fee breakdown at purchase time.

---

## For employers

### How do I post a project?

Go to `/post-project`, describe your requirements, set budget and deadline, and publish. Freelancers apply; you review applications and hire.

### How do I buy a fixed-price service?

Browse `/services`, select a service and package, and place an order. Payment is held in escrow until you confirm delivery.

### Can I hire directly from a freelancer profile?

Yes. View the freelancer's services from their public profile and place an order, or invite them to a posted project.

---

## For developers

### What is the tech stack?

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui |
| Backend | FastAPI (Python 3.12), Uvicorn |
| Database | Supabase (PostgreSQL 15+), RLS |
| Auth | Supabase Auth (JWT) |
| Payments | Click, Payme (sandbox); escrow simulation |
| Tests | Vitest, pytest, Playwright |

Full inventory: [TECH_STACK.md](./TECH_STACK.md)

### How is the codebase organized?

Clean Architecture under `src/`:

- `domain/` — entities, constants (framework-free)
- `application/` — providers, app state
- `infrastructure/` — i18n, API client, Supabase
- `presentation/` — UI components and features

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

### How do I run the project locally?

```powershell
# Prerequisites: Node 22, pnpm 9, Python 3.12, Supabase CLI

pnpm install
cd backend ; python -m venv .venv ; .venv\Scripts\pip install -r requirements.txt ; cd ..

# Configure .env.local and backend/.env (see .env.example files)

pnpm dev:start    # migrations + frontend (:3000) + backend (:8002)
```

### Frontend vs backend — who handles what?

| Concern | Handler |
|---------|---------|
| Login, register, session | Frontend → Supabase Auth |
| File upload (avatar, chat) | Frontend → Supabase Storage |
| Realtime (chat, notifications) | Frontend → Supabase Realtime |
| Business logic (orders, payments, admin) | Frontend → FastAPI backend |
| Database writes (financial) | Backend → Supabase (service_role) |

Details: [architecture-supabase-vs-api.md](./architecture-supabase-vs-api.md)

### How do I add a new page?

1. Add route in `app/(main)/`
2. Create feature in `src/presentation/features/{feature}/`
3. Add `PATHS` entry in `src/domain/constants/routes.ts`
4. Add i18n keys in `uz`, `ru`, `en`
5. Protect with `AuthGuard` if dashboard route

### How do I add an API endpoint?

1. Add router handler in `backend/app/routers/`
2. Use `run_query` wrapper for Supabase calls
3. Add pytest test in `backend/tests/`
4. Add client method in `src/infrastructure/api/client.ts`

See [skills/ishbor-backend/SKILL.md](../skills/ishbor-backend/SKILL.md).

### How do I run tests?

```powershell
pnpm test              # Vitest
pnpm test:backend      # pytest
pnpm test:e2e          # Playwright
pnpm verify            # Full pre-merge check
```

See [TESTING.md](./TESTING.md).

### How do I apply database migrations?

```powershell
pnpm db:push
pnpm db:verify
```

### Why does my protected page show empty data after login?

Auth race condition — the page fetched before the session was ready. Use `useAuthReady()` and `useProtectedLoader()`. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### How do I become an admin locally?

```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

Run in Supabase SQL editor.

### Where are design tokens?

Figma tokens: `design/figma-tokens.json` → compiled to `src/presentation/styles/tokens.css`. Primary color: `#2563EB`.

---

## Payments FAQ

### Which payment providers are supported?

| Provider | Status |
|----------|--------|
| Platform wallet (sandbox top-up) | ✅ Working |
| Escrow hold/release/refund | ✅ Simulation working |
| Click (live) | ⬜ Merchant credentials required |
| Payme (live) | ⬜ Merchant credentials required |

### Can I test payments without real money?

Yes. Use sandbox wallet top-up in the wallet dashboard. Escrow flows work end-to-end in sandbox mode.

---

## Legal & privacy FAQ

### Where are Terms and Privacy Policy?

- Terms: `/terms` — [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- Privacy: `/privacy` — [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- Compliance overview: [COMPLIANCE.md](./COMPLIANCE.md)

### Where is my data stored?

User data is stored in Supabase (PostgreSQL), hosted in a cloud region configured for the project. See [COMPLIANCE.md](./COMPLIANCE.md) for Uzbekistan data localization notes.

---

## Related documents

- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Current limitations
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Dev problem solving
- [BUG_REPORTING.md](./BUG_REPORTING.md) — Report a bug
- [mvp.md](../mvp.md) — MVP scope and priorities
