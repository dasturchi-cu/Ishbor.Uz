# Cursor AI — IshBor.uz

**Yagona agent qoidasi** — har qanday sessiyada avtomatik qo'llanadi.

---

## Asosiy qoida (alwaysApply)

| Fayl | Vazifa |
|------|--------|
| **[ishbor-agent.mdc](./rules/ishbor-agent.mdc)** | Master OS + bootstrap + DDD + review + verify + tools + core — **hammasi bitta** |

Siz hech narsa demasangiz ham har agent bu qoidani oladi.

---

## Fayl bo'yicha qoidalar (kontekstda)

| Fayl | Globs |
|------|-------|
| [react-ui.mdc](./rules/react-ui.mdc) | `**/*.{tsx,jsx}` |
| [backend-api.mdc](./rules/backend-api.mdc) | `backend/**`, `src/infrastructure/api/**` |
| [i18n.mdc](./rules/i18n.mdc) | `src/infrastructure/i18n/**`, `**/*.{tsx,ts}` |

---

## Hujjatlar

| Hujjat | Path |
|--------|------|
| Agent yo'riqnomasi | [AGENTS.md](../AGENTS.md) |
| Master OS (to'liq) | [docs/MASTER_AI_OS.md](../docs/MASTER_AI_OS.md) |
| AI qoidalar | [docs/AI_AGENT_RULES.md](../docs/AI_AGENT_RULES.md) |
| Workflow | [docs/AI_WORKFLOWS.md](../docs/AI_WORKFLOWS.md) |
| Xavfsizlik | [docs/AI_SAFETY.md](../docs/AI_SAFETY.md) |

---

## Skilllar (`skills/`)

| Tur | Skilllar |
|-----|----------|
| **Workflow** | `ishbor-master-os` |
| **Build** | `ishbor-mvp`, `ishbor-backend`, `ishbor-i18n` |
| **Review** (faqat user chaqirganda) | `ishbor-ui-review`, `ishbor-product-review`, `ishbor-security-review`, `ishbor-performance-review`, `ishbor-growth-review`, `ishbor-conversion-review` |

---

## MCP (`.cursor/mcp.json`)

| Server | Vazifa |
|--------|--------|
| filesystem | Workspace fayllar |
| supabase | Schema, advisors (read-only) |

---

## Eski `rules/` papka

Root [rules/](../rules/) — faqat redirect README. Asosiy qoidalar: **`.cursor/rules/`**.
