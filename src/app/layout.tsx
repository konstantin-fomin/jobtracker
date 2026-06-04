import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobTracker — поиск работы',
  description: 'Отслеживайте отклики на вакансии в одном месте',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  )
}
