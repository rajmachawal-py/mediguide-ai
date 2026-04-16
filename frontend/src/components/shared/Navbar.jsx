/**
 * MediGuide AI — Navbar
 * Bottom navigation bar (mobile-first, desktop sidebar).
 * Clinical Intelligence Design: white surface with blue-tinted shadow.
 */

import { NavLink } from 'react-router-dom'
import { FiMessageCircle, FiMapPin, FiUser, FiHeart } from 'react-icons/fi'
import { useLanguage } from '../../contexts/LanguageContext'

const navItems = [
  { to: '/chat',      icon: FiMessageCircle, label: 'Chat',      labelHi: 'चैट',     labelMr: 'चॅट' },
  { to: '/hospitals', icon: FiMapPin,        label: 'Hospitals',  labelHi: 'अस्पताल', labelMr: 'रुग्णालय' },
  { to: '/caregiver', icon: FiHeart,         label: 'Caregiver',  labelHi: 'केयरगिवर', labelMr: 'केयरगिव्हर' },
  { to: '/profile',   icon: FiUser,          label: 'Profile',    labelHi: 'प्रोफ़ाइल', labelMr: 'प्रोफाइल' },
]

export default function Navbar() {
  const { language } = useLanguage()

  const getLabel = (item) => {
    if (language === 'hi') return item.labelHi
    if (language === 'mr') return item.labelMr
    return item.label
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/30 shadow-clinical-md">
      <div className="max-w-lg mx-auto flex items-center justify-around py-1.5 px-4 lg:max-w-4xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-clinical transition-all duration-200 ${
                isActive
                  ? 'text-primary-container bg-primary-fixed/40'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">{getLabel(item)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
