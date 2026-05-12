import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { api } from '../lib/api';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import PageTransition from '../components/PageTransition';

const schema = z.object({
  hostNickname: z.string().min(2, 'Minimum 2 caractères').max(20),
  difficulty: z.enum(['FACILE', 'MOYEN', 'DIFFICILE']),
  totalQuestions: z.number().min(5).max(20),
  speedBonus: z.boolean(),
});

export default function CreatePage() {
  const navigate = useNavigate();
  const setGameState = useGameStore((s) => s.setGameState);

  const [form, setForm] = useState({
    hostNickname: '',
    difficulty: 'MOYEN' as 'FACILE' | 'MOYEN' | 'DIFFICILE',
    totalQuestions: 10,
    speedBonus: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const game = await api.createGame({
        difficulty: parsed.data.difficulty,
        totalQuestions: parsed.data.totalQuestions,
        speedBonus: parsed.data.speedBonus,
      });

      setGameState({
        gameId: game.id,
        code: game.code,
        status: 'LOBBY',
        difficulty: game.difficulty as 'FACILE' | 'MOYEN' | 'DIFFICILE',
        speedBonus: game.speedBonus,
        totalQuestions: game.totalQuestions,
        hostId: null,
        players: [],
        myPlayerId: null,
        isHost: true,
      });

      const socket = getSocket();
      socket.connect();
      socket.emit('game:join', { code: game.code, nickname: parsed.data.hostNickname });

      socket.once('game:state', (state) => {
        setGameState({
          myPlayerId: state.yourPlayerId,
          isHost: state.isHost,
          players: state.players,
        });
        navigate(`/lobby/${game.code}`);
      });

      socket.once('game:error', (err: { message: string }) => {
        setError(err.message);
        setLoading(false);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      setLoading(false);
    }
  };

  const difficultyConfig = {
    FACILE: { label: 'Facile', color: 'emerald' },
    MOYEN: { label: 'Moyen', color: 'amber' },
    DIFFICILE: { label: 'Difficile', color: 'rose' },
  } as const;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="text-sm font-medium mb-6 inline-block transition-colors duration-base"
            style={{ color: '#7A7F9B' }}
          >
            ← Retour
          </Link>

          <div className="card">
            <h1 className="text-2xl font-bold mb-6" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Créer une partie</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Votre pseudo
                </label>
                <input
                  className="input-field"
                  placeholder="Ex: Marie Curie"
                  value={form.hostNickname}
                  onChange={(e) => setForm({ ...form, hostNickname: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>
                  Difficulté
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FACILE', 'MOYEN', 'DIFFICILE'] as const).map((d) => {
                    const isSelected = form.difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, difficulty: d })}
                        className="py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-base"
                        style={isSelected
                          ? { borderColor: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.12)', color: '#F5C76B' }
                          : { borderColor: 'rgba(242,238,227,0.10)', backgroundColor: 'transparent', color: '#7A7F9B' }
                        }
                      >
                        {difficultyConfig[d].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Nombre de questions :{' '}
                  <span style={{ color: '#F5C76B', fontWeight: 700 }}>{form.totalQuestions}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={form.totalQuestions}
                  onChange={(e) => setForm({ ...form, totalQuestions: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs mt-1 font-mono" style={{ color: '#7A7F9B' }}>
                  <span>5</span>
                  <span>20</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ border: '1px solid rgba(242,238,227,0.10)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F2EEE3' }}>Bonus de rapidité</p>
                  <p className="text-xs" style={{ color: '#7A7F9B' }}>Plus vite = plus de points</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, speedBonus: !form.speedBonus })}
                  className="relative w-11 h-6 rounded-full transition-colors duration-base"
                  style={{ backgroundColor: form.speedBonus ? '#F5C76B' : 'rgba(242,238,227,0.12)' }}
                  aria-checked={form.speedBonus}
                  role="switch"
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-base"
                    style={{ backgroundColor: form.speedBonus ? '#0B1026' : '#7A7F9B', transform: form.speedBonus ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.25)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Napoléon range son chapeau…' : 'Créer la partie'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
