# 💼 JobTracker

Минималистичное веб-приложение для отслеживания откликов на вакансии.  
**Стек:** Next.js 14 · Supabase · Tailwind CSS · Vercel

---

## 🚀 Деплой за 15 минут

### 1. Supabase — база данных и авторизация

1. Зайдите на [supabase.com](https://supabase.com) → **New project**
2. Придумайте название и пароль базы данных, выберите регион (Frankfurt)
3. Подождите ~2 минуты пока проект создаётся

**Создайте таблицу:**
- Откройте **SQL Editor** в боковом меню
- Вставьте содержимое файла `supabase/schema.sql` и нажмите **Run**

**Включите OAuth провайдеров:**
- Перейдите в **Authentication → Providers**
- Включите **Google** и/или **GitHub**
- Для каждого нужно создать OAuth-приложение:

  **GitHub:**
  - Зайдите на [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
  - Homepage URL: `https://ваш-проект.vercel.app`
  - Authorization callback URL: скопируйте из Supabase (вида `https://xxx.supabase.co/auth/v1/callback`)
  - Скопируйте Client ID и Client Secret → вставьте в Supabase

  **Google:**
  - Зайдите в [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
  - Create Credentials → OAuth Client ID → Web application
  - Authorized redirect URI: скопируйте из Supabase
  - Скопируйте Client ID и Client Secret → вставьте в Supabase

**Скопируйте ключи:**
- В Supabase: **Settings → API**
- Скопируйте `Project URL` и `anon public` ключ

---

### 2. GitHub — выложите код

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/jobtracker.git
git push -u origin main
```

---

### 3. Vercel — хостинг (бесплатно)

1. Зайдите на [vercel.com](https://vercel.com) → **Add New Project**
2. Импортируйте репозиторий с GitHub
3. В разделе **Environment Variables** добавьте:
   ```
   NEXT_PUBLIC_SUPABASE_URL = ваш Project URL из Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = ваш anon key из Supabase
   ```
4. Нажмите **Deploy**

**После деплоя:**
- Скопируйте URL вашего приложения (вида `https://jobtracker-xxx.vercel.app`)
- Вернитесь в Supabase → **Authentication → URL Configuration**
- В **Site URL** вставьте ваш URL Vercel
- В **Redirect URLs** добавьте: `https://jobtracker-xxx.vercel.app/auth/callback`

---

### 4. Локальная разработка

```bash
cp .env.local.example .env.local
# Заполните ключи Supabase в .env.local

npm install
npm run dev
# Откройте http://localhost:3000
```

---

## 📋 Функционал

- 🔐 Авторизация через Google / GitHub OAuth
- ➕ Добавление вакансий (компания, должность, статус, ЗП, источник, контакт, ссылка, заметки)
- ✏️ Редактирование и удаление записей
- 🔍 Поиск и фильтрация по статусу
- 📊 Сводная статистика вверху
- 🔒 Каждый пользователь видит только свои данные (Row Level Security)

## 📁 Структура проекта

```
src/
├── app/
│   ├── auth/
│   │   ├── page.tsx          # Страница входа
│   │   └── callback/
│   │       └── route.ts      # OAuth callback
│   ├── dashboard/
│   │   └── page.tsx          # Главная страница (таблица)
│   ├── layout.tsx
│   ├── page.tsx              # Редирект на /dashboard
│   └── globals.css
├── components/
│   ├── JobModal.tsx          # Модалка добавления/редактирования
│   └── StatCard.tsx          # Карточка статистики
├── lib/
│   ├── supabase.ts           # Клиент Supabase
│   └── types.ts              # TypeScript типы
└── middleware.ts             # Защита маршрутов

supabase/
└── schema.sql                # SQL для создания таблицы
```
