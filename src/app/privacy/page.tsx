import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — ApplyFlow',
  description: 'Политика конфиденциальности сервиса ApplyFlow',
}

export default function PrivacyPage() {
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
        <article className="prose-custom space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Политика конфиденциальности
            </h1>
            <p className="text-sm text-ink-muted">Последнее обновление: июнь 2026</p>
          </div>

          <Section title="1. Общие положения">
            ApplyFlow (applyflow.lol) — сервис для отслеживания откликов на вакансии.
            Используя сервис, вы соглашаетесь с данной политикой конфиденциальности.
          </Section>

          <Section title="2. Какие данные мы собираем">
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <Li>Имя и email из вашего аккаунта Google или GitHub (при авторизации)</Li>
              <Li>
                Данные, которые вы вводите сами: название компании, должность, статус,
                зарплата, контакты, ссылки, заметки
              </Li>
            </ul>
          </Section>

          <Section title="3. Как мы используем данные">
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <Li>Для идентификации вашего аккаунта</Li>
              <Li>Для хранения и отображения ваших откликов</Li>
              <Li>Мы не продаём и не передаём ваши данные третьим лицам</Li>
            </ul>
          </Section>

          <Section title="4. Где хранятся данные">
            Данные хранятся на серверах Supabase (Европа). Авторизация через Google/GitHub
            осуществляется через их официальные OAuth-сервисы.
          </Section>

          <Section title="5. Удаление данных">
            Вы можете запросить удаление всех ваших данных, написав на{' '}
            <a
              href="mailto:konstantinfomin94@gmail.com"
              className="text-accent hover:underline"
            >
              konstantinfomin94@gmail.com
            </a>
            .
          </Section>

          <Section title="6. Cookies">
            Мы используем cookies только для поддержания сессии авторизации.
          </Section>

          <Section title="7. Контакты">
            По вопросам конфиденциальности:{' '}
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
