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
            className="text-navy-600 text-sm font-medium mb-6 inline-block hover:underline"
          >
            ← Retour
          </Link>

          <div className="card">
            <h1 className="text-2xl font-bold text-navy-800 mb-6">Créer une partie</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                        className={[
                          'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-base',
                          isSelected
                            ? 'border-navy-600 bg-navy-50 text-navy-700 shadow-card'
                            : 'border-slate-200 bg-white/60 text-slate-500 hover:border-slate-300',
                        ].join(' ')}
                      >
                        {difficultyConfig[d].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nombre de questions :{' '}
                  <span className="text-navy-700 font-bold">{form.totalQuestions}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={form.totalQuestions}
                  onChange={(e) => setForm({ ...form, totalQuestions: Number(e.target.value) })}
                  className="w-full accent-navy-700"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5</span>
                  <span>20</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-slate-200 bg-white/50">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Bonus de rapidité</p>
                  <p className="text-xs text-slate-500">Plus vite = plus de points</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, speedBonus: !form.speedBonus })}
                  className={[
                    'relative w-11 h-6 rounded-full transition-colors duration-base',
                    form.speedBonus ? 'bg-navy-700' : 'bg-slate-300',
                  ].join(' ')}
                  aria-checked={form.speedBonus}
                  role="switch"
                >
                  <span
                    className={[
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-base',
                      form.speedBonus ? 'translate-x-5' : '',
                    ].join(' ')}
                  />
                </button>
              </div>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Création...' : 'Créer la partie'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
