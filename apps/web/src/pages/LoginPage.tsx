import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import PageTransition from '../components/PageTransition';
import { PRESET_COLORS } from '../components/UserAvatar';
import { duration } from '../styles/tokens';

const BASE = import.meta.env.VITE_API_URL as string;

const registerSchema = z.object({
  pseudo: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(20, 'Maximum 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Lettres, chiffres, - et _ uniquement'),
  email: z.string().email('Email invalide'),
});

type Tab = 'login' | 'register';

const PROVIDERS = [
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    icon: (
      <svg viewBox="0 0 21 21" className="w-5 h-5" aria-hidden>
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0A66C2" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setToken, fetchMe } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [form, setForm] = useState({ pseudo: '', email: '', avatarPreset: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    fetch(`${BASE}/auth/providers`)
      .then((r) => r.json())
      .then((d) => setConfiguredProviders(d.providers ?? []))
      .catch(() => {});
  }, []);

  const handleOAuth = (provider: string) => {
    window.location.href = `${BASE}/auth/${provider}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = registerSchema.safeParse({ pseudo: form.pseudo, email: form.email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: parsed.data.pseudo,
          email: parsed.data.email,
          avatarUrl: `preset:${form.avatarPreset}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      setToken(data.token);
      await fetchMe();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:p-6 pb-safe">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow }}
          className="w-full max-w-md"
        >
          <Link to="/" className="text-sm font-medium mb-6 inline-block transition-colors duration-base" style={{ color: '#7A7F9B' }}>
            ← Retour
          </Link>

          <div className="card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Bienvenue au QG</h1>
              <p className="text-sm mt-1" style={{ color: '#7A7F9B' }}>Connectez-vous pour accéder à votre profil</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: 'rgba(242,238,227,0.06)' }}>
              {(['login', 'register'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-base"
                  style={tab === t
                    ? { backgroundColor: '#1A2148', color: '#F2EEE3', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
                    : { color: '#7A7F9B' }
                  }
                >
                  {t === 'login' ? 'Connexion' : 'Créer un compte'}
                </button>
              ))}
            </div>

            {/* OAuth buttons */}
            <div className="space-y-2.5 mb-5">
              {PROVIDERS.map((p) => {
                const isConfigured = configuredProviders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => isConfigured && handleOAuth(p.id)}
                    disabled={!isConfigured}
                    title={!isConfigured ? `${p.label} OAuth non configuré` : undefined}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-base"
                    style={isConfigured
                      ? { border: '1px solid rgba(242,238,227,0.14)', backgroundColor: 'rgba(242,238,227,0.04)', color: '#F2EEE3', cursor: 'pointer' }
                      : { border: '1px solid rgba(242,238,227,0.06)', backgroundColor: 'rgba(242,238,227,0.02)', color: '#7A7F9B', cursor: 'not-allowed', opacity: 0.5 }
                    }
                  >
                    {p.icon}
                    <span>Continuer avec {p.label}</span>
                    {!isConfigured && (
                      <span className="ml-auto text-xs font-mono" style={{ color: '#7A7F9B' }}>Non configuré</span>
                    )}
                  </button>
                );
              })}
            </div>

            {tab === 'register' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(242,238,227,0.10)' }} />
                  <span className="text-xs font-medium font-mono" style={{ color: '#7A7F9B' }}>ou créer un compte local</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(242,238,227,0.10)' }} />
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>Pseudo</label>
                    <input
                      className="input-field"
                      placeholder="VotreNom_42"
                      value={form.pseudo}
                      onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                      maxLength={20}
                    />
                    <p className="text-xs mt-1 font-mono" style={{ color: '#7A7F9B' }}>3–20 caractères, lettres / chiffres / - / _</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="vous@exemple.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>Avatar</label>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map((color, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setForm({ ...form, avatarPreset: i })}
                          className="w-9 h-9 rounded-full transition-all duration-fast"
                          style={{
                            backgroundColor: color,
                            outline: form.avatarPreset === i ? `2px solid #F5C76B` : 'none',
                            outlineOffset: '2px',
                            transform: form.avatarPreset === i ? 'scale(1.10)' : 'scale(1)',
                          }}
                          aria-label={`Couleur ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.25)' }}>
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Création en cours…' : 'Créer mon compte'}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
