import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { api } from '../lib/api';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../socket/socket';
import PageTransition from '../components/PageTransition';
import AvatarPicker from '../components/AvatarPicker';
import type { GameMode, Topic } from '../store/gameStore';

const TOPIC_VALUES = ['HISTOIRE', 'GEOGRAPHIE', 'GEOPOLITIQUE', 'CINEMA', 'PHILOSOPHIE', 'LITTERATURE', 'ANIMAUX', 'INFORMATIQUE'] as const;

const schema = z.object({
  hostNickname: z.string().min(1, 'Veuillez renseigner votre pseudo').min(2, 'Pseudo de 2 caractères minimum').max(20),
  difficulty: z.enum(['FACILE', 'MOYEN', 'DIFFICILE', 'VARIE']),
  topics: z.array(z.enum(TOPIC_VALUES)),
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

const TOPIC_OPTIONS: { id: Topic; label: string }[] = [
  { id: 'HISTOIRE', label: 'Histoire' },
  { id: 'GEOGRAPHIE', label: 'Géographie' },
  { id: 'GEOPOLITIQUE', label: 'Géopolitique' },
  { id: 'CINEMA', label: 'Cinéma' },
  { id: 'PHILOSOPHIE', label: 'Philosophie' },
  { id: 'LITTERATURE', label: 'Littérature' },
  { id: 'ANIMAUX', label: 'Animaux' },
  { id: 'INFORMATIQUE', label: 'Informatique' },
];

export default function CreatePage() {
  const navigate = useNavigate();
  const setGameState = useGameStore((s) => s.setGameState);
  const { token, user } = useAuthStore();

  const [form, setForm] = useState({
    hostNickname: user?.pseudo ?? '',
    difficulty: 'MOYEN' as 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'VARIE',
    topics: [] as Topic[],
    totalQuestions: 10,
    speedBonus: true,
    gameMode: 'STANDARD' as GameMode,
    questionDuration: 10,
    doublePointsBonus: false,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsRef = useRef<HTMLDivElement>(null);

  const isSolo = form.gameMode === 'SURVIVAL_SOLO';
  const isSurvival = form.gameMode === 'SURVIVAL_SOLO' || form.gameMode === 'SURVIVAL_MULTI';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node)) {
        setTopicsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTopic = (id: Topic) => {
    setForm((f) => ({
      ...f,
      topics: f.topics.includes(id) ? f.topics.filter((t) => t !== id) : [...f.topics, id],
    }));
  };

  const topicLabel =
    form.topics.length === 0
      ? 'Mixte (tous)'
      : TOPIC_OPTIONS.filter((o) => form.topics.includes(o.id))
          .map((o) => o.label)
          .join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const attempt = submitAttempt + 1;
    setSubmitAttempt(attempt);
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
        topics: parsed.data.topics,
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
        topics: (game.topics as Topic[] | undefined) ?? [],
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

      const socket = getSocket(token ?? undefined);
      socket.connect();
      socket.emit('game:join', { code: game.code, nickname: parsed.data.hostNickname, avatarUrl: avatarUrl ?? undefined });

      socket.once('game:state', (state) => {
        setGameState({
          myPlayerId: state.yourPlayerId,
          isHost: state.isHost,
          players: state.players,
        });

        if (game.gameMode === 'SURVIVAL_SOLO') {
          socket.emit('game:start');
          navigate(`/play/${game.code}`);
        } else {
          navigate(`/lobby/${game.code}`);
        }
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-6">
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

              {/* Avatar */}
              <div className="flex justify-center">
                <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} disabled={loading} />
              </div>

              {/* Pseudo */}
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
                  disabled={!!user}
                  style={user ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                />
                {user && (
                  <p className="text-xs mt-1 font-mono" style={{ color: '#7A7F9B' }}>
                    Pseudo de votre compte — modifiable dans votre{' '}
                    <a href="/profile" style={{ color: '#F5C76B' }}>profil</a>
                  </p>
                )}
              </div>

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

              {/* Thème — liste déroulante multi-select */}
              <div ref={topicsRef} className="relative">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B4B7CC' }}>
                  Thème
                </label>
                <button
                  data-testid="topic-trigger"
                  type="button"
                  onClick={() => setTopicsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-base"
                  style={form.topics.length > 0
                    ? { borderColor: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.08)', color: '#F2EEE3' }
                    : { borderColor: 'rgba(242,238,227,0.10)', backgroundColor: 'transparent', color: '#7A7F9B' }
                  }
                >
                  <span className="truncate">{topicLabel}</span>
                  <span className="ml-2 shrink-0 text-xs" style={{ color: '#7A7F9B' }}>
                    {topicsOpen ? '▲' : '▼'}
                  </span>
                </button>

                {topicsOpen && (
                  <div
                    data-testid="topic-list"
                    className="absolute z-20 w-full mt-1 rounded-xl overflow-y-auto"
                    style={{
                      border: '1px solid rgba(242,238,227,0.12)',
                      backgroundColor: '#0F1629',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      maxHeight: '320px',
                    }}
                  >
                    {TOPIC_OPTIONS.map(({ id, label }) => {
                      const checked = form.topics.includes(id);
                      return (
                        <button
                          key={id}
                          data-testid={`topic-option-${label}`}
                          type="button"
                          onClick={() => toggleTopic(id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-base"
                          style={{
                            color: checked ? '#F2EEE3' : '#7A7F9B',
                            backgroundColor: checked ? 'rgba(245,199,107,0.07)' : 'transparent',
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                            style={{
                              border: checked ? '2px solid #F5C76B' : '2px solid rgba(242,238,227,0.2)',
                              backgroundColor: checked ? '#F5C76B' : 'transparent',
                            }}
                          >
                            {checked && (
                              <span style={{ color: '#0B1026', fontSize: '9px', fontWeight: 800, lineHeight: 1 }}>✓</span>
                            )}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                    {form.topics.length > 0 && (
                      <button
                        data-testid="topic-clear"
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, topics: [] }))}
                        className="w-full px-4 py-2 text-xs text-left transition-colors duration-base"
                        style={{
                          color: '#7A7F9B',
                          borderTop: '1px solid rgba(242,238,227,0.08)',
                        }}
                      >
                        Tout décocher
                      </button>
                    )}
                  </div>
                )}
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

              {/* Nombre de questions — masqué en survival (illimité) */}
              {!isSurvival && (
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
              )}

              {/* Options multi (hors survival solo) */}
              {!isSolo && (
                <Toggle
                  value={form.speedBonus}
                  onChange={() => setForm({ ...form, speedBonus: !form.speedBonus })}
                  label="Bonus de rapidité"
                  sub="Plus vite = plus de points"
                />
              )}

              {/* Questions bonus — standard seulement (survie n'a pas de total fixe) */}
              {!isSurvival && (
                <Toggle
                  value={form.doublePointsBonus}
                  onChange={() => setForm({ ...form, doublePointsBonus: !form.doublePointsBonus })}
                  label="Questions bonus × 2"
                  sub="Les 20% dernières questions valent double"
                />
              )}

              {error && (
                <motion.p
                  key={submitAttempt}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm rounded-lg px-3 py-2"
                  style={{ color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.25)' }}
                >
                  {error}
                </motion.p>
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
