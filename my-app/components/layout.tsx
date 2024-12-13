import { Home, BookOpen, User } from 'lucide-react'
import Link from 'next/link'
import HamburgerMenu from './hamburger-menu'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex justify-between items-center h-16 bg-white border-b px-4">
        <Link href="/" className="text-xl font-semibold text-green-600">
          Leftover-to-Meal
        </Link>
        <HamburgerMenu />
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="h-16 bg-white border-t">
        <nav className="flex justify-around items-center h-full">
          <Link href="/" className="text-gray-600 hover:text-green-600">
            <Home size={24} />
          </Link>
          <Link href="/recipes" className="text-gray-600 hover:text-green-600">
            <BookOpen size={24} />
          </Link>
          <Link href="/profile" className="text-gray-600 hover:text-green-600">
            <User size={24} />
          </Link>
        </nav>
      </footer>
    </div>
  )
}

