import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { api } from '../lib/api';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import PageTransition from '../components/PageTransition';
import type { GameMode } from '../store/gameStore';

const schema = z.object({
  hostNickname: z.string().min(2, 'Minimum 2 caractères').max(20),
  difficulty: z.enum(['FACILE', 'MOYEN', 'DIFFICILE', 'VARIE']),
  totalQuestions: z.number().min(10).max(30),
  speedBonus: z.boolean(),
  gameMode: z.enum(['STANDARD', 'SURVIVAL_SOLO', 'SURVIVAL_MULTI']),
  questionDuration: z.number().min(5).max(30),
  doublePointsBonus: z.boolean(),
});

const GAME_MODES: { id: GameMode; label: string; desc: string; icon: string }[] = [
  { id: 'STANDARD', label: 'Standard', desc: 'Classique multijoueur', icon: '⚔️' },
  { id: 'SURVIVAL_MULTI', label: 'Survival Multi', desc: '3 vies — dernier en vie', icon: '💀' },
  { id: 'SURVIVAL_SOLO', label: 'Survival Solo', desc: 'Solo — va le plus loin possible', icon: '🧠' },
];

const DIFFICULTY_CONFIG = {
  FACILE: { label: 'Facile' },
  MOYEN: { label: 'Moyen' },
  DIFFICILE: { label: 'Difficile' },
  VARIE: { label: 'Varié' },
} as const;

export default function CreatePage() {
  const navigate = useNavigate();
  const setGameState = useGameStore((s) => s.setGameState);

  const [form, setForm] = useState({
    hostNickname: '',
    difficulty: 'MOYEN' as 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'VARIE',
    totalQuestions: 10,
    speedBonus: true,
    gameMode: 'STANDARD' as GameMode,
    questionDuration: 10,
    doublePointsBonus: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSolo = form.gameMode === 'SURVIVAL_SOLO';

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
        gameMode: parsed.data.gameMode,
        questionDuration: parsed.data.questionDuration,
        doublePointsBonus: parsed.data.doublePointsBonus,
      });

      setGameState({
        gameId: game.id,
        code: game.code,
        status: 'LOBBY',
        difficulty: game.difficulty,
        gameMode: game.gameMode,
        speedBonus: game.speedBonus,
        doublePointsBonus: game.doublePointsBonus,
        totalQuestions: game.totalQuestions,
        questionDuration: game.questionDuration,
        hostId: null,
        players: [],
        myPlayerId: null,
        isHost: true,
        myLives: 3,
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

  const Toggle = ({ value, onChange, label, sub }: { value: boolean; onChange: () => void; label: string; sub?: string }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ border: '1px solid rgba(242,238,227,0.10)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#F2EEE3' }}>{label}</p>
        {sub && <p className="text-xs" style={{ color: '#7A7F9B' }}>{sub}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-colors duration-base"
        style={{ backgroundColor: value ? '#F5C76B' : 'rgba(242,238,227,0.12)' }}
        aria-checked={value}
        role="switch"
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-base"
          style={{ backgroundColor: value ? '#0B1026' : '#7A7F9B', transform: value ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );

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
            <h1 className="text-2xl font-bold mb-6" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
              Créer une partie
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Mode de jeu */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>
                  Mode de jeu
                </label>
                <div className="space-y-2">
                  {GAME_MODES.map((mode) => {
                    const isSelected = form.gameMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setForm({ ...form, gameMode: mode.id })}
                        className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-base"
                        style={isSelected
                          ? { borderColor: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.10)', color: '#F2EEE3' }
                          : { borderColor: 'rgba(242,238,227,0.10)', backgroundColor: 'transparent', color: '#7A7F9B' }
                        }
                      >
                        <span className="flex items-center gap-3">
                          <span>{mode.icon}</span>
                          <span>
                            <span className="font-semibold text-sm block">{mode.label}</span>
                            <span className="text-xs font-mono" style={{ color: isSelected ? '#B4B7CC' : '#7A7F9B' }}>{mode.desc}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isSolo && (
                  <p className="text-xs mt-2 font-mono" style={{ color: '#7A7F9B' }}>
                    ⚠ Partie solo — personne ne peut rejoindre
                  </p>
                )}
              </div>

              {/* Pseudo (caché en survival solo — déjà solo) */}
              {!isSolo && (
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
              )}
              {isSolo && (
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
              )}

              {/* Difficulté */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>
                  Difficulté
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['FACILE', 'MOYEN', 'DIFFICILE', 'VARIE'] as const).map((d) => {
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
                        {DIFFICULTY_CONFIG[d].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Temps de réponse */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Temps de réponse :{' '}
                  <span style={{ color: '#F5C76B', fontWeight: 700 }}>{form.questionDuration}s</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={form.questionDuration}
                  onChange={(e) => setForm({ ...form, questionDuration: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs mt-1 font-mono" style={{ color: '#7A7F9B' }}>
                  <span>5s</span><span>30s</span>
                </div>
              </div>

              {/* Nombre de questions */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Nombre de questions :{' '}
                  <span style={{ color: '#F5C76B', fontWeight: 700 }}>{form.totalQuestions}</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={5}
                  value={form.totalQuestions}
                  onChange={(e) => setForm({ ...form, totalQuestions: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs mt-1 font-mono" style={{ color: '#7A7F9B' }}>
                  <span>10</span><span>30</span>
                </div>
              </div>

              {/* Options multi (hors survival solo) */}
              {!isSolo && (
                <Toggle
                  value={form.speedBonus}
                  onChange={() => setForm({ ...form, speedBonus: !form.speedBonus })}
                  label="Bonus de rapidité"
                  sub="Plus vite = plus de points"
                />
              )}

              {/* Questions bonus */}
              <Toggle
                value={form.doublePointsBonus}
                onChange={() => setForm({ ...form, doublePointsBonus: !form.doublePointsBonus })}
                label="Questions bonus × 2"
                sub={`Les 20% dernières questions valent double`}
              />

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
