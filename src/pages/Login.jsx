import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(135deg, #0d1b4b 0%, #1a237e 50%, #1565c0 100%)",
        }}
      >
        <div>
          <img src="/logo.png" alt="MSH Logo" className="h-16 w-auto mb-8" />
          <h1 className="text-4xl font-bold text-white mb-3">DataFlow</h1>
          <p className="text-blue-300 text-lg">Claims Analysis Platform</p>
          <p className="text-blue-200 mt-4 text-sm leading-relaxed">
            Système d'extraction et d'analyse des données pour le reporting en
            assurance
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          {[
            { icon: "🔒", text: "Connexion sécurisée" },
            { icon: "⚡", text: "Accès aux batch processes" },
            { icon: "📊", text: "Dashboard analytique en temps réel" },
            { icon: "🌍", text: "Multi-centres : Tunis, Dubai, KL, Paris..." },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-blue-100">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="text-blue-400 text-xs">
          © 2026 MSH DiotSiaci Group. Tous droits réservés.
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img src="/logo.png" alt="MSH Logo" className="h-12 w-auto" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
              <p className="text-slate-500 mt-1 text-sm">
                Accédez à votre espace Claims
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-5 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nom@msh-international.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #1a237e, #1565c0)",
                }}
              >
                {loading ? "⏳ Connexion..." : "🔐 Se connecter"}
              </button>
            </form>

            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Admin :{" "}
                <span className="font-mono text-slate-700 font-semibold">
                  admin@dataflow.com
                </span>{" "}
                /{" "}
                <span className="font-mono text-slate-700 font-semibold">
                  Admin123!
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
