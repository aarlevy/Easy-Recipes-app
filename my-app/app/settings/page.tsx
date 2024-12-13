import Layout from '../../components/layout'
import { Moon, Bell, Lock, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function Settings() {
  return (
    <Layout>
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell size={20} className="mr-2" />
              <span>Notifications</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Moon size={20} className="mr-2" />
              <span>Dark Mode</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider round"></span>
            </label>
          </div>
          <Link href="/privacy-policy" className="flex items-center text-gray-600">
            <Lock size={20} className="mr-2" />
            Privacy Policy
          </Link>
          <button className="w-full bg-red-500 text-white p-3 rounded-md flex items-center justify-center mt-6">
            <LogOut size={20} className="mr-2" />
            Logout
          </button>
        </div>
        <Link href="/" className="block text-center mt-6 text-green-600">
          Back to Home
        </Link>
      </div>
    </Layout>
  )
}

