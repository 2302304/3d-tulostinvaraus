import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'fi', label: 'FI' },
  { code: 'en', label: 'EN' },
  { code: 'sv', label: 'SV' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  return (
    <div className="flex items-center space-x-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            i18n.language === lang.code
              ? 'bg-primary-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
