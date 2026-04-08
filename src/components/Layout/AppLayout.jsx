import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatbotWidget from '../Chatbot/ChatbotWidget'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  )
}
