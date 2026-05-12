import { useEffect, useCallback } from 'react';
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
    setQuestion,
    setMyAnswer,
    setReveal,
    setRanking,
  } = useGameStore();

  const handleAnswer = useCallback(
    (idx: number) => {
      if (myAnswer !== null || reveal !== null) return;
      setMyAnswer(idx);
      const socket = getSocket();
      socket.emit('game:answer', { choiceIndex: idx });
    },
    [myAnswer, reveal, setMyAnswer],
  );

  const handleTimerExpire = useCallback(() => {
    // Server handles timeout; nothing to do client-side
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onQuestion = (q: Question) => setQuestion(q);
    const onReveal = (r: RevealData) => setReveal(r);
    const onFinished = (data: { ranking: RankingEntry[] }) => {
      setRanking(data.ranking);
      navigate(`/results/${code}`);
    };

    socket.on('game:question', onQuestion);
    socket.on('game:reveal', onReveal);
    socket.on('game:finished', onFinished);

    return () => {
      socket.off('game:question', onQuestion);
      socket.off('game:reveal', onReveal);
      socket.off('game:finished', onFinished);
    };
  }, [code, navigate, setQuestion, setReveal, setRanking]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse font-mono" style={{ color: '#7A7F9B' }}>On dépoussière les archives…</p>
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
      />
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="md:flex md:gap-6 md:items-start">
            {/* Main game area */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full font-mono" style={{ color: '#7A7F9B', border: '1px solid rgba(242,238,227,0.10)', backgroundColor: 'rgba(242,238,227,0.04)' }}>
                  Question {currentQuestion.index + 1} / {currentQuestion.total}
                </span>
                {isHost && reveal && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
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

              {/* Question card */}
              <div className="card">
                {!reveal && (
                  <div className="mb-5">
                    <Timer endsAt={currentQuestion.endsAt} onExpire={handleTimerExpire} />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {reveal ? (
                    <motion.div
                      key="reveal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
                      key="question"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <QuestionCard
                        text={currentQuestion.text}
                        choices={currentQuestion.choices}
                        selectedIndex={myAnswer}
                        disabled={myAnswer !== null}
                        onSelect={handleAnswer}
                      />
                      {myAnswer !== null && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 text-center text-sm font-mono"
                          style={{ color: '#7A7F9B' }}
                        >
                          Réponse enregistrée — en attente des autres joueurs…
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile scoreboard */}
              <div className="md:hidden">{scoreboardPanel(true)}</div>
            </div>

            {/* Desktop side scoreboard */}
            <div className="hidden md:block w-72 shrink-0 sticky top-8">
              {scoreboardPanel(false)}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
