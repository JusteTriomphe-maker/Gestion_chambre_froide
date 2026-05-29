import { Link } from 'react-router-dom' // Placeholder - use React state for demo
import { cn } from '@/lib/utils'

interface SidebarProps {
  navigation: Array<{ name: string, href: string, current: boolean }>
  user: { name: string, role: string }
  currentPage: string
  onNavigate: (page: string) => void
}

export function Sidebar({ navigation, user, currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Chambre Froide</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => onNavigate(item.href)}
                className={cn(
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 w-full text-left`,
                  item.current
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">Gérant</p>
          </div>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

