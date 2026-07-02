# خارطة الطريق - new-marasem (V2.0 → V3.0)

هذا ملف خارطة الطريق الأولية للمشروع ولإصدار V2.0 كما تم الاتفاق عليه.

## الاختيارات التقنية الافتراضية (يمكن تغييرها لاحقاً)
- Frontend: Next.js + React + TypeScript
- UI Library: Ant Design (داخلية قوية لمكونات الـ Dashboard)
- State & Data fetching: React Query + Zustand (لـ UI state البسيط)
- Backend/DB: Supabase (Postgres)
- ORM: Prisma
- Realtime: Supabase Realtime
- Auth: Supabase Auth (مع خطة لإضافة 2FA لاحقاً)
- Desktop: Tauri (مفضل) / خيار بديل: Electron
- QR/Camera: @zxing/browser أو jsQR للمسح، ومولد QR ديناميكي على السيرفر
- PWA: Next.js PWA plugin أو Vite PWA plugin إذا تحولنا إلى Vite

## ملخص أهداف V2.0 (MVP)
1. إعادة هيكلة المشروع وتنظيف الشيفرة.
2. تصميم واجهة Dashboard جديدة: Sidebar قابل للطي، TopBar، Cards، Widgets قابلة للسحب.
3. صفحة الضيوف كـ CRM: عرض بطاقة الضيف (الصورة، المنصب، الدولة، البروتوكول، مستوى الأهمية، QR، حالة الدعوة، مكان الجلوس، الفندق، السيارة).
4. إعداد قاعدة بيانات ابتدائية في Supabase مع جداول: users, guests, invitations, seats, arrivals, logs.
5. إعداد المصادقة الأساسية وإدارة المستخدمين.
6. تكوين بيئة تطوير موحدة: ESLint, Prettier, TypeScript strict, Storybook (اختياري).

## تسليمات فورية سأبدأ بتنفيذها الآن
- [x] إضافة هذا الملف ROADMAP.md إلى الريبو.
- [ ] إنشاء Milestone: V2.0
- [ ] إنشاء مجموعة Issues أساسية للمخرجات (setup, UI, DB, Auth, Guests CRUD, CI)
- [ ] إعداد هيكل المشروع (folders، config، lint)

## مقترح أول 8 Issues (سيتم إنشاؤها كـ Issues في GitHub بعد تأكيدك)
1. Project: Initialize Next.js + TypeScript + ESLint + Prettier
2. Project: Add Ant Design and basic layout (Sidebar, TopBar, Dashboard shell)
3. DB: Setup Supabase project & Prisma schema (users, guests, invitations, seats, arrivals, logs)
4. Auth: Implement Supabase Auth + basic user roles
5. Guests: Implement Guests CRUD + Guest Card UI
6. QR: Generate dynamic QR for guest records (server-side endpoint)
7. Camera: Implement QR scanning page and arrival logging (camera access)
8. CI/CD: Configure basic pipeline (lint, build, test)

## الأسئلة السريعة
1. هل الاختيارات التقنية الافتراضية أعلاه مقبولة؟ (Next.js, Supabase, Ant Design)
2. هل تريد إنشاء Milestone وIssues الآن تلقائياً؟

---

سأنتظر تأكيدك للتقدّم وإنشاء Milestone والـ Issues في الريبو. إذا وافقت، سأنشئ Milestone "V2.0" ثم سأضيف الـ Issues المذكورة مع تقدير زمني وLabels (backend/frontend/infra/design).