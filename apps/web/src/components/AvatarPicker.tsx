import { useRef, useState } from 'react';
import { api } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL as string;

interface AvatarPickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function AvatarPicker({ value, onChange, disabled }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await api.uploadAvatar(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden transition-all focus:outline-none"
        style={{
          border: '2px solid rgba(245,199,107,0.35)',
          backgroundColor: 'rgba(245,199,107,0.06)',
        }}
        title="Choisir un avatar"
      >
        {value ? (
          <img
            src={value.startsWith('/') ? `${API_BASE}${value}` : value}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl select-none">👤</span>
        )}

        {/* Overlay on hover */}
        {!uploading && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-mono rounded-full opacity-0 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(11,16,38,0.7)', color: '#F5C76B' }}
          >
            {value ? 'Changer' : 'Ajouter'}
          </span>
        )}

        {uploading && (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(11,16,38,0.7)' }}
          >
            <span
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: '#F5C76B', borderTopColor: 'transparent' }}
            />
          </span>
        )}
      </button>

      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-mono transition-colors"
          style={{ color: '#7A7F9B' }}
        >
          Retirer
        </button>
      )}

      {error && (
        <p className="text-xs font-mono" style={{ color: '#FF6B5B' }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />
    </div>
  );
}
