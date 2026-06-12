# Database Migrations

Guide to managing IshBor.uz database schema changes via Supabase migrations.

---

## Overview

| Property | Value |
|----------|-------|
| **Location** | `supabase/migrations/` |
| **Count** | 66 migration files |
| **First** | `20240607000000_initial.sql` |
| **Latest** | `20240631150000_launch_security_p1_fixes.sql` |
| **Apply command** | `pnpm db:push` |
| **Verify command** | `pnpm db:verify` |

---

## Naming convention

```
YYYYMMDDHHMMSS_descriptive_snake_case.sql
```

| Part | Example | Meaning |
|------|---------|---------|
| Date | `20240631` | Synthetic dev timeline (June 2024 batch) |
| Time | `150000` | Sub-batch ordering within day |
| Description | `launch_security_p1_fixes` | Purpose in snake_case |

Migrations apply in **lexicographic filename order**.

---

## Migration workflow

```mermaid
flowchart LR
  A["Write SQL migration"] --> B["Test locally"]
  B --> C["pnpm db:push"]
  C --> D["pnpm db:verify"]
  D --> E["Commit to git"]
  E --> F["CI / manual remote push"]
```

### Create a new migration

```bash
# Create file manually (preferred for control)
# supabase/migrations/20240631160000_my_feature.sql
```

```sql
-- Example migration
BEGIN;

CREATE TABLE IF NOT EXISTS public.my_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rows"
  ON public.my_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own rows"
  ON public.my_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
```

### Apply migrations

```powershell
# Link project (one-time)
supabase link --project-ref YOUR_PROJECT_REF

# Push all pending migrations
pnpm db:push

# Verify schema matches
pnpm db:verify
```

### Remote push (CI)

GitHub Actions workflow: `.github/workflows/supabase-db-push.yml` (manual dispatch).

---

## Migration history (key milestones)

| Migration | Description |
|-----------|-------------|
| `20240607000000_initial` | Core schema: profiles, services, orders, messages |
| `20240612000000_payments_escrow` | Payment intents, escrow, transactions |
| `20240614000000_projects` | Projects, applications, contracts |
| `20240616100000_batch1_improvements` | Reviews, notifications, saved items |
| `20240617100000_batch5_features` | Disputes, milestones, ledger |
| `20240619000000_batch3_improvements` | Companies, vacancies, reputation |
| `20240628200000_conversation_stats_rpc` | Chat optimization RPCs |
| `20240629600000_wallet_topup` | Wallet top-up intents |
| `20240629940000_security_advisor_fixes` | Supabase security advisor fixes |
| `20240629960000_enterprise_security` | Enterprise RLS hardening |
| `20240629970000_faq_column` | Service FAQ JSONB column |
| `20240631130000_public_stats_aggregates` | Landing page stats |
| `20240631150000_launch_security_p1_fixes` | Profile PII leak fix, order UPDATE removal |

---

## Idempotency patterns

Later migrations use defensive patterns:

```sql
-- Safe table creation
CREATE TABLE IF NOT EXISTS public.my_table (...);

-- Safe policy replacement
DROP POLICY IF EXISTS "old_policy" ON public.my_table;
CREATE POLICY "new_policy" ON public.my_table ...;

-- Safe column addition
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN new_col text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

---

## Rules & best practices

### Do

- Write forward-only migrations (never edit applied migrations)
- Enable RLS on every new `public` table
- Add policies for SELECT, INSERT, UPDATE, DELETE as needed
- Use `SECURITY DEFINER` functions for privileged operations
- Test locally before pushing to production
- Include rollback notes in migration comments if complex

### Don't

- Edit migrations that have been applied to production
- Grant broad `service_role` access without justification
- Allow client UPDATE on financial tables
- Skip RLS on user-facing tables
- Use `DROP TABLE` without data migration plan

---

## RLS policy template

```sql
-- Read own data
CREATE POLICY "select_own" ON public.my_table
  FOR SELECT USING (auth.uid() = user_id);

-- Insert own data
CREATE POLICY "insert_own" ON public.my_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update own data
CREATE POLICY "update_own" ON public.my_table
  FOR UPDATE USING (auth.uid() = user_id);

-- Backend-only table
CREATE POLICY "service_role_all" ON public.backend_table
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Backend migration checks

FastAPI validates migration status on startup via `migration_checks.py`:

```
GET /api/v1/health/ready
```

Returns migration status in readiness probe response.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration conflict | Check `supabase migration list`; resolve ordering |
| RLS blocks API | Ensure backend uses `service_role` for privileged ops |
| Push fails | Run `supabase db pull` to sync; check for drift |
| Missing migration | Run `pnpm db:push --linked --yes` |
| Local vs remote drift | Compare with `pnpm db:verify` |

---

## Related documents

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [ERD.md](./ERD.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
