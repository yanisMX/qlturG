import { AuthUser } from '../store/authStore';

// 8 preset color schemes — indexed by preset:N
const PRESET_COLORS = [
  '#4338ca', // indigo
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#db2777', // pink
  '#0f766e', // teal
];

interface UserAvatarProps {
  user: Pick<AuthUser, 'pseudo' | 'avatarUrl'>;
  size?: number;
  className?: string;
}

export default function UserAvatar({ user, size = 36, className = '' }: UserAvatarProps) {
  const initial = (user.pseudo?.[0] ?? '?').toUpperCase();
  const url = user.avatarUrl;

  if (url && url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_URL as string;
    return (
      <img
        src={`${apiBase}${url}`}
        alt={user.pseudo}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // preset:N or null → colored circle with initial
  let bg = '#6366f1'; // default indigo
  if (url?.startsWith('preset:')) {
    const idx = parseInt(url.split(':')[1], 10);
    bg = PRESET_COLORS[idx] ?? bg;
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white select-none shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
      aria-label={user.pseudo}
    >
      {initial}
    </div>
  );
}

export { PRESET_COLORS };
