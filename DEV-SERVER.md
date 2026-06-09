# IshBor.uz — lokal serverni ishga tushirish va to‘xtatish

Windows (PowerShell) uchun qisqa yo‘riqnoma.

## Talablar

- Node.js 22+ va `pnpm`
- Python 3.12+ (`backend/.venv` yaratilgan bo‘lishi kerak)
- `.env.local` (frontend) va `backend/.env` (API) to‘ldirilgan

Birinchi marta:

```powershell
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm install

cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# .env ni Supabase kalitlari bilan to'ldiring
```

---

## Ishga tushirish (RUN)

### Bitta buyruq (tavsiya) — avtomatik hot reload

```powershell
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm dev:start
```

Yoki portlar toza bo'lsa:

```powershell
pnpm dev:all
```

- **Frontend** kod o'zgasa → Next.js HMR avtomatik yangilaydi (restart yo'q)
- **Backend** kod o'zgasa → uvicorn `--reload` avtomatik qayta yuklaydi (restart yo'q)
- Cursor/VS Code loyihani ochganda **IshBor: Dev Full Stack** task avtomatik ishga tushishi mumkin

### Ikkita alohida terminal (ixtiyoriy)

### Terminal 1 — FastAPI backend (port **8002**)

```powershell
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm dev:api
```

- API: http://127.0.0.1:8002
- Swagger: http://127.0.0.1:8002/docs
- Health: http://127.0.0.1:8002/api/v1/health

### Terminal 2 — Next.js frontend (port **3000**)

```powershell
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm dev
```

- Sayt: http://localhost:3000

> `.env.local` da `NEXT_PUBLIC_API_URL=http://localhost:8002` bo‘lishi kerak.

---

## To‘xtatish (STOP)

### Usul 1 — Terminalda (tavsiya)

Har bir terminal oynasida:

```
Ctrl + C
```

### Usul 2 — Port bo‘yicha (PowerShell)

```powershell
3000, 8001, 8002 | ForEach-Object {
  Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { taskkill /F /PID $_.OwningProcess }
}
```

### Usul 3 — Barcha dev jarayonlarni to‘xtatish

```powershell
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

> **Diqqat:** bu buyruq kompyuterdagi boshqa Node/Python loyihalarini ham to‘xtatishi mumkin. Faqat IshBor dev serverlari uchun **Usul 1** yoki **Usul 2** ni ishlating.

---

## Qayta ishga tushirish (RESTART)

```powershell
# 1. To'xtatish
3000, 8001, 8002 | ForEach-Object {
  Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { taskkill /F /PID $_.OwningProcess }
}

Start-Sleep -Seconds 2

# 2. Backend (yangi terminal)
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm dev:api

# 3. Frontend (yana boshqa terminal)
cd C:\Users\User\ishbor\Ishbor.Uz
pnpm dev
```

---

## Portlar

| Xizmat   | Port  | Buyruq        |
|----------|-------|---------------|
| Frontend | 3000  | `pnpm dev`    |
| Backend  | 8002  | `pnpm dev:api`|
| Eski API | 8001  | ishlatilmaydi (`.env.local` → 8002) |

---

## Tekshirish

```powershell
# Portlar bandmi?
Get-NetTCPConnection -LocalPort 3000,8002 -State Listen -ErrorAction SilentlyContinue |
  Format-Table LocalPort, OwningProcess -AutoSize

# Backend health
Invoke-RestMethod http://127.0.0.1:8002/api/v1/health
```

---

## Muammolar

| Belgilar | Yechim |
|----------|--------|
| `EADDRINUSE` / port band | Yuqoridagi STOP buyruqlarini ishlating |
| API ulanmayapti | `backend/.env` va `pnpm dev:api` ishlayotganini tekshiring |
| Auth xato | Supabase URL/kalit `.env.local` da to‘g‘rimi |
| Migration yangilash | `supabase db push --linked --yes` |

---

## Foydali buyruqlar

```powershell
pnpm build              # production build
pnpm exec tsc --noEmit  # TypeScript tekshiruv
cd backend ; .\.venv\Scripts\python -m compileall app
```
