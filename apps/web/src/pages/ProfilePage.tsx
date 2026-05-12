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
          <Link to="/" className="text-sm font-medium mb-2 inline-block transition-colors duration-base" style={{ color: '#7A7F9B' }}>
            ← Retour
          </Link>

          {/* Header card */}
          <div className="card flex items-center gap-4">
            <div className="relative">
              <UserAvatar user={user} size={64} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors"
                style={{ backgroundColor: '#F5C76B', color: '#0B1026' }}
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
              <h1 className="text-xl font-bold truncate" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>{user.pseudo}</h1>
              <p className="text-sm truncate" style={{ color: '#7A7F9B' }}>{user.email}</p>
              {user.oauthProvider && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize font-mono" style={{ backgroundColor: 'rgba(245,199,107,0.12)', color: '#F5C76B', border: '1px solid rgba(245,199,107,0.3)' }}>
                  {user.oauthProvider}
                </span>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-5 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.14em' }}>
              Modifier le profil
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>Pseudo</label>
                <input
                  className="input-field"
                  value={form.pseudo}
                  onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Avatar preset picker */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>
                  Couleur d'avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPreset(i)}
                      className="w-9 h-9 rounded-full transition-all duration-fast"
                      style={{
                        backgroundColor: color,
                        outline: selectedPreset === i ? '2px solid #F5C76B' : 'none',
                        outlineOffset: '2px',
                        transform: selectedPreset === i ? 'scale(1.10)' : 'scale(1)',
                      }}
                      aria-label={`Couleur ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1.5 font-mono" style={{ color: '#7A7F9B' }}>
                  Ou uploadez une image via le bouton ✎ ci-dessus (jpg, png, webp — max 2 Mo)
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm rounded-lg px-3 py-2"
                    style={{ color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.25)' }}
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm rounded-lg px-3 py-2"
                    style={{ color: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.10)', border: '1px solid rgba(245,199,107,0.25)' }}
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

          {/* Session */}
          <div className="card" style={{ borderColor: 'rgba(255,107,91,0.2)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.14em' }}>
              Session
            </h2>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-base"
              style={{ color: '#FF6B5B', border: '1px solid rgba(255,107,91,0.3)', backgroundColor: 'rgba(255,107,91,0.06)' }}
            >
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
