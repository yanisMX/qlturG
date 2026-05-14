import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import RevealCard from '../components/RevealCard';
import Scoreboard from '../components/Scoreboard';
import PageTransition from '../components/PageTransition';
import type { Question, RevealData, RankingEntry } from '../store/gameStore';

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const {
    currentQuestion,
    myAnswer,
    reveal,
    players,
    myPlayerId,
    isHost,
    gameMode,
    myLives,
    questionDuration,
    setQuestion,
    setMyAnswer,
    setReveal,
    setRanking,
    setMyLives,
  } = useGameStore();

  const [loadingProgress, setLoadingProgress] = useState<number | null>(null);
  const [isEliminated, setIsEliminated] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const handleQuit = useCallback(() => {
    const socket = getSocket();
    socket.emit('game:leave');
    useGameStore.getState().reset();
    navigate('/');
  }, [navigate]);

  const isSurvival = gameMode === 'SURVIVAL_SOLO' || gameMode === 'SURVIVAL_MULTI';
  const isSolo = gameMode === 'SURVIVAL_SOLO';

  const handleAnswer = useCallback(
    (idx: number) => {
      if (reveal !== null) return;
      if (isSolo && myAnswer !== null) return;
      setMyAnswer(idx);
      const socket = getSocket();
      socket.emit('game:answer', { choiceIndex: idx });
    },
    [myAnswer, reveal, isSolo, setMyAnswer],
  );

  const [isCardAlert, setIsCardAlert] = useState(false);

  const handleTimerExpire = useCallback(() => {
    // Server handles timeout; nothing to do client-side
  }, []);

  const handleTimerAlert = useCallback((alert: boolean) => {
    setIsCardAlert(alert);
  }, []);

  useEffect(() => {
    setIsCardAlert(false);
  }, [currentQuestion?.index]);

  useEffect(() => {
    const socket = getSocket();

    const onLoading = (data: { duration: number }) => {
      setLoadingProgress(0);
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min(elapsed / data.duration, 1);
        setLoadingProgress(pct);
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const onQuestion = (q: Question) => {
      setLoadingProgress(null);
      setQuestion(q);
    };
    const onReveal = (r: RevealData) => setReveal(r);
    const onFinished = (data: { ranking: RankingEntry[] }) => {
      setRanking(data.ranking);
      navigate(`/results/${code}`);
    };
    const onLifeLost = (data: { lives: number; eliminated: boolean }) => {
      setMyLives(data.lives);
      if (data.eliminated) setIsEliminated(true);
    };

    socket.on('game:loading', onLoading);
    socket.on('game:question', onQuestion);
    socket.on('game:reveal', onReveal);
    socket.on('game:finished', onFinished);
    socket.on('game:life-lost', onLifeLost);

    return () => {
      socket.off('game:loading', onLoading);
      socket.off('game:question', onQuestion);
      socket.off('game:reveal', onReveal);
      socket.off('game:finished', onFinished);
      socket.off('game:life-lost', onLifeLost);
    };
  }, [code, navigate, setQuestion, setReveal, setRanking, setMyLives]);

  // Loading bar before first question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <p className="font-mono text-sm" style={{ color: '#7A7F9B' }}>On dépoussière les archives…</p>
        {loadingProgress !== null && (
          <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(242,238,227,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#F5C76B', width: `${loadingProgress * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  const scoreboardPanel = (compact: boolean) => (
    <div className="card">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-3 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.14em' }}>
        Classement
      </h3>
      <Scoreboard
        players={players}
        myPlayerId={myPlayerId}
        compact={compact}
        revealScores={reveal?.scores}
        showLives={isSurvival}
      />
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen p-3 sm:p-4 md:p-8 pb-safe">
        <div className="max-w-5xl mx-auto">
          <div className="md:flex md:gap-6 md:items-start">
            {/* Main game area */}
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-xs font-semibold px-2 sm:px-3 py-1 rounded-full font-mono shrink-0" style={{ color: '#7A7F9B', border: '1px solid rgba(242,238,227,0.10)', backgroundColor: 'rgba(242,238,227,0.04)' }}>
                    {isSurvival
                      ? `Q${currentQuestion.index + 1}`
                      : `${currentQuestion.index + 1}/${currentQuestion.total}`
                    }
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-semibold rounded-lg px-2 py-1 transition-colors font-mono shrink-0"
                    style={{ color: '#FF6B5B', border: '1px solid rgba(255,107,91,0.25)', backgroundColor: 'rgba(255,107,91,0.06)' }}
                    onClick={() => setShowQuitConfirm(true)}
                  >
                    ✕ <span className="hidden sm:inline">Quitter</span>
                  </motion.button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Lives — survival mode */}
                  {isSurvival && (
                    <div className="flex gap-0.5 sm:gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <motion.span
                          key={i}
                          animate={i === myLives ? { scale: [1.3, 1] } : {}}
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          className="text-sm"
                          style={{ opacity: i < myLives ? 1 : 0.2 }}
                        >
                          ❤️
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {isHost && reveal && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="text-xs font-semibold rounded-lg px-2 sm:px-3 py-1.5 transition-colors"
                      style={{ color: '#F5C76B', border: '1px solid rgba(245,199,107,0.3)', backgroundColor: 'rgba(245,199,107,0.08)' }}
                      onClick={() => {
                        const socket = getSocket();
                        socket.emit('game:next');
                      }}
                    >
                      Suivant →
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Double points banner */}
              <AnimatePresence>
                {currentQuestion.isDoublePoints && !reveal && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold font-mono"
                    style={{ backgroundColor: 'rgba(245,199,107,0.12)', border: '1px solid rgba(245,199,107,0.35)', color: '#F5C76B' }}
                  >
                    ✦ Points × 2 — Question bonus !
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Eliminated overlay */}
              <AnimatePresence>
                {isEliminated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold font-mono"
                    style={{ backgroundColor: 'rgba(255,107,91,0.12)', border: '1px solid rgba(255,107,91,0.35)', color: '#FF6B5B' }}
                  >
                    💀 Tu as été éliminé — la partie continue…
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question card */}
              <motion.div
                className="card transition-all duration-300"
                style={isCardAlert && !reveal ? {
                  borderColor: 'rgba(255,107,91,0.45)',
                  animation: 'cardAlert 1s ease-in-out infinite',
                } : {}}
              >
                {!reveal && !(isSolo && myAnswer !== null) && (
                  <div className="mb-5">
                    <Timer
                      endsAt={currentQuestion.endsAt}
                      totalSeconds={questionDuration}
                      onExpire={handleTimerExpire}
                      onAlert={handleTimerAlert}
                    />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {reveal ? (
                    <motion.div
                      key="reveal"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RevealCard
                        reveal={reveal}
                        choices={currentQuestion.choices}
                        myAnswer={myAnswer}
                        myPlayerId={myPlayerId}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`question-${currentQuestion.index}`}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <QuestionCard
                        text={currentQuestion.text}
                        choices={currentQuestion.choices}
                        selectedIndex={myAnswer}
                        disabled={isEliminated || (isSolo && myAnswer !== null)}
                        onSelect={handleAnswer}
                      />
                      {myAnswer !== null && !isSolo && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 text-center text-sm font-mono"
                          style={{ color: '#7A7F9B' }}
                        >
                          Réponse sélectionnée — tu peux encore changer d'avis
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Mobile scoreboard (hidden on sm+ where side panel shows) */}
              <div className="sm:hidden">{scoreboardPanel(true)}</div>
            </div>

            {/* Desktop side scoreboard */}
            <div className="hidden sm:block w-64 md:w-72 shrink-0 sticky top-8">
              {scoreboardPanel(false)}
            </div>
          </div>
        </div>
      </div>
      {/* Quit confirmation modal */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(10,11,18,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowQuitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="card max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-bold font-mono" style={{ color: '#F2EEE3' }}>Quitter la partie ?</h2>
              <p className="text-sm font-mono" style={{ color: '#7A7F9B' }}>
                Tu seras retiré de la partie en cours. Cette action est irréversible.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 font-mono transition-colors"
                  style={{ color: '#7A7F9B', border: '1px solid rgba(242,238,227,0.12)', backgroundColor: 'rgba(242,238,227,0.04)' }}
                  onClick={() => setShowQuitConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 font-mono transition-colors"
                  style={{ color: '#FF6B5B', border: '1px solid rgba(255,107,91,0.35)', backgroundColor: 'rgba(255,107,91,0.10)' }}
                  onClick={handleQuit}
                >
                  Quitter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
