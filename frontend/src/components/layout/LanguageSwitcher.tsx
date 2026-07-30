import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
] as const

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center h-9 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={cn(
            'px-2 h-full rounded-md transition-colors',
            i18n.resolvedLanguage === lang.code
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
