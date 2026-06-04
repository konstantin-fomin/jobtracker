# JobTracker — project instructions

Сайт для отслеживания откликов на вакансии.
**Стек:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · Supabase · Nunito (Google Fonts, кириллица).
**Репо:** https://github.com/konstantin-fomin/jobtracker (gh account: Parmezzzan, full admin access)

---

## Текущее состояние проекта (обновлено 2026-06-04)

### Что реализовано
- **Дашборд** (`src/app/dashboard/page.tsx`) — один экран: метрики + таблица откликов
- **Inline-редактирование** — клик по строке открывает редактирование прямо в таблице, Enter/Esc, без модалок
- **Optimistic delete** — строка исчезает сразу, toast «Отклик удалён · Отменить» (4с на undo)
- **Toast-уведомления** (`src/components/Toast.tsx`) — success/error/info, с action-кнопкой
- **Тёмная + светлая тема** — переключатель в хедере, no-flash через скрипт в `<head>`, localStorage
- **Count-up анимация** метрик (`src/lib/useCountUp.ts`) с `prefers-reduced-motion`
- **Skeleton loader** вместо текста «Загрузка…»
- **Auth** через Supabase OAuth (Google + GitHub) — **ВРЕМЕННО ОТКЛЮЧЕНА** (middleware закомментирован)

### Auth отключена для локальной разработки
В `src/middleware.ts` закомментированы редиректы. Чтобы вернуть авторизацию:
1. Раскомментировать блоки `if (!user)` и `if (user && /auth)` в middleware.ts
2. В Supabase Dashboard → Authentication → URL Configuration добавить `http://localhost:3000/**` в Redirect URLs

### Структура файлов
```
src/
  app/
    dashboard/page.tsx   ← главная страница (всё в одном файле)
    auth/page.tsx        ← логин (Google + GitHub OAuth)
    auth/callback/route.ts
    layout.tsx           ← Nunito font, no-flash theme script
    globals.css          ← ВСЕ design tokens + компоненты
    page.tsx             ← redirect → /dashboard
  components/
    StatCard.tsx         ← карточка метрики с count-up
    JobRow.tsx           ← строка таблицы (view + inline edit mode)
    ThemeToggle.tsx      ← переключатель темы
    Toast.tsx            ← toast-уведомления
    icons.tsx            ← SVG-иконки (Lucide-style)
  lib/
    supabase.ts          ← browser client
    types.ts             ← Job, Status, STATUS_META, SOURCES
    useCountUp.ts        ← анимация чисел
    useToast.ts          ← хук для toast
supabase/
  schema.sql             ← таблица jobs + RLS policy
```

---

## Design System

### Токены (CSS custom properties в globals.css)

#### Светлая тема
```css
--bg:              #faf9f8   /* фон страницы */
--surface:         #ffffff   /* карточки */
--surface-2:       #f6f5f4   /* шапка таблицы, вложенные области */
--hairline:        #eae8e3
--hairline-strong: #dcd9d2
--ink:             #37352f   /* основной текст      12.3:1 ✓ */
--ink-muted:       #6b685f   /* вторичный текст      5.6:1 ✓ */
--ink-subtle:      #706c64   /* мелкие лейблы        5.2:1 ✓ */
--accent:          #0d9373   /* бренд-изумруд (декор, dots, rings) */
--accent-hover:    #0b7d62
--accent-btn:      #0b7b62   /* кнопки — белый текст 5.2:1 ✓ WCAG AA */
--accent-btn-hover:#08674f
--accent-soft:     rgba(13, 147, 115, 0.10)
--accent-ring:     rgba(13, 147, 115, 0.40)
--input-bg:        #ffffff
--row-edit-bg:     rgba(13, 147, 115, 0.04)
--shadow-card:     0 1px 2px rgba(15,15,15,0.05)
--shadow-pop:      0 10px 30px -8px rgba(15,15,15,0.18)
```

#### Тёмная тема (`.dark` класс на `<html>`)
```css
--bg:              #0f0e0d   /* глубокий якорь */
--surface:         #1c1b18   /* карточки (+L ~7 от bg) */
--surface-2:       #252320   /* шапка таблицы (+L ~5 от surface) */
--hairline:        #302e29
--hairline-strong: #3f3c36
--ink:             #f0eeeb   /* 14.9:1 ✓ */
--ink-muted:       #9e9b94   /*  6.2:1 ✓ */
--ink-subtle:      #88847c   /*  4.6:1 ✓ */
--accent:          #1aa883   /* яркий изумруд для тёмной темы */
--accent-hover:    #22b890
--accent-btn:      #1aa883   /* кнопки = бренд-цвет (3.0:1, large-text OK) */
--accent-btn-hover:#22b890
--accent-soft:     rgba(26, 168, 131, 0.13)
--accent-ring:     rgba(26, 168, 131, 0.45)
--input-bg:        #2e2c28   /* инпуты явно светлее surface */
--row-edit-bg:     rgba(26, 168, 131, 0.08)
--shadow-card:     0 0 0 1px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.5)
--shadow-pop:      0 12px 32px -8px rgba(0,0,0,0.75)
```

### Ключевые дизайн-решения (почему так, а не иначе)

- **`--accent` ≠ `--accent-btn`** в светлой теме: `--accent` (#0d9373) для декоративных элементов (rings, dots, логотип). `--accent-btn` (#0b7b62) — темнее, для кнопок, чтобы белый текст давал 4.5:1 WCAG AA.
- **В тёмной теме `--accent-btn = --accent`**: визуальная согласованность важнее, чем +1.5 к контрасту. Логотип и кнопка одного цвета.
- **`ring-accent/25` НЕ РАБОТАЕТ** в Tailwind с CSS-переменными — использовать `style={{ borderColor: 'var(--accent-ring)' }}`.
- **Тёмная тема: rim-light вместо тени** — `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)` даёт видимый «обод» карточки, т.к. тёмная тень на тёмном фоне невидима.
- **Placeholder = `--ink-subtle`** (4.6:1 тёмная / 5.2:1 светлая) — достаточно для читаемости.
- **python, НЕ python3** — на этой машине `python3` заглушка MS Store. Все скрипты через `python`.

### Шрифт
Nunito, subsets: latin + cyrillic, weights: 400/500/600/700/800, variable: `--font-nunito`.
CSS класс на `<html>`: `font-sans → var(--font-nunito)`.

### Статусы откликов
```ts
sent      → 'Отправлено'  серый
interview → 'Интервью'    янтарный
offer     → 'Оффер'       изумрудный
rejected  → 'Отказ'       розовый/красный
ghosted   → 'Нет ответа'  тихий серый
```
Реализованы как тонированные pill-бейджи с цветной точкой (badge + dot паттерн).

### Компонент StatCard — особенности
- `value === 0` → цвет числа `text-ink-subtle` (нули не кричат цветом)
- `value > 0` → семантический цвет тона (amber/emerald/rose)
- `featured={true}` → `style={{ borderColor: 'var(--accent-ring)' }}` (НЕ через Tailwind ring)
- Иконка «Интервью» → `IconUsers` (два человека = встреча), НЕ лупа

### База данных (Supabase)
```sql
table: public.jobs
  id          uuid  PK
  user_id     uuid  FK→auth.users (cascade delete)
  company     text  NOT NULL
  role        text  NOT NULL
  status      text  CHECK (sent|interview|offer|rejected|ghosted)
  source      text
  date        date
  salary_from text
  salary_to   text
  contact     text
  url         text
  notes       text
  created_at  timestamptz DEFAULT now()

RLS: пользователь видит только свои строки (auth.uid() = user_id)
```

---

## Design pipeline (АВТО-РОУТИНГ СКИЛЛОВ)

> ОБЯЗАТЕЛЬНО для ЛЮБОЙ работы с UI/фронтендом. Claude применяет нужный инструмент сам.

### Установленные инструменты

| Инструмент | Тип | Вызов |
|---|---|---|
| `ui-ux-pro-max` | skill + БД (палитры, шрифты, UX-правила) | `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system` |
| `impeccable` | skill, 23 команды | Skill tool `impeccable` |
| `design-taste-frontend` | skill, anti-slop для лендингов | Skill tool `design-taste-frontend` |
| `awesome-design-md` | 73 готовых DESIGN.md | `.design/awesome-design-md/<brand>/DESIGN.md` |
| `skillui` | CLI-экстрактор дизайн-систем | `skillui --url <site>` |

### Матрица выбора
| Задача | Инструмент |
|---|---|
| Новый продуктовый UI (дашборд, формы, таблицы) | **ui-ux-pro-max** → сборка → impeccable critique → polish |
| Стиль известного бренда (Linear, Notion…) | **awesome-design-md** → `.design/awesome-design-md/<brand>/DESIGN.md` |
| Скопировать живой сайт | **skillui --url** |
| Лендинг/портфолио | **design-taste-frontend** |
| Аудит / ревью существующего UI | **impeccable critique** |
| Полировка, a11y, edge-cases | **impeccable polish/harden** |

### Пайплайн (последовательность)
1. ui-ux-pro-max (направление + токены)
2. Сборка React+Tailwind
3. impeccable critique → polish
4. (для маркетинга) design-taste-frontend anti-slop проход
5. impeccable harden (пустые состояния, overflow, responsive)

---

## Известные проблемы и TODO

### P1 — важно сделать
- [ ] **Вернуть авторизацию**: раскомментировать middleware + добавить `http://localhost:3000/**` в Supabase Redirect URLs
- [ ] **Сортировка колонок** в таблице (клик по заголовку)
- [ ] **Мобильная версия** — `hover:opacity-100` кнопки edit/delete не работают на touch; нужна альтернатива

### P2 — хорошо бы
- [ ] Фильтрация по дате / источнику (сейчас только статус + поиск)
- [ ] Горячая клавиша `N` для новой строки
- [ ] Пагинация / виртуализация при 50+ записях
- [ ] Клик по карточке метрики → фильтр по статусу

### P3 — polish
- [ ] `prefers-color-scheme` в meta для OS-уровня темы
- [ ] `spellCheck={false}` на subtitle paragraph (браузер подчёркивает)

### Принятые компромиссы (не баги)
- Тёмная тема: `accent-btn` = 3.0:1 с белым (WCAG large-text OK, визуальная согласованность важнее)
- Placeholder: 3.74:1 в тёмной (inherent tension: placeholder должен быть светлее текста)
- Логотип-иконка на accent: 3.01:1 (non-text contrast, decorative, WCAG 1.4.11 OK)

---

## Платформа и инструменты

```
OS:      Windows (bash через git-bash)
python:  3.10.9 (команда: python, НЕ python3)
node:    18+
npm:     installed globally: uipro-cli, skillui, impeccable
git:     remote origin → https://github.com/konstantin-fomin/jobtracker.git
gh:      authenticated as Parmezzzan (full repo admin)
```

### Дизайн-инструменты (локально, в .gitignore)
```
.claude/skills/impeccable/          ← v3.5.0, 23 команды
.agents/skills/design-taste-frontend/ ← taste-skill v2
.claude/skills/ui-ux-pro-max/       ← 67 стилей, 96 палитр, 57 пар шрифтов
.design/awesome-design-md/          ← 73 DESIGN.md брендов
```

### impeccable critique snapshot
`.impeccable/critique/2026-06-04T11-50-55Z__src-app-dashboard-page-tsx.md`
Score: 22/40 → после всех правок ориентировочно ~30+/40.
Следующий `/impeccable critique` должен показать рост.
