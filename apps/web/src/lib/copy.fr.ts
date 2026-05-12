// Qltur G — Banque de micro-copies (ton : vif · érudit · complice)
// Usage: pickRandom(LOADING_MSGS) — tirage aléatoire à chaque affichage

export const LOADING_MSGS = [
  'On dépoussière les archives…',
  'Vercingétorix vérifie son carquois.',
  'Napoléon range son chapeau.',
  'Clio (la muse) arrive.',
] as const;

export const LOBBY_MSGS = [
  'Le QG est ouvert.',
  'En attendant d\'autres têtes pensantes…',
  'On peut lancer dès 2, pas de pression.',
  '3 joueurs au rapport. Et toi ?',
] as const;

export const CORRECT_MSGS = [
  'Chapeau bas.',
  'Bien vu, érudit·e.',
  'Tu connais ton Histoire.',
  "L'Histoire te dit merci.",
] as const;

export const WRONG_MSGS = [
  'Aïe. On révisera.',
  'Clio ne te le pardonnera pas.',
  'Pas grave, la suivante t\'attend.',
  'Presque — mais presque ne suffit pas.',
] as const;

export const FINISH_MSGS = [
  'Tu as régné sur cette partie.',
  'Belle joute. À la revoyure.',
  '« L\'Histoire est un éternel recommencement. »',
  'On rejoue ?',
] as const;

export const ERRORS = {
  invalidCode: 'Code inconnu. Vérifie au QG.',
  gameFull: 'Partie complète (12/12). Crée la tienne ?',
  connectionLost: 'Connexion perdue — on te reprend dans 3s.',
  gameStarted: 'Cette partie est déjà lancée.',
} as const;

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
