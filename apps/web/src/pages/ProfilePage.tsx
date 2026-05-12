import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import UserAvatar, { PRESET_COLORS } from '../components/UserAvatar';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

const BASE = import.meta.env.VITE_API_URL as string;

const profileSchema = z.object({
  pseudo: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(20, 'Maximum 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Lettres, chiffres, - et _ uniquement')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, fetchMe, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ pseudo: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    setForm({ pseudo: user.pseudo, email: user.email });
    if (user.avatarUrl?.startsWith('preset:')) {
      setSelectedPreset(parseInt(user.avatarUrl.split(':')[1], 10));
    }
  }, [user, navigate]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (form.pseudo && form.pseudo !== user?.pseudo) body.pseudo = form.pseudo;
      if (form.email && form.email !== user?.email) body.email = form.email;
      if (selectedPreset !== null) body.avatarUrl = `preset:${selectedPreset}`;

      const res = await fetch(`${BASE}/auth/profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      await fetchMe();
      setSuccess('Profil mis à jour !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch(`${BASE}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur upload');
      setSelectedPreset(null);
      await fetchMe();
      setSuccess('Avatar mis à jour !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploadLoading(false);
    }
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow }}
          className="w-full max-w-md space-y-4"
        >
          <Link to="/" className="text-navy-600 text-sm font-medium mb-2 inline-block hover:underline">
            ← Retour
          </Link>

          {/* Header card */}
          <div className="card flex items-center gap-4">
            <div className="relative">
              <UserAvatar user={user} size={64} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-navy-600 hover:bg-navy-700 text-white rounded-full flex items-center justify-center shadow-card-hover transition-colors text-xs"
                title="Changer l'avatar"
              >
                {uploadLoading ? '…' : '✎'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-navy-800 truncate">{user.pseudo}</h1>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
              {user.oauthProvider && (
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full capitalize">
                  {user.oauthProvider}
                </span>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-5">
              Modifier le profil
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pseudo</label>
                <input
                  className="input-field"
                  value={form.pseudo}
                  onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Avatar preset picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Couleur d'avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPreset(i)}
                      className={[
                        'w-9 h-9 rounded-full transition-all duration-fast',
                        selectedPreset === i
                          ? 'ring-2 ring-offset-2 ring-navy-500 scale-110'
                          : 'hover:scale-105',
                      ].join(' ')}
                      style={{ backgroundColor: color }}
                      aria-label={`Couleur ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Ou uploadez une image via le bouton ✎ ci-dessus (jpg, png, webp — max 2 Mo)
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
                  >
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="card border-rose-100">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Session
            </h2>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn-danger w-full"
            >
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
