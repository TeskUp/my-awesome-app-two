'use client'

import { Newspaper } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-purple-700 shadow-2xl z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            Admin Panel
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/20 text-white font-medium transition-all hover:bg-white/30 hover:scale-105"
          >
            <Newspaper className="w-5 h-5" />
            News Management
          </a>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-white/70 text-sm text-center">
            © 2025 Admin Panel
          </p>
        </div>
      </div>
    </aside>
  )
}
