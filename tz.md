# Elektr-Xavfsizlik MVP Tizim Rejasi (Backend + Web Admin + Mobile)

## 1) MVP Scope (Freeze)

Ushbu MVP quyidagi asosiy funksiyalar bilan ishga tushadi:

1. Auth:
- Email + parol orqali kirish
- Google orqali kirish
- Moderatorlarni SuperAdmin yaratadi

2. Tashkilot modeli:
- Mobile client uchun bitta tashkilot konteksti ishlatiladi
- Xodim (admin panel foydalanuvchisi) bir nechta tashkilotga biriktirilishi mumkin
- Admin login paytida odatda tashkilot tanlash so'ralmaydi

3. Kontent modeli:
- `Daraja -> Nazariya -> Savol` nested tuzilma
- Savol turi: faqat `single-choice` (bitta to'g'ri javob)

4. O'yin qoidasi:
- Level unlock bo'lishi uchun level 100% tugatilishi shart
- Har bir javob backend tomonidan tekshiriladi (`questionId + selectedOptionId`)
- To'g'ri/noto'g'ri natija mobile ilovaga qaytariladi

5. Hearts (MVP ichida):
- Maksimal hearts: 5
- Regeneratsiya: har 30 daqiqada 1 ta

6. Sertifikat (MVP ichida):
- Mobile ilovada sertifikat olish
- Sertifikatni yuklab olish (download)
- Sertifikatni ulashish (share)

7. Til:
- Faqat o'zbek tili
- Lotin va kirill yozuvlari qo'llab-quvvatlanadi

---

## 2) Rollar va ruxsatlar (RBAC)

### SuperAdmin
- Barcha tashkilotlarni ko'radi
- Global analitika (`All` + alohida tashkilot filter)
- Moderator account yaratadi
- Daraja/Nazariya/Savol CRUD qiladi

### Moderator
- O'ziga biriktirilgan tashkilot(lar) bo'yicha ishlaydi
- Kontentni kiritadi va tahrirlaydi
- O'z kontekstidagi analitikani ko'radi

### Mobile User
- Darslarni o'qiydi (Nazariya)
- Savollarga javob beradi
- Progress, hearts, sertifikat bilan ishlaydi

---

## 3) DB sxema (MVP)

### users
- id
- email (nullable, Google login bo'lsa)
- password_hash (nullable, Google login bo'lsa null)
- google_id (nullable, Email login bo'lsa null)
- first_name
- last_name
- role (`SUPERADMIN | MODERATOR | USER`)
- created_at, updated_at

### organizations
- id
- name
- created_at, updated_at

### user_organizations (many-to-many)
- id
- user_id (FK -> users)
- organization_id (FK -> organizations)
- created_at

### levels
- id
- title
- order_index
- is_active
- created_by (FK -> users)
- created_at, updated_at

### theories
- id
- level_id (FK -> levels)
- title
- order_index
- content (text/markdown/html)
- created_by (FK -> users)
- created_at, updated_at

### questions
- id
- level_id (FK -> levels)
- theory_id (FK -> theories)
- prompt
- order_index
- created_by (FK -> users)
- is_active
- created_at, updated_at

### question_options
- id
- question_id (FK -> questions)
- option_text
- order_index
- is_correct (faqat bittasi true bo'lishi kerak)
- created_at, updated_at

### user_progress
- id
- user_id (FK -> users)
- organization_id (FK -> organizations)
- current_level_id (FK -> levels)
- hearts_count (default 5, max 5)
- last_heart_regen_at
- completed_levels_count
- created_at, updated_at

### user_level_completions
- id
- user_id
- organization_id
- level_id
- completion_percent (MVP da unlock uchun 100 bo'lishi kerak)
- completed_at

### user_question_attempts
- id
- user_id
- organization_id
- question_id
- selected_option_id
- is_correct
- answered_at

### certificates
- id
- user_id
- organization_id
- level_id (yoki kurs yakuni bo'yicha nullable)
- file_url
- issued_at

---

## 4) Backend (NestJS) modul arxitekturasi

1. `AuthModule`
- Email/Password login
- Google auth
- JWT

2. `UsersModule`
- User profile
- User-org bog'lanishlari

3. `OrganizationsModule`
- Tashkilot CRUD
- Tashkilotga user biriktirish

4. `ContentModule`
- Level/Theory/Question/Option CRUD
- Priority (order_index) boshqaruvi

5. `GameModule`
- Savol oqimini berish
- Submit answer (`questionId + selectedOptionId`)
- 100% completion tekshiruvi
- Hearts kamayishi va regen logikasi

6. `AnalyticsModule`
- Tashkilotlar kesimida progress
- Savollar bo'yicha xatolik statistikasi

7. `CertificateModule`
- Sertifikat generatsiya
- Download/share uchun URL berish

---

## 5) API kontrakt (MVP)

## Auth
- `POST /auth/register` (email flow)
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/me`

## Content (mobile consume)
- `GET /levels`
- `GET /levels/:levelId/theories`
- `GET /theories/:theoryId/questions` (to'g'ri javob qaytmaydi)

## Game
- `POST /game/start-level`
- `POST /game/submit-answer`
  - request:
    - `questionId`
    - `selectedOptionId`
  - response:
    - `isCorrect`
    - `heartsLeft`
    - `levelProgressPercent`
    - `nextUnlocked` (bool)
- `GET /game/progress`

## Admin
- `POST/PUT/DELETE /admin/levels`
- `POST/PUT/DELETE /admin/theories`
- `POST/PUT/DELETE /admin/questions`
- `POST/PUT/DELETE /admin/question-options`
- `GET /admin/questions?levelId=&theoryId=&orgId=`

## Analytics
- `GET /admin/analytics/summary?orgId=all|{id}`
- `GET /admin/analytics/level-funnel?orgId=all|{id}`
- `GET /admin/analytics/questions?orgId=all|{id}`

## Certificate
- `POST /certificate/generate`
- `GET /certificate/:id/download`
- `GET /certificate/:id/share-link`

---

## 6) Web Admin Panel (React) sahifalar

Sidebar tartibi:
1. Dashboard / Analitika
2. Moderatorlar
3. Darajalar
4. Savollar
5. Xodimlar
6. Tashkilotlar
7. Foydalanuvchilar

### Darajalar sahifasi
- Nested ko'rinish: `Daraja -> Nazariya -> Savollar`
- Har tugunda CRUD

### Savollar sahifasi
- Barcha savollar expanded ko'rinishda
- Daraja prioriteti bo'yicha tartib
- Har qatorda:
  - qaysi daraja
  - qaysi nazariya
  - kim qo'shgan (`created_by`)
- Filter: query params (`levelId`, `theoryId`, `orgId`)

### Analitika sahifasi
- SuperAdmin: `All` yoki alohida org filter
- Moderator: faqat o'z org(lar)i
- KPI:
  - Jami user
  - Faol user
  - Level funnel
  - To'g'ri javob foizi
  - Eng ko'p xato qilingan savollar

---

## 7) Mobile (React + Capacitor) ekranlar

1. Auth (Google / Email)
2. Home (progress + hearts + levellar)
3. Level detail
4. Nazariya o'qish
5. Savol yechish (single-choice)
6. Javob feedback (to'g'ri/noto'g'ri)
7. Level completed / unlock
8. Profil (ism yonida 1..5 chaqmoq level belgisi)
9. Sertifikatlar (download + share)

---

## 8) Hearts qoidasi (aniq)

- Boshlang'ich hearts: 5
- Noto'g'ri javob: `-1 heart`
- To'g'ri javob: heart kamaymaydi
- Regen: har 30 daqiqada `+1`
- Max limit: 5
- Agar heart = 0 bo'lsa:
  - kutish taymeri ko'rsatiladi
  - yoki keyin tiklanganda davom etadi

---

## 9) Unlock qoidasi

- Har level ichidagi barcha required savollar yakunlanadi
- Completion 100% bo'lsa keyingi level unlock bo'ladi
- 100% bo'lmasa qayta topshirish rejimi ishlaydi

---

## 10) Lotin/Kirill qo'llab-quvvatlash

- Kontent saqlash UTF-8
- Admin panelda matn kiritishda lotin/kirill aralash qo'llab-quvvatlanadi
- Mobile renderingda har ikkala yozuv to'g'ri ko'rsatiladi

---

## 11) MVPdan keyingi bosqich (post-MVP)

- Multi-correct savollar
- Push notifications
- Offline full sync
- Sertifikatni verifikatsiya QR bilan
- Gamification (XP/streak/leaderboard to'liq versiya)

