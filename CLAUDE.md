# ApplyFlow — project instructions

Сайт для отслеживания откликов на вакансии.
**Стек:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · Supabase · Nunito (Google Fonts, кириллица).
**Репо:** https://github.com/konstantin-fomin/jobtracker (gh account: Parmezzzan, full admin access)

---

## Текущее состояние проекта (обновлено 2026-06-08, сессия 3)

### Что реализовано
- **Дашборд** (`src/app/dashboard/page.tsx`) — метрики (5 StatCard с кликом-фильтром) + таблица откликов (~1160 строк)
- **Форма добавления/редактирования** (`JobAddForm.tsx`) — карточка над таблицей:
  - Основная часть: Компания · Должность · Статус · Дата · Источник · Ссылка · ЗП от · ЗП до · Валюта
  - «Детали» (раскрываемый аккордеон): Следующий шаг · Дата шага · Контакт · Этап · Формат · Город · Оценка · Кто рекомендовал · Причина отказа (если rejected) · Заметки
  - Enter → submit, Escape → cancel, touched/errors для company/role
- **Expand panel** — шеврон в последней колонке раскрывает строку ниже (colspan all): полный детальный вид + кнопки Редактировать/Удалить (или Восстановить/Удалить навсегда для корзины)
- **Quick status change** — клик по badge статуса в таблице открывает portal-dropdown для смены без открытия формы
- **Salary currency** — поле `salary_currency: RUB|USD|EUR` на каждом отклике, отображается в таблице и деталях (напр. `250к–330к RUB`)
- **Soft delete + Trash** — «удалённые» строки помечаются `deleted_at`, фильтр «Удалённые» в quick-chips; восстановление + permanent delete из expand panel
- **Optimistic delete** — toast «Отклик удалён · Отменить» (4с на undo)
- **Toast** (`Toast.tsx`) — success/error/info, action-кнопка
- **Тёмная + светлая тема** — no-flash через скрипт в `<head>`, localStorage, переключатель в хедере
- **Count-up анимация** метрик с `prefers-reduced-motion`
- **Skeleton loader** + состояния ошибки (auth/jobs) + empty state
- **Конфигуратор колонок** — кнопка-слайдер в тулбаре:
  - 14 переключаемых колонок (default ON: Дата/ЗП/Источник; default OFF: остальные 11)
  - Счётчик «N из 14 колонок», кнопка «Сбросить», пресеты
  - Сохраняется в `localStorage` (`jt_columns`)
- **Сортировка** — клик по заголовку колонки (asc/desc/сброс); отдельный режим «urgent» по дате следующего шага
- **Quick-фильтры (chips)** — Все · Активные · Ждём ответа · Интервью · Офферы · Архив · Удалённые
- **Поиск** по company + role
- **Фильтр по статусу** (select)
- **Фильтр «Нужно действие»** (next_action_date просрочен)
- **Auth** — Google + GitHub OAuth, middleware редиректы включены, `redirectWithSession` копирует cookies
- **Demo mode** — `NODE_ENV=development && NEXT_PUBLIC_DEMO_JOBS=true` показывает 12 mock-откликов без Supabase
- **Брендинг ApplyFlow** — логотип (`/logo.png`), favicon, тайтл «ApplyFlow — трекер откликов»
- **Статические страницы** — `/privacy` (политика) и `/terms` (соглашение) со ссылками в футере
- **Нормализация данных** — `normalizeJob(RawJob): Job` на границе чтения/записи Supabase

### Auth
Middleware (`src/middleware.ts`) включён:
- `/dashboard` без сессии → редирект на `/auth`
- `/auth` с сессией → редирект на `/dashboard`

Для локальной разработки без авторизации: запустить с `NEXT_PUBLIC_DEMO_JOBS=true`.

---

## Структура файлов

```
src/
  app/
    dashboard/page.tsx     ← главная страница (~1160 строк)
    auth/page.tsx          ← логин (Google + GitHub OAuth)
    auth/callback/route.ts
    privacy/page.tsx       ← статическая страница политики
    terms/page.tsx         ← статическая страница соглашения
    layout.tsx             ← Nunito font, no-flash theme script, favicon
    globals.css            ← ВСЕ design tokens + компоненты + .table-clip
    page.tsx               ← redirect → /dashboard
  components/
    JobAddForm.tsx         ← форма добавления/редактирования (карточка над таблицей)
    JobRow.tsx             ← строка таблицы (view + expand panel + StatusPicker)
    StatCard.tsx           ← карточка метрики (с onClick-фильтром)
    StatusBadge.tsx        ← цветной pill-бейдж статуса
    ColumnPanel.tsx        ← панель конфигуратора колонок
    ThemeToggle.tsx        ← переключатель темы
    Toast.tsx              ← toast-уведомления
    icons.tsx              ← SVG-иконки (Lucide-style, без lucide-react dep)
  lib/
    supabase.ts            ← browser client
    types.ts               ← Job, JobInsert, RawJob, Status, SalaryCurrency, ColumnKey, normalizeJob, все META/OPTIONS
    mockJobs.ts            ← 12 mock-откликов для demo mode
    useColumns.ts          ← хук колонок + localStorage + пресеты
    useCountUp.ts          ← анимация чисел
    useToast.ts            ← хук для toast
  middleware.ts            ← auth-редиректы + refreshWithSession
```

---

## База данных (Supabase)

```sql
table: public.jobs
  id                uuid  PK default gen_random_uuid()
  user_id           uuid  FK→auth.users (cascade delete) NOT NULL
  company           text  NOT NULL
  role              text  NOT NULL
  status            text  CHECK (sent|interview|offer|rejected|ghosted) default 'sent'
  source            text
  date              date
  salary_from       text
  salary_to         text
  salary_currency   text  NOT NULL default 'RUB' CHECK (RUB|USD|EUR)
  contact           text
  url               text
  notes             text
  stage             text   -- hr|tech|final|offer_negotiation
  next_action       text
  next_action_date  date
  work_format       text   -- office|remote|hybrid
  city              text
  rating            int    -- 1-5 (check constraint)
  referred_by       text
  reject_reason     text   -- no_response|skills|salary|culture|other
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz  -- auto-managed trigger (set_updated_at)
  deleted_at        timestamptz  -- null = активный, не null = в корзине

table: public.job_status_history  -- auto-filled by trigger on status/stage change
  id          uuid PK
  job_id      uuid FK→jobs
  user_id     uuid FK→auth.users
  status      text
  stage       text
  changed_at  timestamptz
  note        text

-- Triggers:
--   jobs_updated_at       BEFORE UPDATE → set updated_at = now()
--   jobs_status_history   AFTER UPDATE  → insert into job_status_history on status/stage change

-- RLS: пользователь видит только свои строки (auth.uid() = user_id)
-- GRANTS (обязательно — без них триггер падает с 42501):
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
--   GRANT SELECT, INSERT ON public.job_status_history TO authenticated;
```

Запрос: `select('*')` — тянет все поля.

### Миграции (в supabase/migrations/)
```
202606050001_add_job_details.sql          ← stage, next_action, work_format, city, rating, ...
202606050002_sync_jobs_workflow_schema.sql ← идемпотентная синхронизация
202606050003_add_jobs_deleted_at.sql      ← deleted_at + индекс
202606050004_add_salary_currency.sql      ← salary_currency NOT NULL DEFAULT 'RUB'
202606050005_grant_history_permissions.sql ← GRANT на jobs + job_status_history
```

⚠️ После деплоя на новый Supabase-проект: применить все миграции в SQL Editor.

---

## Колонки таблицы

### Фиксированные (всегда видимы, не в панели конфигуратора)
Компания (flex) · Должность (flex) · Статус (112px) · Actions (56px)

### Переключаемые (ColumnPanel → localStorage `jt_columns`)

| ColumnKey          | Заголовок      | Default | Width  |
|--------------------|----------------|---------|--------|
| `date`             | Дата           | ON      | 84px   |
| `salary`           | ЗП             | ON      | 156px  |
| `source`           | Источник       | ON      | 96px   |
| `url`              | Ссылка         | OFF     | 80px   |
| `contact`          | Контакт        | OFF     | 100px  |
| `notes`            | Заметки        | OFF     | 120px  |
| `stage`            | Этап           | OFF     | 100px  |
| `work_format`      | Формат         | OFF     | 100px  |
| `city`             | Город          | OFF     | 90px   |
| `next_action`      | Следующий шаг  | OFF     | 168px  |
| `next_action_date` | Дата шага      | OFF     | 90px   |
| `rating`           | Оценка         | OFF     | 80px   |
| `reject_reason`    | Причина отказа | OFF     | 110px  |
| `updated_at`       | Изменено       | OFF     | 100px  |

### Порядок колонок (FULL_COL_ORDER в page.tsx)
```
company → role → date → status → salary → source →
url → contact → notes →
stage → work_format → city →
next_action → next_action_date →
rating → reject_reason → updated_at
```

---

## JobAddForm — архитектура

Отдельный компонент-карточка (`src/components/JobAddForm.tsx`), рендерится над таблицей при `editId !== null`.

### Основная секция (grid lg:4-col, всегда видима)
```
Row 1: Компания ×2        | Должность ×2
Row 2: Статус             | Дата отклика  | Источник     | Ссылка
Row 3: ЗП от              | ЗП до         | Валюта       | (пусто)
```

### Детали (аккордеон, скрыт по умолчанию)
```
Следующий шаг ×3          | Дата шага
Контакт       | Этап      | Формат       | Город
Оценка        | Кто рекомендовал
Причина отказа (только если status = rejected)
Заметки ×3
```

### Поведение
- **Enter** в text/number/url input → submit (если company + role заполнены)
- **Escape** → cancel
- Валидация: только company + role обязательны; red border + сообщение при submitAttempted/touched
- `salary_currency` всегда имеет значение (default 'RUB'), не nullable
- `normalizeDate` превращает пустую дату в null перед submit

### Expand panel (JobRow)
- Шеврон раскрывает tr ниже (colspan all) с полным детальным видом
- Активные строки: кнопки «Редактировать» + «Удалить» (danger on hover)
- Удалённые строки: кнопки «Восстановить» + «Удалить навсегда»
- Только одна строка раскрыта одновременно (`expandedId` в page.tsx)

---

## Design System

### Tokens (CSS custom properties в globals.css)

#### Светлая тема
```css
--bg:              #faf9f8
--surface:         #ffffff
--surface-2:       #f6f5f4
--hairline:        #eae8e3
--hairline-strong: #dcd9d2
--border-tertiary: var(--hairline)
--ink:             #37352f   /* 12.3:1 ✓ */
--ink-muted:       #6b685f   /*  5.6:1 ✓ */
--ink-subtle:      #706c64   /*  5.2:1 ✓ */
--accent:          #0d9373
--accent-btn:      #0b7b62   /* 4.71:1 с белым ✓ WCAG AA */
--accent-soft:     rgba(13, 147, 115, 0.10)
--accent-ring:     rgba(13, 147, 115, 0.40)
--input-bg:        #ffffff
--row-edit-bg:     rgba(13, 147, 115, 0.04)
```

#### Тёмная тема (`.dark` на `<html>`)
```css
--bg:              #0f0e0d
--surface:         #1c1b18
--surface-2:       #252320
--hairline:        #302e29
--hairline-strong: #3f3c36
--border-tertiary: var(--hairline)
--ink:             #f0eeeb   /* 14.9:1 ✓ */
--ink-muted:       #9e9b94   /*  6.2:1 ✓ */
--ink-subtle:      #88847c   /*  4.6:1 ✓ */
--accent:          #1aa883
--accent-btn:      #1aa883   /* 3.0:1, large-text OK */
--input-bg:        #2e2c28
--row-edit-bg:     rgba(26, 168, 131, 0.08)
```

### CSS-классы в globals.css
- `.btn`, `.btn-primary`, `.btn-ghost` — кнопки
- `.card` — карточка с border + shadow
- `.badge` — pill-бейдж (статусы, форматы работы)
- `.icon-btn` — ghost icon button
- `.cell-input` — инпут внутри таблицы (h-8, rounded-md)
- `.optional-input` — приглушённый инпут (h-26px, `--border-tertiary`)
- `.invalid-field` — красный бордер для инпута с ошибкой
- `.table-clip` — `table-layout:fixed; width:100%` + `overflow:hidden; ellipsis; nowrap` на всех ячейках

### Статусы (STATUS_META в types.ts)
```
sent      → 'Отправлено' / 'Отклик'    sky/cyan
interview → 'Интервью'                  violet
offer     → 'Оффер'                     emerald/teal
rejected  → 'Отказ'                     rose
ghosted   → 'Нет ответа'               slate (тихий)
```

### Форматы работы (WORK_FORMAT_BADGE в types.ts)
```
office → 'Офис'      sky/cyan tint
remote → 'Удалённо'  emerald/teal tint
hybrid → 'Гибрид'    amber tint
```

### Валюты (CURRENCY_OPTIONS в types.ts)
```
RUB | USD | EUR
```
`salary_currency: SalaryCurrency` — обязательное поле, не nullable, default 'RUB'.
Отображение: `250к–330к RUB`, `3к–4к USD`. Пустая зарплата → `—` (без кода).

### Ключевые архитектурные решения
- **`ring-accent/25` НЕ РАБОТАЕТ** в Tailwind с CSS-переменными → `style={{ borderColor: 'var(--accent-ring)' }}`
- **Тёмная тема: rim-light** вместо тени — `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)`
- **`table-layout: fixed` + `<colgroup>`** — единственный надёжный способ зафиксировать ширины без горизонтального скролла
- **Компания + Должность без явной ширины** в colgroup → занимают оставшееся место поровну
- **Salary column = 156px** — чтобы `250к–330к RUB` помещался без обрезания
- **StatusPicker** использует `createPortal` с `position:fixed` — избегает overflow:hidden таблицы; закрывается на scroll/resize
- **ColumnPanel** триггер: `onMouseDown stopPropagation` против race condition с click-outside
- **`lucide-react` НЕ установлен** — все иконки в `icons.tsx` (Lucide-style SVG, currentColor)
- **`normalizeJob`** — единая точка нормализации RawJob→Job; вызывается при read и insert из Supabase
- **`isSalaryCurrency`** — type guard без `any`, используется в normalizeJob
- **GRANTS обязательны**: RLS-политики проверяются ПОСЛЕ table-level privileges. Без `GRANT INSERT ON job_status_history TO authenticated` триггер падает с 42501
- **Demo mode**: двойная защита `NODE_ENV==='development' && NEXT_PUBLIC_DEMO_JOBS==='true'`; bypass middleware добавляется вручную при необходимости (не коммитить)

---

## Компоненты — краткий справочник

### `JobAddForm` props
```typescript
interface Props {
  mode?: 'create' | 'edit'      // default: 'create'
  initialValue?: JobInsert
  onSubmit: (data: JobInsert) => Promise<void>
  onCancel: () => void
}
```

### `JobRow` props
```typescript
interface Props {
  job: Job                             // required (всегда нормализован)
  expanded?: boolean
  deleted?: boolean
  activeColumns: ColumnKey[]
  onStartEdit: () => void
  onChangeStatus?: (status: Status) => void
  onDelete?: () => void
  onRestore?: () => void
  onPermanentDelete?: () => void
  onToggleExpand?: () => void
}
```

### `ColumnPanel` props
```typescript
interface Props {
  active: ColumnKey[]
  onToggle: (key: ColumnKey) => void
  onReset: () => void
  onClose: () => void
}
```

### `StatCard` props
```typescript
interface Props {
  label: string
  value: number
  icon: ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}
```

### `useColumns()` возвращает
```typescript
{ active: ColumnKey[], toggle: (key) => void, reset: () => void, setPreset: (keys) => void }
```

---

## page.tsx — ключевые state-переменные

```typescript
const supabase                          // SupabaseClient | null (null в demo mode)
const [user, setUser]                   // User | null
const [jobs, setJobs]                   // Job[] (весь список, включая deleted)
const [loading, setLoading]             // skeleton
const [loadError, setLoadError]         // 'auth' | 'jobs' | null
const [search, setSearch]               // поиск по company | role
const [filterStatus, setFilterStatus]   // Status | ''
const [needsActionOnly, setNeedsActionOnly] // фильтр по просроченному next_action
const [sortMode, setSortMode]           // 'default' | 'urgent'
const [headerSort, setHeaderSort]       // { key: SortKey, direction: 'asc'|'desc' } | null
const [quickFilter, setQuickFilter]     // 'all'|'active'|'waiting'|'interview'|'offer'|'archive'|'deleted'
const [editId, setEditId]               // string | 'new' | null
const [expandedId, setExpandedId]       // string | null
const [panelOpen, setPanelOpen]         // boolean (column configurator)
const { active: activeColumns, toggle: toggleColumn, reset: resetColumns, setPreset: setColumnPreset } = useColumns()
const { toasts, show: showToast, dismiss: dismissToast } = useToast()
const pendingDeletes                    // useRef<Map<string, ReturnType<setTimeout>>>
```

### Ключевые функции
```typescript
load()                                  // загрузка jobs + user из Supabase
createJob(data: JobInsert)              // insert + normalizeJob + optimistic
updateJob(id, data: JobInsert)          // update + optimistic merge
updateJobStatus(id, status)            // быстрая смена статуса без формы
deleteJob(id)                           // soft delete (deleted_at = now) + undo toast
restoreJob(id)                          // deleted_at = null
permanentlyDeleteJob(id)                // hard delete + window.confirm
toJobInsert(job: Job): JobInsert        // конвертация для передачи в форму
```

---

## TODO (актуальные)

### P1
- [ ] **Применить миграцию `202606050004` к prod Supabase** (salary_currency)
- [ ] **Мобильная версия** — touch-доступность кнопок

### P2
- [ ] Фильтрация по дате / источнику / формату / городу
- [ ] Горячая клавиша `N` для новой строки
- [ ] Пагинация / виртуализация при 50+ записях
- [ ] История статусов (`job_status_history`) — UI для просмотра
- [ ] Заменить `window.confirm` (permanent delete) на кастомный confirm-диалог

### P3
- [ ] `prefers-color-scheme` в meta
- [ ] Мобильная адаптация expand panel

---

## Платформа

```
OS:      Windows (bash через git-bash)
python:  3.10.9 (команда: python, НЕ python3)
node:    18+
git:     remote → https://github.com/konstantin-fomin/jobtracker.git
gh:      authenticated as Parmezzzan (full repo admin)
dev:     npm run dev  (порт 3000, или 3005 для preview-сервера)
```

### Локальный preview и cache Next.js

`next.config.js` разделяет директории по `NEXT_LOCAL_DIST_DIR=1`:
- dev server → `.next`
- production build → `.next-build`
- В production (Vercel) — дефолтный `.next` (флаг не выставлен)

Команда сборки: `npm.cmd run build` (не `npm run build` в PowerShell если блокируется policy).
Preview на 3005: `NEXT_PUBLIC_DEMO_JOBS=true node node_modules\next\dist\bin\next dev -p 3005`

### Дизайн-инструменты (локально, в .gitignore)
```
.claude/skills/impeccable/
.agents/skills/design-taste-frontend/
.claude/skills/ui-ux-pro-max/
.design/awesome-design-md/
.claude/launch.json                  ← preview server (port 3005)
```
