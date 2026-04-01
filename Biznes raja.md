# Biznes reja (1-bosqich: Mobile ilova ssenariysi)

## Maqsad
Mobil ilova orqali foydalanuvchini tez va tushunarli tarzda tizimga kiritish, uni tashkilot bilan bog'lash va xavfsizlik natijalarini ko'rish imkonini berish.

## Asosiy foydalanuvchi rollari
- Mehmon (Guest)
- Xodim (tashkilotga biriktirilgan foydalanuvchi)
- Tashkilot uchun xavfsizlikka mas'ul shaxs (admin-panelda yaratiladi)

## Mobile ilova ochilgandagi asosiy oqim
1. Ilova ochiladi.
2. Agar foydalanuvchi ro'yxatdan o'tmagan yoki tizimga kirmagan bo'lsa, `Login` sahifasiga yo'naltiriladi.
3. `Login` sahifasida birinchi qadam: til tanlash (`O'zbekcha lotin`).
4. Foydalanuvchi kirish usulini tanlaydi:
   - Google orqali kirish
   - Email orqali kirish
   - Yangi ro'yxatdan o'tish

## Ro'yxatdan o'tish ssenariysi
1. Foydalanuvchi ro'yxatdan o'tishni tanlaydi.
2. Tashkilot tanlash bosqichi chiqadi:
   - Mavjud tashkilotni tanlash
   - Agar tashkilotga tegishli bo'lmasa, `Mehmon` sifatida davom etish
3. Ro'yxatdan o'tish yakunlangach, foydalanuvchi o'z roliga mos bosh sahifaga o'tadi.

## Tashkilot va xodim bog'lanish logikasi
- Har bir tashkilotda xodimlar xavfsizligiga javob beradigan mas'ul shaxs bo'ladi.
- Bu mas'ul shaxs avval `admin-panel`dagi `Xodimlar` bo'limida yaratiladi.
- Keyin tashkilot yaratilayotganida o'sha xodim tashkilotga biriktiriladi.
- Biriktirilgan xodim o'z akkauntiga kirganda faqat o'z tashkilotiga tegishli natijalarni ko'ra oladi.

## Admin-panel bilan bog'liq jarayon
1. Admin `Xodimlar` bo'limida xodim yaratadi.
2. Admin `Tashkilotlar` bo'limida tashkilot yaratadi.
3. Tashkilot yaratishda mas'ul xodim biriktiriladi.
4. Tizim xodim rolini va tashkilotga tegishlilikni saqlaydi.

## Natija (biznes qiymat)
- Foydalanuvchi uchun kirish jarayoni soddalashadi.
- Tashkilot kesimida xavfsizlik monitoringi aniq bo'ladi.
- Mas'ul shaxslar bo'yicha javobgarlik va nazorat mexanizmi kuchayadi.

## Keyingi bosqich uchun vazifalar
- 1) Mobile ekranlar ro'yxatini aniq belgilash (Splash, Login, Register, Organization Select, Home).
- 2) Rollar bo'yicha ruxsatlar jadvalini tuzish (Mehmon, Xodim, Admin).
- 3) API talablarini yozish (auth, organization, employee mapping, results).
- 4) Minimal MVP scope ni belgilash.
