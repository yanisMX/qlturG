import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setToken, fetchMe } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    setToken(token);
    fetchMe().then(() => navigate('/', { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="animate-pulse font-mono" style={{ color: '#7A7F9B' }}>Connexion au QG en cours…</p>
    </div>
  );
}
