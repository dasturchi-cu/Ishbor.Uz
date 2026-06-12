# Privacy Policy

**IshBor.uz** — Freelance Marketplace  
**Effective date:** [DATE]  
**Last updated:** June 2026  
**Version:** 1.0 (template — requires legal review before publication)

> **Legal notice:** This document is a template prepared for IshBor.uz engineering and product teams. It must be reviewed and approved by qualified legal counsel familiar with Uzbekistan law before publication at `/privacy`. Replace bracketed placeholders before go-live.

---

## 1. Introduction

IshBor.uz ("**we**", "**us**", "**Platform**") operates a freelance marketplace and escrow payment platform serving users in the Republic of Uzbekistan and internationally. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use our website, mobile experiences, and related services (collectively, the "**Services**").

By registering for or using the Services, you acknowledge that you have read this Privacy Policy. Where required by law, we will obtain your explicit consent for specific processing activities.

**Data controller:**  
IshBor.uz  
Email: hello@ishbor.uz  
Address: [REGISTERED ADDRESS, TASHKENT, UZBEKISTAN]

---

## 2. Scope

This policy applies to:

- Visitors browsing public pages (landing, catalog, freelancer profiles)
- Registered users (employers and freelancers)
- Admin and support personnel
- Payment and verification processes
- Communications via email, SMS, and in-platform chat

This policy does **not** apply to third-party websites linked from our Platform (e.g., payment provider checkout pages). Those services have their own privacy policies.

---

## 3. Legal basis (Uzbekistan context)

We process personal data in accordance with:

- The Law of the Republic of Uzbekistan **"On Personal Data"** (LZhDP, as amended)
- Other applicable Uzbek legislation on electronic commerce, consumer protection, and information security
- Contractual necessity to provide the Services you request

Depending on the processing activity, our legal bases include:

| Basis | Examples |
|-------|----------|
| **Contract performance** | Account creation, order fulfillment, escrow, payouts |
| **Legal obligation** | Tax reporting, fraud prevention, lawful government requests |
| **Legitimate interests** | Platform security, analytics, service improvement |
| **Consent** | Marketing emails, optional cookies, non-essential communications |

See [COMPLIANCE.md](./COMPLIANCE.md) for regulatory context.

---

## 4. Data we collect

### 4.1 Information you provide

| Category | Examples | Purpose |
|----------|----------|---------|
| **Account data** | Full name, email, password (hashed), phone number, role (employer/freelancer) | Registration, authentication |
| **Profile data** | Bio, avatar, region (viloyat), skills, portfolio, public username/slug | Marketplace visibility |
| **Identity verification** | Passport/ID images, selfie, company STIR, registration documents | Trust & safety, KYC |
| **Financial data** | Bank account (MFO, account number), wallet balance, transaction history | Escrow, withdrawals |
| **Service & project content** | Service listings, project descriptions, proposals, contracts | Marketplace operations |
| **Communications** | Chat messages, file attachments, support tickets | Order collaboration |
| **Reviews & ratings** | Text reviews, star ratings | Reputation system |

### 4.2 Information collected automatically

| Category | Examples | Purpose |
|----------|----------|---------|
| **Device & browser** | IP address, user agent, OS, screen size | Security, fraud prevention |
| **Usage data** | Pages visited, search queries, click patterns | Analytics, product improvement |
| **Session data** | Login timestamps, session tokens (JWT) | Authentication |
| **Error logs** | Stack traces, API errors (via Sentry) | Debugging, reliability |

### 4.3 Information from third parties

| Source | Data | Purpose |
|--------|------|---------|
| **Supabase Auth** | Authentication events, email verification status | Identity management |
| **Click / Payme** | Payment confirmation, transaction IDs | Payment processing |
| **Eskiz.uz (SMS)** | Delivery status of OTP messages | Phone verification |
| **Cloudflare Turnstile** | Bot detection signals | Abuse prevention |
| **Telegram** (if linked) | Telegram user ID | Notification preferences |

We do **not** sell your personal data to third parties.

---

## 5. How we use your data

We use collected data to:

1. **Provide the Services** — create accounts, match employers with freelancers, process orders
2. **Process payments** — escrow hold/release, wallet top-up, withdrawals
3. **Verify identity** — KYC review, company STIR validation, bank account verification
4. **Communicate** — order updates, security alerts, verification status, support responses
5. **Ensure safety** — fraud detection, dispute resolution, ban/suspend enforcement
6. **Improve the Platform** — analytics, A/B testing, performance monitoring
7. **Comply with law** — respond to lawful requests, maintain audit logs
8. **Marketing** (with consent) — newsletters, feature announcements

---

## 6. Data sharing

We share personal data only as necessary:

| Recipient | Purpose | Safeguards |
|-----------|---------|------------|
| **Infrastructure providers** | Hosting (Vercel), database (Supabase) | Data processing agreements |
| **Payment processors** | Click, Payme | PCI-compliant checkout; we do not store card numbers |
| **SMS provider** | Eskiz.uz OTP delivery | Phone number only |
| **Email provider** | Resend transactional email | Email address only |
| **Error monitoring** | Sentry | PII scrubbing configured |
| **Analytics** | Vercel Analytics | Aggregated usage data |
| **Law enforcement** | Legal compliance | Only upon valid legal process |
| **Other users** | Public profile, reviews, service listings | Data you choose to publish |

We require processors to handle data only per our instructions and applicable law.

---

## 7. Data storage and localization

### 7.1 Where data is stored

Personal data is stored in:

- **Supabase (PostgreSQL)** — primary user and transaction database
- **Supabase Storage** — avatars, verification documents, chat attachments (private buckets)
- **Application servers** — transient processing; no persistent local storage of PII

Hosting regions are configured in our Supabase and Vercel project settings. [SPECIFY REGION — e.g., EU or nearest available region].

### 7.2 Uzbekistan localization

Under Uzbek personal data law, certain categories of personal data of Uzbek citizens may be subject to **localization requirements** (storage on servers located in Uzbekistan). Before processing data of Uzbek residents at scale, we will:

- Assess whether our data categories trigger localization obligations
- Implement local storage or certified cross-border transfer mechanisms as advised by counsel
- Document cross-border transfers in our compliance register

See [COMPLIANCE.md](./COMPLIANCE.md) for details.

### 7.3 Retention periods

| Data type | Retention |
|-----------|-----------|
| Account data | Duration of account + [X] years after deletion request |
| Order & transaction records | [7] years (tax/audit requirements) |
| Chat messages | Duration of account + [X] years, or as required for disputes |
| Verification documents | Until verification decision + [X] years |
| Server logs | [90] days |
| Analytics (aggregated) | [26] months |

After retention periods, data is deleted or anonymized unless legal hold applies.

---

## 8. Security measures

We implement technical and organizational measures including:

- **Encryption in transit** — TLS 1.2+ for all connections
- **Encryption at rest** — Supabase managed encryption
- **Access control** — Row Level Security (RLS) on database tables
- **Authentication** — Supabase JWT, optional TOTP 2FA, phone OTP
- **Role-based access** — Admin hierarchy with audit logging
- **Escrow isolation** — Financial operations via service-role with immutable ledger triggers
- **Rate limiting** — API abuse prevention
- **Webhook verification** — Signed payment callbacks
- **Private storage** — Chat attachments via signed URLs, not public buckets

No system is 100% secure. Report vulnerabilities to hello@ishbor.uz with subject `[SECURITY]`. See [SECURITY.md](../SECURITY.md).

---

## 9. Your rights

Subject to Uzbek law and applicable regulations, you may have the right to:

| Right | How to exercise |
|-------|-----------------|
| **Access** | Request a copy of your personal data |
| **Correction** | Update profile in Settings or contact support |
| **Deletion** | Request account deletion via hello@ishbor.uz |
| **Restriction** | Request limited processing during disputes |
| **Portability** | Request export of your data in machine-readable format |
| **Objection** | Object to marketing or certain legitimate-interest processing |
| **Withdraw consent** | Unsubscribe from marketing; disable optional features |

We will respond within **[30]** days. Identity verification may be required.

**Account deletion note:** Some data (transaction records, dispute evidence) may be retained as required by law even after account deletion.

---

## 10. Cookies and tracking

| Type | Purpose | Control |
|------|---------|---------|
| **Essential** | Session, authentication, security (Turnstile) | Required for Service |
| **Analytics** | Vercel Analytics — page views, performance | Can be disabled via browser |
| **Preferences** | Language, theme | Stored locally |

We do not use third-party advertising cookies at launch. If this changes, we will update this policy and request consent where required.

---

## 11. Children's privacy

The Services are not directed to individuals under **[18]** years of age. We do not knowingly collect data from children. If you believe a child has provided us data, contact hello@ishbor.uz and we will delete it.

---

## 12. International transfers

If data is processed outside Uzbekistan, we ensure appropriate safeguards:

- Standard contractual clauses with processors
- Assessment of recipient country data protection level
- Documentation per LZhDP cross-border transfer requirements

---

## 13. Changes to this policy

We may update this Privacy Policy to reflect legal, technical, or business changes. Material changes will be notified via:

- Email to registered users
- Prominent notice on the Platform
- Updated "Last updated" date

Continued use after changes constitutes acceptance where permitted by law.

---

## 14. Contact

| Purpose | Contact |
|---------|---------|
| Privacy inquiries | hello@ishbor.uz |
| Data subject requests | hello@ishbor.uz (subject: "Privacy Request") |
| Security issues | hello@ishbor.uz (subject: "[SECURITY]") |
| Telegram | @IshBorUz |

**Supervisory authority (Uzbekistan):**  
Users may lodge complaints with the authorized body for personal data protection under the Law on Personal Data. [INSERT CURRENT AUTHORITY NAME AND CONTACT WHEN CONFIRMED BY COUNSEL.]

---

## 15. Publication checklist

Before publishing at `/privacy`:

- [ ] Legal counsel review (Uzbekistan + cross-border)
- [ ] Replace all `[PLACEHOLDER]` values
- [ ] Confirm data hosting region disclosure
- [ ] Confirm retention periods with finance/tax advisor
- [ ] Sync with [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- [ ] Add uz/ru/en translations in i18n if serving localized legal pages
- [ ] Verify terms consent gate references correct policy version

---

## Related documents

- [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- [COMPLIANCE.md](./COMPLIANCE.md)
- [SECURITY.md](../SECURITY.md)
