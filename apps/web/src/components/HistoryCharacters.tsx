import { motion, useReducedMotion } from 'framer-motion';

// ─── Napoléon Bonaparte ────────────────────────────────────────────────────────
function NapoleonSVG() {
  return (
    <svg viewBox="0 0 100 148" width="92" height="136" aria-hidden="true">
      {/* ── Corps ── */}
      {/* Manteau militaire */}
      <rect x="27" y="90" width="46" height="56" rx="7" fill="#0D1433" />
      {/* Bande centrale dorée */}
      <rect x="46" y="90" width="8" height="56" rx="3" fill="#F5C76B" opacity="0.6" />
      {/* Épaulettes */}
      <ellipse cx="25" cy="93" rx="14" ry="5.5" fill="#F5C76B" transform="rotate(-18 25 93)" />
      <ellipse cx="75" cy="93" rx="14" ry="5.5" fill="#F5C76B" transform="rotate(18 75 93)" />
      {/* Médaille Légion d'honneur */}
      <circle cx="40" cy="108" r="5" fill="#FF6B5B" />
      <circle cx="40" cy="108" r="2.8" fill="#F5C76B" />
      <circle cx="40" cy="108" r="1.2" fill="#0D1433" />
      {/* Ruban de la médaille */}
      <rect x="38" y="100" width="4" height="8" rx="1" fill="#CC2A1E" />
      {/* Jabot (foulard blanc) */}
      <path d="M 40 87 L 50 80 L 60 87 Q 55 90 50 88 Q 45 90 40 87 Z" fill="#F2EEE3" />

      {/* ── Tête ── */}
      {/* Cou */}
      <rect x="43" y="73" width="14" height="18" rx="5" fill="#D4A882" />
      {/* Visage */}
      <ellipse cx="50" cy="61" rx="21" ry="23" fill="#D4A882" />
      {/* Cheveux courts (style romain) */}
      <path d="M 29 55 C 31 41 41 35 50 35 C 59 35 69 41 71 55" fill="#2A1510" opacity="0.9" />
      {/* Favoris */}
      <path d="M 29 55 Q 27 65 30 73" stroke="#2A1510" stroke-width="5.5" fill="none" strokeLinecap="round" />
      <path d="M 71 55 Q 73 65 70 73" stroke="#2A1510" stroke-width="5.5" fill="none" strokeLinecap="round" />
      {/* Yeux */}
      <ellipse cx="40" cy="59" rx="3.5" ry="3" fill="#1A0A00" />
      <ellipse cx="60" cy="59" rx="3.5" ry="3" fill="#1A0A00" />
      {/* Reflets */}
      <circle cx="41.5" cy="57.5" r="1.2" fill="rgba(255,255,255,0.45)" />
      <circle cx="61.5" cy="57.5" r="1.2" fill="rgba(255,255,255,0.45)" />
      {/* Sourcils froncés (expression sévère) */}
      <path d="M 36 54 L 44 53" stroke="#2A1510" stroke-width="2.5" strokeLinecap="round" />
      <path d="M 56 53 L 64 54" stroke="#2A1510" stroke-width="2.5" strokeLinecap="round" />
      {/* Nez */}
      <path d="M 50 61 L 47 67 L 53 67" stroke="#B08868" stroke-width="1.2" fill="none" strokeLinecap="round" />
      {/* Bouche neutre */}
      <path d="M 43 73 Q 50 76 57 73" stroke="#8B6050" stroke-width="1.5" fill="none" />

      {/* ── Bicorne (chapeau iconique) ── */}
      {/* Bord gauche évasé */}
      <path
        d="M 29 42 C 17 42 7 37 5 31 C 3 25 10 19 21 21 L 27 26 L 29 42 Z"
        fill="#080C1A"
      />
      {/* Bord droit évasé */}
      <path
        d="M 71 42 C 83 42 93 37 95 31 C 97 25 90 19 79 21 L 73 26 L 71 42 Z"
        fill="#080C1A"
      />
      {/* Calotte centrale */}
      <path d="M 27 26 Q 50 19 73 26 L 71 42 L 29 42 Z" fill="#0D1230" />
      {/* Galon doré */}
      <path d="M 27 26 Q 50 19 73 26" stroke="#F5C76B" strokeWidth="1.8" fill="none" />
      {/* Cocarde tricolore */}
      <circle cx="50" cy="25" r="6" fill="#1A1A8E" />
      <circle cx="50" cy="25" r="4" fill="#F2EEE3" />
      <circle cx="50" cy="25" r="2.2" fill="#CC2200" />
    </svg>
  );
}

// ─── Marianne ──────────────────────────────────────────────────────────────────
function MarianneSVG() {
  return (
    <svg viewBox="0 0 100 158" width="84" height="133" aria-hidden="true">
      {/* ── Corps ── */}
      {/* Robe drapée (bleu de France) */}
      <path d="M 20 93 Q 15 158 30 158 L 70 158 Q 85 158 80 93 L 63 85 L 37 85 Z" fill="#1A2148" />
      {/* Pli central de la robe */}
      <path d="M 50 85 L 47 158" stroke="rgba(242,238,227,0.09)" strokeWidth="2" />
      {/* Ceinture/écharpe (dorée) */}
      <path d="M 31 98 Q 50 103 69 98" stroke="#F5C76B" strokeWidth="3.5" fill="none" opacity="0.45" strokeLinecap="round" />
      {/* Bras gauche (pendant) */}
      <path d="M 37 88 Q 26 98 24 112" stroke="#D4A882" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      {/* Bras droit (levé, tenant la torche) */}
      <path d="M 63 88 Q 76 74 72 56" stroke="#D4A882" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      {/* Manche droite */}
      <path d="M 65 88 Q 78 74 74 56" stroke="#1A2148" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* ── Torche ── */}
      {/* Manche de la torche */}
      <rect x="67" y="32" width="6" height="30" rx="3" fill="#C07840" transform="rotate(14 70 47)" />
      {/* Flamme extérieure */}
      <ellipse cx="71" cy="27" rx="9" ry="12" fill="#F5C76B" transform="rotate(14 71 27)" />
      {/* Flamme intérieure */}
      <ellipse cx="71" cy="25" rx="5.5" ry="8" fill="#FF6B5B" transform="rotate(14 71 25)" />
      {/* Cœur de la flamme */}
      <ellipse cx="71" cy="23" rx="2.5" ry="4.5" fill="#F2EEE3" transform="rotate(14 71 23)" />

      {/* ── Tête ── */}
      {/* Cou */}
      <rect x="43" y="71" width="14" height="17" rx="5" fill="#D4A882" />
      {/* Visage */}
      <ellipse cx="50" cy="59" rx="20" ry="22" fill="#D4A882" />
      {/* Pommettes rosées */}
      <ellipse cx="36" cy="64" rx="5.5" ry="3.5" fill="#E08070" opacity="0.28" />
      <ellipse cx="64" cy="64" rx="5.5" ry="3.5" fill="#E08070" opacity="0.28" />
      {/* Mèches de cheveux sur les côtés */}
      <path d="M 30 59 Q 28 49 34 42" stroke="#3A1A0A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 70 59 Q 72 49 66 42" stroke="#3A1A0A" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Yeux */}
      <ellipse cx="40" cy="56" rx="3.5" ry="3" fill="#1A0A00" />
      <ellipse cx="60" cy="56" rx="3.5" ry="3" fill="#1A0A00" />
      {/* Reflets */}
      <circle cx="41.5" cy="54.5" r="1.2" fill="rgba(255,255,255,0.45)" />
      <circle cx="61.5" cy="54.5" r="1.2" fill="rgba(255,255,255,0.45)" />
      {/* Cils supérieurs */}
      <path d="M 37 53 Q 40 51 43 53" stroke="#1A0A00" strokeWidth="1.3" fill="none" />
      <path d="M 57 53 Q 60 51 63 53" stroke="#1A0A00" strokeWidth="1.3" fill="none" />
      {/* Nez */}
      <path d="M 50 58 L 47 63 L 53 63" stroke="#B08868" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* Bouche (sourire déterminé) */}
      <path d="M 43 69 Q 50 73 57 69" stroke="#8B5040" strokeWidth="1.5" fill="none" />
      <path d="M 43 69 C 43 71 44 71 44.5 70" stroke="#8B5040" strokeWidth="1" fill="none" />
      <path d="M 57 69 C 57 71 56 71 55.5 70" stroke="#8B5040" strokeWidth="1" fill="none" />

      {/* ── Bonnet phrygien (l'élément iconique) ── */}
      {/* Base du bonnet sur la tête */}
      <ellipse cx="50" cy="40" rx="22" ry="9" fill="#CC2A1E" />
      {/* Corps gauche du bonnet */}
      <path d="M 28 40 Q 30 28 37 18 Q 41 10 45 6 Q 47 13 46 23 Q 45 33 39 40 Z" fill="#CC2A1E" />
      {/* Corps droit du bonnet */}
      <path d="M 72 40 Q 70 32 64 22 Q 58 12 55 6 Q 59 13 65 24 Q 71 34 72 40 Z" fill="#BB2418" />
      {/* Sommet/pointe du bonnet */}
      <path d="M 45 6 Q 50 2 55 6 Q 52 15 50 24 Q 48 15 45 6 Z" fill="#DD3428" />
      {/* Raie qui retombe sur le devant */}
      <path d="M 45 6 Q 41 17 39 30 Q 37 36 33 40" stroke="rgba(255,80,60,0.35)" strokeWidth="2.5" fill="none" />
      {/* Frange de laurier sur la bande du bonnet */}
      <path d="M 30 37 Q 50 31 70 37" stroke="rgba(245,199,107,0.5)" strokeWidth="1.5" fill="none" />
      {/* Feuilles de laurier */}
      <ellipse cx="37" cy="35" rx="3.5" ry="2" fill="rgba(245,199,107,0.38)" transform="rotate(-22 37 35)" />
      <ellipse cx="50" cy="32" rx="3.5" ry="2" fill="rgba(245,199,107,0.38)" />
      <ellipse cx="63" cy="35" rx="3.5" ry="2" fill="rgba(245,199,107,0.38)" transform="rotate(22 63 35)" />
    </svg>
  );
}

// ─── Composants exportés avec animations ─────────────────────────────────────

export function FloatingNapoleon() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.7, ease: 'easeOut' }}
    >
      <motion.div
        animate={shouldReduce ? {} : {
          y: [0, -11, 0],
          rotate: [-1.5, 2, -1.5],
        }}
        transition={{
          duration: 5.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <NapoleonSVG />
        <p
          className="text-center mt-2 font-mono text-xs"
          style={{ color: 'rgba(242,238,227,0.35)', letterSpacing: '0.08em' }}
        >
          Napoléon Iᵉʳ
        </p>
      </motion.div>
    </motion.div>
  );
}

export function FloatingMarianne() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.95, ease: 'easeOut' }}
    >
      <motion.div
        animate={shouldReduce ? {} : {
          y: [0, -13, 0],
          rotate: [1, -1.8, 1],
        }}
        transition={{
          duration: 6.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.1,
        }}
      >
        <MarianneSVG />
        <p
          className="text-center mt-2 font-mono text-xs"
          style={{ color: 'rgba(242,238,227,0.35)', letterSpacing: '0.08em' }}
        >
          Marianne
        </p>
      </motion.div>
    </motion.div>
  );
}
