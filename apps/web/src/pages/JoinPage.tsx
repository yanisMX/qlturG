import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import PageTransition from '../components/PageTransition';

const schema = z.object({
  code: z.string().length(6, 'Le code doit faire 6 caractères'),
  nickname: z.string().min(2, 'Minimum 2 caractères').max(20),
});

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setGameState = useGameStore((s) => s.setGameState);
  const addPlayer = useGameStore((s) => s.addPlayer);

  const [form, setForm] = useState({
    code: (searchParams.get('code') ?? '').toUpperCase().slice(0, 6),
    nickname: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = schema.safeParse({
      code: form.code.trim().toUpperCase(),
      nickname: form.nickname.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    const socket = getSocket();
    socket.connect();

    socket.emit('game:join', { code: parsed.data.code, nickname: parsed.data.nickname });

    socket.once('game:state', (state) => {
      setGameState({
        gameId: state.gameId,
        code: state.code,
        status: state.status,
        difficulty: state.difficulty,
        speedBonus: state.speedBonus,
        totalQuestions: state.totalQuestions,
        hostId: state.hostId,
        players: state.players,
        myPlayerId: state.yourPlayerId,
        isHost: state.isHost,
      });
      navigate(`/lobby/${state.code}`);
    });

    socket.on('game:player-joined', (p) => {
      addPlayer({ id: p.playerId, nickname: p.nickname, score: p.score ?? 0 });
    });

    socket.once('game:error', (err: { message: string }) => {
      setError(err.message);
      socket.disconnect();
      setLoading(false);
    });
  };

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
            <h1 className="text-2xl font-bold mb-6" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Rejoindre une partie</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Code du QG
                </label>
                <input
                  className="input-field uppercase tracking-widest text-xl font-bold font-mono"
                  placeholder="A3F9KM"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 6) })
                  }
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#B4B7CC' }}>
                  Votre pseudo
                </label>
                <input
                  className="input-field"
                  placeholder="Ex: Napoléon Bonaparte"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  maxLength={20}
                />
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#FF6B5B', backgroundColor: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.25)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Connexion au QG…' : 'Rejoindre'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
