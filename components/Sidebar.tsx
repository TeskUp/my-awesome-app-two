'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, BookOpen, BarChart3 } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-800 to-purple-900 shadow-2xl z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-700/60">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            Admin Panel
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-all hover:bg-white/25 hover:scale-105 ${
              pathname === '/' ? 'bg-white/20' : 'bg-white/10'
            }`}
          >
            <Newspaper className="w-5 h-5 text-white" />
            News Management
          </Link>
          <Link
            href="/courses"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-all hover:bg-white/25 hover:scale-105 ${
              pathname === '/courses' || pathname?.startsWith('/courses/') ? 'bg-white/20' : 'bg-white/10'
            }`}
          >
            <BookOpen className="w-5 h-5 text-white" />
            Course Management
          </Link>
          <Link
            href="/statistics"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-all hover:bg-white/25 hover:scale-105 ${
              pathname === '/statistics' ? 'bg-white/20' : 'bg-white/10'
            }`}
          >
            <BarChart3 className="w-5 h-5 text-white" />
            Statistika
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-purple-700/60">
          <p className="text-purple-100 text-sm text-center">
            © 2025 Admin Panel
          </p>
        </div>
      </div>
    </aside>
  )
}
