import { useLanguage } from '../context/LanguageContext'

function LanguageToggle({ className = '' }) {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm ${className}`}
      title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <span className="text-lg">{language === 'en' ? '🇪🇬' : '🇬🇧'}</span>
      <span className="font-medium text-gray-700 text-sm">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  )
}

export default LanguageToggle

