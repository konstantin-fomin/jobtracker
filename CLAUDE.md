# JobTracker — project instructions

Сайт для отслеживания откликов на вакансии.
**Стек:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · Supabase · Nunito (Google Fonts, кириллица).
**Репо:** https://github.com/konstantin-fomin/jobtracker (gh account: Parmezzzan, full admin access)

---

## Текущее состояние проекта (обновлено 2026-06-04, сессия 2)

### Что реализовано
- **Дашборд** (`src/app/dashboard/page.tsx`) — метрики (4 StatCard) + таблица откликов
- **Inline add/edit** — две строки `<tr>`:
  - Row 1 (36px): Компания · Должность · Дата · Статус · ЗП · Источник + ✓/✗
  - Row 2 (32px): всегда Ссылка · Контакт · Заметки + активные новые колонки (`--border-tertiary`, h-26px)
  - Hint bar под таблицей: «Tab · Enter · Esc» (11px, только пока форма открыта)
- **Expand panel** — шеврон в последней колонке раскрывает строку ниже (colspan all), там редактируемые Ссылка + Контакт с автосохранением на blur
- **Optimistic delete** — toast «Отклик удалён · Отменить» (4с на undo)
- **Toast** (`Toast.tsx`) — success/error/info, action-кнопка
- **Тёмная + светлая тема** — no-flash через скрипт в `<head>`, localStorage, переключатель в хедере
- **Count-up анимация** метрик с `prefers-reduced-motion`
- **Skeleton loader**
- **Конфигуратор колонок** — кнопка-слайдер в тулбаре открывает панель между тулбаром и таблицей:
  - 13 переключаемых колонок (default ON: Дата/ЗП/Источник; default OFF: остальные 10)
  - Фиксированные Компания/Должность/Статус не показываются в панели
  - Счётчик «N из 13 колонок», кнопка «Сбросить»
  - Клик снаружи закрывает; `onMouseDown stopPropagation` на триггер-кнопке против race condition
  - Сохраняется в `localStorage` (`jt_columns`)
- **Таблица без горизонтального скролла** — `table-layout: fixed` + `<colgroup>` с px-ширинами

### Auth отключена для локальной разработки
В `src/middleware.ts` закомментированы редиректы. Чтобы вернуть:
1. Раскомментировать блоки `if (!user)` и `if (user && /auth)` в middleware.ts
2. В Supabase Dashboard → Authentication → URL Configuration добавить `http://localhost:3000/**`

---

## Структура файлов

```
src/
  app/
    dashboard/page.tsx     ← главная страница (один файл, ~330 строк)
    auth/page.tsx          ← логин (Google + GitHub OAuth)
    auth/callback/route.ts
    layout.tsx             ← Nunito font, no-flash theme script
    globals.css            ← ВСЕ design tokens + компоненты + .table-clip
    page.tsx               ← redirect → /dashboard
  components/
    StatCard.tsx           ← карточка метрики (unified, без tone/featured)
    StatusBadge.tsx        ← цветной pill-бейдж статуса
    JobRow.tsx             ← строка таблицы (view + inline 2-row edit + expand panel)
    ColumnPanel.tsx        ← панель конфигуратора колонок
    ThemeToggle.tsx        ← переключатель темы
    Toast.tsx              ← toast-уведомления
    icons.tsx              ← SVG-иконки (Lucide-style, без lucide-react dep)
  lib/
    supabase.ts            ← browser client
    types.ts               ← Job, JobInsert, Status, ColumnKey, все META/OPTIONS
    useColumns.ts          ← хук колонок + localStorage
    useCountUp.ts          ← анимация чисел
    useToast.ts            ← хук для toast
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
  contact           text
  url               text
  notes             text
  created_at        timestamptz DEFAULT now()
  -- Новые колонки (миграция выполнена):
  stage             text   -- hr|tech|final|offer_negotiation
  next_action       text
  next_action_date  date
  work_format       text   -- office|remote|hybrid
  city              text
  rating            int    -- 1-5
  referred_by       text
  reject_reason     text   -- no_response|skills|salary|culture|other
  updated_at        timestamptz  -- auto-managed trigger

table: public.job_status_history  -- auto-filled by trigger on status/stage change

RLS: пользователь видит только свои строки (auth.uid() = user_id)
```

Запрос: `select('*')` — тянет все поля включая новые.

---

## Колонки таблицы

### Фиксированные (всегда видимы, не в панели конфигуратора)
- Компания, Должность, Статус

### Переключаемые (управляются через ColumnPanel → localStorage `jt_columns`)

| ColumnKey          | Заголовок        | Default | Width  |
|--------------------|------------------|---------|--------|
| `date`             | Дата             | ON      | 90px   |
| `salary`           | ЗП               | ON      | 120px  |
| `source`           | Источник         | ON      | 100px  |
| `url`              | Ссылка           | OFF     | 80px   |
| `contact`          | Контакт          | OFF     | 100px  |
| `notes`            | Заметки          | OFF     | 120px  |
| `stage`            | Этап             | OFF     | 100px  |
| `work_format`      | Формат работы    | OFF     | 100px  |
| `city`             | Город            | OFF     | 90px   |
| `next_action`      | Следующий шаг    | OFF     | 120px  |
| `next_action_date` | Дата шага        | OFF     | 90px   |
| `rating`           | Оценка           | OFF     | 80px   |
| `reject_reason`    | Причина отказа   | OFF     | 110px  |

Фиксированные — company (flex), role (flex), status (100px), actions (56px).

### Порядок колонок в таблице (FULL_COL_ORDER в page.tsx)
```
company → role → date → status → salary → source →
url → contact → notes →
stage → work_format → city →
next_action → next_action_date →
rating → reject_reason
```

---

## Inline add/edit форма — архитектура

### Row 1 (только core поля, 36px)
`Компания | Должность | [Дата] | Статус | [ЗП от/до] | [Источник] | [empty cells] | ✓✗`

- `[в квадратных скобках]` = рендерится только если колонка активна
- Для каждой активной опциональной колонки рендерится пустой `<td />` — нужно для `table-layout:fixed`
- Цвет select статуса = цвет текущего значения (inline style)

### Row 2 (опциональные поля, 32px, colSpan=all)
- **Всегда** показывает: Ссылка · Контакт · Заметки (`.optional-input`, h-26px, `--border-tertiary`)
- **Только если колонка активна**: Этап · Формат · Город · Следующий шаг · Дата шага · Оценка (star picker) · Причина отказа (только если status=rejected)
- «необязательно» — правый край

### Tab order (явные tabIndex)
1 Компания → 2 Должность → 3 Дата → 4 Статус → 5 ЗП от → 6 ЗП до → 7 Источник →
8 Ссылка → 9 Контакт → 10 Заметки → 20 Сохранить → 21 Отмена

### Expand panel (раскрывается шевроном в конце строки)
- Только одна строка раскрыта одновременно (`expandedId: string | null` в page.tsx)
- Показывает Ссылка на вакансию + Контакт с автосохранением на blur
- `onSaveDetails` вызывается только когда значение изменилось (ref `lastSaved`)

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
--border-tertiary: var(--hairline)  /* тихий бордер для optional-input */
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
- `.optional-input` — приглушённый инпут row 2 (h-26px, `--border-tertiary`)
- `.invalid` — красный бордер для cell-input с ошибкой
- `.table-clip` — `table-layout:fixed; width:100%` + `overflow:hidden; ellipsis; nowrap` на всех ячейках

### Статусы (STATUS_META в types.ts)
```
sent      → 'Отправлено'  stone
interview → 'Интервью'    amber
offer     → 'Оффер'       emerald
rejected  → 'Отказ'       rose
ghosted   → 'Нет ответа'  тихий stone
```

### Форматы работы (WORK_FORMAT_BADGE в types.ts)
```
office → 'Офис'      blue tint
remote → 'Удалённо'  emerald tint
hybrid → 'Гибрид'    amber tint
```

### Ключевые архитектурные решения

- **`ring-accent/25` НЕ РАБОТАЕТ** в Tailwind с CSS-переменными → `style={{ borderColor: 'var(--accent-ring)' }}`
- **Тёмная тема: rim-light** вместо тени — `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)`
- **`table-layout: fixed` + `<colgroup>`** — единственный надёжный способ зафиксировать ширины колонок без горизонтального скролла
- **Компания + Должность без явной ширины** в colgroup → занимают оставшееся место поровну
- **Salary = 120px** (не 100 как в спеке) — два инпута «от»/«до» в 100px нечитаемы
- **ColumnPanel**: кнопка-триггер использует `onMouseDown stopPropagation` чтобы click-outside handler в панели не закрывал её раньше чем сработает onClick-toggle
- **`set` функция в JobRow** использует `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + `v: any` — необходимо для единого обработчика строковых и числовых полей (rating)
- **`lucide-react` НЕ установлен** — все иконки в `icons.tsx` (Lucide-style SVG, currentColor)
- **`python`, НЕ `python3`** — на этой машине `python3` заглушка MS Store

---

## Компоненты — краткий справочник

### `JobRow` props
```typescript
interface Props {
  job?: Job               // undefined = add mode
  editing: boolean
  expanded?: boolean
  activeColumns: ColumnKey[]
  onStartEdit: () => void
  onCancel: () => void
  onSubmit: (data: JobInsert) => Promise<void>
  onDelete?: () => void
  onToggleExpand?: () => void
  onSaveDetails?: (patch: { url: string; contact: string }) => Promise<void>
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

### `useColumns()` возвращает
```typescript
{ active: ColumnKey[], toggle: (key) => void, reset: () => void }
```

### `StatCard` props (упрощённый, без tone/featured)
```typescript
interface Props { label: string; value: number; icon: ReactNode }
```

---

## page.tsx — ключевые state-переменные

```typescript
const [user, setUser]               // Supabase User | null
const [jobs, setJobs]               // Job[] (весь список)
const [loading, setLoading]         // skeleton
const [search, setSearch]           // поиск (company | role)
const [filterStatus, setFilterStatus] // Status | ''
const [editId, setEditId]           // string | 'new' | null
const [expandedId, setExpandedId]   // string | null (expand panel)
const [panelOpen, setPanelOpen]     // boolean (column configurator)
const { active: activeColumns, toggle: toggleColumn, reset: resetColumns } = useColumns()
const pendingDeletes                // useRef<Map<string, ReturnType<setTimeout>>>
```

---

## TODO (актуальные)

### P1
- [ ] **Вернуть авторизацию** (middleware раскомментировать)
- [ ] **Сортировка колонок** по клику на заголовок
- [ ] **Мобильная версия** — кнопки edit/delete не работают на touch

### P2
- [ ] Фильтрация по дате / источнику / формату / городу
- [ ] Клик по StatCard → фильтр по статусу
- [ ] Горячая клавиша `N` для новой строки
- [ ] Пагинация / виртуализация при 50+ записях
- [ ] История статусов (`job_status_history`) — UI для просмотра

### P3
- [ ] `prefers-color-scheme` в meta
- [ ] `spellCheck={false}` на подзаголовке страницы
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

Проблема, которая уже ловилась: после `npm.cmd run build` живой `next dev` на `localhost:3005` начинал отдавать голый HTML без Tailwind/CSS или ошибку вида `Cannot find module './276.js'`. Причина — `next dev` и `next build` писали в один и тот же `.next`, из-за чего dev-сервер смотрел на рассинхронизированные production-артефакты.

Принятое решение:
- `next.config.js` задаёт разные output-директории:
  - dev server (`PHASE_DEVELOPMENT_SERVER`) → `.next`
  - production build → `.next-build`
- `tsconfig.json` включает и `.next/types/**/*.ts`, и `.next-build/types/**/*.ts`
- Для проверки использовать `npm.cmd run build`, не `npm run build` в PowerShell, если `npm.ps1` блокируется policy.
- Preview на 3005 можно поднимать так: `node node_modules\next\dist\bin\next dev -p 3005`

Проверенный сценарий: при живом dev server на `http://localhost:3005/dashboard` запуск `npm.cmd run build` больше не ломает CSS; dashboard и `/_next/static/css/app/layout.css` остаются `200`.

### Дизайн-инструменты (локально, в .gitignore)
```
.claude/skills/impeccable/           ← v3.5.0, 23 команды
.agents/skills/design-taste-frontend/
.claude/skills/ui-ux-pro-max/
.design/awesome-design-md/           ← 73 DESIGN.md брендов
.claude/launch.json                  ← preview server (port 3005)
```
