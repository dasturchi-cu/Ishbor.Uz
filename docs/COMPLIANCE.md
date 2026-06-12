# Compliance Overview

Regulatory and compliance considerations for IshBor.uz — Uzbekistan freelance marketplace with escrow payments.

> **Disclaimer:** This document is an engineering and product compliance guide, not legal advice. Engage qualified counsel in Uzbekistan before production launch, especially for payments, personal data localization, and escrow characterization.

**Last updated:** June 2026

---

## 1. Regulatory landscape

IshBor.uz operates at the intersection of:

| Domain | Relevance |
|--------|-----------|
| **Personal data protection** | User profiles, KYC documents, communications |
| **Electronic commerce** | Online marketplace, distance contracts |
| **Payment services** | Wallet, escrow, Click/Payme integration |
| **Consumer protection** | Employer/freelancer transaction fairness |
| **Taxation** | Platform fees, user income reporting |
| **Content moderation** | User-generated services, chat, reviews |
| **AML/CFT** | Large transactions, withdrawal monitoring |

Primary jurisdiction: **Republic of Uzbekistan**.

---

## 2. Personal data (LZhDP)

### 2.1 Applicable law

The Law of the Republic of Uzbekistan **"On Personal Data"** (LZhDP, with amendments) governs collection, processing, storage, and cross-border transfer of personal data of individuals.

### 2.2 Data controller obligations

As platform operator, IshBor.uz acts as **data controller** for user data processed through the Services.

| Obligation | IshBor.uz implementation |
|------------|--------------------------|
| Lawful basis for processing | Contract, consent, legal obligation, legitimate interest — see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) §3 |
| Purpose limitation | Data used only for stated purposes (marketplace, escrow, verification) |
| Data minimization | Collect only necessary fields; optional fields marked clearly |
| Security measures | RLS, encryption, access controls — see [SECURITY.md](../SECURITY.md) |
| User rights | Access, correction, deletion requests via hello@ishbor.uz |
| Breach notification | Internal incident response; notify authority/users per legal timelines |
| Privacy policy | Published at `/privacy` — [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) |

### 2.3 Sensitive and special categories

| Data | Sensitivity | Controls |
|------|-------------|----------|
| Passport / ID images | High | Private storage; admin-only access; verification queue |
| Bank account details | High | Encrypted at rest; admin verify before withdrawal |
| Biometric (if added) | Very high | Not collected at MVP; requires explicit consent + legal review |
| Chat messages | Medium | Private bucket attachments; RLS on conversations |
| STIR (company tax ID) | Medium | Company verification flow |

### 2.4 Data localization

Uzbekistan has implemented and refined **data localization** requirements for personal data of Uzbek citizens. Key considerations:

| Topic | Guidance |
|-------|----------|
| **Scope** | Determine whether IshBor.uz processes data triggering mandatory local storage (categories of personal data, volume thresholds) |
| **Current hosting** | Supabase cloud region: [DOCUMENT ACTUAL REGION] |
| **Cross-border transfer** | If data leaves Uzbekistan, implement lawful transfer mechanism (consent, adequacy, contractual clauses) per LZhDP |
| **Action before launch** | Legal assessment → if localization required, evaluate Uzbek hosting providers or Supabase region options |
| **Documentation** | Maintain Record of Processing Activities (ROPA) |

**Engineering note:** Even if localization is not legally required at MVP scale, document the hosting region in Privacy Policy and prepare migration path.

### 2.5 Data Processing Agreements (DPAs)

Execute DPAs with:

| Processor | Data processed |
|-----------|----------------|
| Supabase | All user data, auth, storage |
| Vercel | Frontend hosting, edge logs |
| Resend | Email addresses, transactional content |
| Eskiz.uz | Phone numbers, SMS content |
| Sentry | Error logs (PII scrubbed) |
| Click / Payme | Payment metadata (when live) |
| Cloudflare | Turnstile signals, CDN logs |

---

## 3. Electronic commerce

### 3.1 Distance contracts

Online service orders constitute distance contracts. Platform must provide:

| Requirement | Implementation |
|-------------|----------------|
| Clear service description | Service detail pages with packages, price, delivery time |
| Total price in soʻm | Display before order confirmation |
| Terms acceptance | Terms consent gate on login |
| Order confirmation | Order receipt (JSON + UI) |
| Cancellation rules | Terms §7.4; order status flow |

### 3.2 Consumer rights

Employers purchasing services may have consumer protection rights under Uzbek law. Platform dispute resolution supplements but does not replace statutory rights. Display dispute process clearly on order pages.

---

## 4. Payments and escrow

### 4.1 Regulatory characterization

IshBor.uz wallet and escrow are **platform credits**, not licensed banking or payment institution services. Before launch:

| Question | Action |
|----------|--------|
| Does escrow holding require CBU license? | **Legal counsel review required** |
| Are Click/Payme merchant agreements sufficient? | Confirm with payment providers |
| Wallet top-up regulatory status | Sandbox vs live has different implications |

**Current MVP status:** Sandbox wallet only; live Click/Payme pending merchant credentials. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

### 4.2 Payment provider compliance

| Provider | Requirements |
|----------|--------------|
| **Click** | Merchant agreement, SHOP-API credentials, webhook signature verification |
| **Payme** | Merchant account, JSON-RPC integration, callback validation |

Implementation checklist (when going live):

- [ ] Signed merchant agreements
- [ ] Production webhook URLs with HTTPS
- [ ] Idempotency keys on payment endpoints (implemented)
- [ ] Transaction logging for audit
- [ ] Refund/chargeback procedures documented
- [ ] PCI DSS: no card data stored on IshBor.uz servers (checkout on provider side)

### 4.3 Anti-fraud and AML

| Control | Status |
|---------|--------|
| Rate limiting | ✅ API rate limits |
| Fraud service | ✅ `fraud_service.py` |
| Verification for withdrawals | ✅ Bank + identity verify |
| Transaction monitoring | ✅ Admin dashboards |
| Large transaction alerts | ⚠️ Configure thresholds before live |
| Suspicious activity reporting | ⬜ Define SAR process with counsel |

### 4.4 Immutable ledger

Financial ledger entries use database triggers to prevent tampering. Escrow state machine enforces valid transitions. Audit log captures admin actions.

---

## 5. Identity verification (KYC)

### 5.1 Purpose

- Trust and safety on marketplace
- Withdrawal fraud prevention
- Regulatory compliance (AML where applicable)

### 5.2 Verification types

| Type | User | Documents |
|------|------|-----------|
| Identity | Freelancer | Passport/ID, optional selfie |
| Company | Employer | STIR, registration documents |
| Bank account | Freelancer (withdrawal) | Bank details, admin manual verify |

### 5.3 Data handling

- Documents stored in private Supabase Storage bucket
- Admin access only via verification queue
- Rejected documents: retention policy per [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- Do not share KYC documents with other users

### 5.4 Uzbekistan-specific identifiers

| Identifier | Use |
|----------|-----|
| **STIR** | Company tax identification — collected for company verification |
| **PINFL** | Personal identification (if collected) — high sensitivity; legal review before collection |
| **MFO** | Bank branch code — validated on bank account entry |

---

## 6. Tax compliance

### 6.1 Platform obligations

| Topic | Notes |
|-------|-------|
| **Platform service fee** | IshBor.uz revenue; subject to corporate tax and VAT rules |
| **VAT on digital services** | Confirm VAT treatment of platform fees with tax advisor |
| **Transaction reporting** | Maintain records for tax authority requests |
| **Withholding** | Determine if platform must withhold tax on freelancer payouts |

### 6.2 User obligations

Terms require users to self-report income. Platform may provide annual transaction summaries on request but does not file taxes on behalf of users.

### 6.3 Invoicing

Before live payments, define:

- Invoice format for platform fees
- Whether freelancers issue invoices to employers (user responsibility)
- Integration with Uzbekistan electronic invoicing if required

---

## 7. Content and moderation

### 7.1 Illegal content

Platform must respond to:

- Copyright infringement notices
- Illegal services (drugs, weapons, fraud schemes)
- Government lawful removal requests

Admin moderation tools: service approval, user suspend/ban, compliance flags.

### 7.2 User-generated content liability

Under Uzbek law and platform Terms, users are responsible for their content. Platform acts as intermediary with moderation capability. Document notice-and-takedown procedure before scale.

### 7.3 Communications retention

Chat messages may be retained for dispute resolution and legal compliance. Retention period in [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

---

## 8. Security compliance

Cross-reference [SECURITY.md](../SECURITY.md) for technical controls.

| Standard / framework | Applicability |
|---------------------|---------------|
| OWASP Top 10 | Web application security baseline |
| PCI DSS | Payment card data — delegated to Click/Payme checkout |
| ISO 27001 | Optional future certification for enterprise clients |
| Supabase SOC 2 | Infrastructure provider compliance |

### Security features implemented

- JWT authentication (Supabase)
- Row Level Security (PostgreSQL)
- CORS allowlist + origin guard (production)
- Rate limiting (Redis or Postgres backend)
- Cloudflare Turnstile (bot protection)
- Webhook signature verification
- Admin RBAC hierarchy
- Audit logging with CSV export
- 2FA (TOTP) optional
- Private storage for chat attachments

### Known security gaps (pre-production)

| Gap | Status | Reference |
|-----|--------|-----------|
| Email verification not enforced | Config only | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |
| Session idle timeout not enforced | Config only | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |
| Live payment fraud rules | Partial | Sandbox tested |
| User impersonation | Not built | Support workaround only |

---

## 9. Accessibility and consumer communication

| Requirement | Implementation |
|-------------|----------------|
| Multi-language | uz (default), ru, en |
| Support channel | hello@ishbor.uz, Telegram @IshBorUz |
| Help documentation | `/help`, FAQ |
| Terms/Privacy accessible | `/terms`, `/privacy` |

---

## 10. Cross-border considerations

| Scenario | Compliance note |
|----------|-----------------|
| Uzbek freelancer, foreign employer | Tax and currency rules; Terms govern |
| Foreign freelancer, Uzbek employer | Work permit/visa not platform scope; user responsibility |
| Data of non-Uzbek users | GDPR may apply for EU residents — assess if targeting EU market |

At MVP, primary market is Uzbekistan. Expand legal review before international marketing.

---

## 11. Pre-launch compliance checklist

### Legal (counsel required)

- [ ] Corporate entity registered (STIR, legal address)
- [ ] Terms of Service finalized (uz/ru/en)
- [ ] Privacy Policy finalized
- [ ] Escrow/wallet regulatory classification confirmed
- [ ] Click/Payme merchant agreements signed (if live payments)
- [ ] Data localization assessment completed
- [ ] DPAs signed with processors
- [ ] Tax/VAT treatment confirmed

### Technical (engineering)

- [ ] `pnpm db:push` — all migrations applied
- [ ] RLS policies verified on financial tables
- [ ] `REQUIRE_EMAIL_VERIFIED` decision made
- [ ] Production secrets in secure vault (not in repo)
- [ ] Sentry PII scrubbing verified
- [ ] Backup and disaster recovery tested
- [ ] `pnpm preflight` passes
- [ ] Security review completed (`ishbor-security-review` skill)

### Operational

- [ ] Admin verification queue staffed
- [ ] Dispute resolution SLA defined
- [ ] Support response times documented
- [ ] Incident response plan written
- [ ] Breach notification procedure defined

### Documentation

- [ ] [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) published
- [ ] [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) published
- [ ] [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) reviewed
- [ ] [SECURITY.md](../SECURITY.md) contact channels live

---

## 12. Ongoing compliance

| Activity | Frequency |
|----------|-----------|
| Privacy policy review | Annual or on material change |
| Security audit | Quarterly (automated + annual manual) |
| Access review (admin accounts) | Quarterly |
| Migration/RLS audit | Each release with DB changes |
| Payment reconciliation | Daily (when live) |
| Fraud rule tuning | Monthly |
| Legal regulatory monitoring | Ongoing (counsel) |

---

## 13. Incident response

### Data breach

1. Contain — revoke compromised credentials, isolate affected systems
2. Assess — scope, data categories, number of users affected
3. Notify — authority and affected users per LZhDP timelines
4. Document — incident report, remediation steps
5. Review — post-incident improvements

Contact: hello@ishbor.uz `[SECURITY]`

### Payment incident

1. Freeze affected escrow/wallet operations
2. Notify payment provider
3. Preserve ledger and webhook logs
4. User communication via email + platform banner
5. Regulatory notification if required

---

## 14. References

### Internal documents

- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- [SECURITY.md](../SECURITY.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
- [security-production-setup.md](./security-production-setup.md)

### External resources (verify current versions with counsel)

| Resource | Topic |
|----------|-------|
| Lex.uz — LZhDP | Personal data law |
| Central Bank of Uzbekistan | Payment services regulation |
| Ministry of Justice / Digital Trust | E-commerce, digital economy initiatives |
| Click.uz / Payme.uz | Merchant integration requirements |
| State Tax Committee | Tax reporting obligations |

---

## 15. Contact

| Purpose | Contact |
|---------|---------|
| Compliance inquiries | hello@ishbor.uz (subject: "Compliance") |
| Data protection requests | hello@ishbor.uz (subject: "Privacy Request") |
| Security incidents | hello@ishbor.uz (subject: "[SECURITY]") |

---

## Related documents

- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
- [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- [QA_PROCESS.md](./QA_PROCESS.md)
- [plan-status.md](../plan-status.md)
