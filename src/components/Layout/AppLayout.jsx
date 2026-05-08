import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import FloatingChatButton from "../FloatingChat/FloatingChatButton";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div className="w-1 h-8 rounded-md bg-[linear-gradient(180deg,#08122f_0%,#f4b183_100%)] mr-3" />
            <p className="text-xs text-slate-500 capitalize">{today}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                {user?.fullName}
              </p>
              <p className="text-xs text-slate-400">
                {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#08122f] to-[#f4b183] flex items-center justify-center text-white font-bold text-sm shadow">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <FloatingChatButton />
    </div>
  );
}
