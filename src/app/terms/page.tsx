import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Пользовательское соглашение — ApplyFlow',
  description: 'Пользовательское соглашение сервиса ApplyFlow',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-hairline bg-surface/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ApplyFlow" className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="font-extrabold text-ink tracking-tight group-hover:text-accent transition-colors">
              ApplyFlow
            </span>
          </Link>
          <Link href="/dashboard" className="btn-ghost h-9 text-sm">
            ← Назад
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <article className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Пользовательское соглашение
            </h1>
            <p className="text-sm text-ink-muted">Последнее обновление: июнь 2026</p>
          </div>

          <Section title="1. Общие положения">
            Используя ApplyFlow (applyflow.lol), вы соглашаетесь с настоящим соглашением.
            Если вы не согласны — пожалуйста, не используйте сервис.
          </Section>

          <Section title="2. Описание сервиса">
            ApplyFlow — бесплатный веб-сервис для личного отслеживания откликов на вакансии.
            Сервис предоставляется «как есть».
          </Section>

          <Section title="3. Аккаунт пользователя">
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <Li>Для использования сервиса необходим аккаунт Google или GitHub</Li>
              <Li>Вы несёте ответственность за безопасность своего аккаунта</Li>
              <Li>Один человек — один аккаунт</Li>
            </ul>
          </Section>

          <Section title="4. Правила использования">
            <p className="mb-2">Запрещено:</p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Использовать сервис в незаконных целях</Li>
              <Li>Пытаться получить доступ к данным других пользователей</Li>
              <Li>Автоматически создавать большое количество записей (спам)</Li>
            </ul>
          </Section>

          <Section title="5. Данные пользователя">
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <Li>Все данные, которые вы вносите, принадлежат вам</Li>
              <Li>Мы не претендуем на права на ваши данные</Li>
              <Li>Вы можете запросить удаление всех данных в любой момент</Li>
            </ul>
          </Section>

          <Section title="6. Ограничение ответственности">
            <p className="mb-2">ApplyFlow не несёт ответственности за:</p>
            <ul className="space-y-1.5 list-none pl-0">
              <Li>Потерю данных по техническим причинам</Li>
              <Li>Перебои в работе сервиса</Li>
              <Li>Любой ущерб, связанный с использованием сервиса</Li>
            </ul>
          </Section>

          <Section title="7. Изменения соглашения">
            Мы можем обновлять это соглашение. Продолжение использования сервиса после
            изменений означает согласие с новой версией.
          </Section>

          <Section title="8. Контакты">
            По вопросам:{' '}
            <a
              href="mailto:konstantinfomin94@gmail.com"
              className="text-accent hover:underline"
            >
              konstantinfomin94@gmail.com
            </a>
          </Section>
        </article>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="text-sm text-ink-muted leading-relaxed">{children}</div>
    </section>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink-muted">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  )
}
