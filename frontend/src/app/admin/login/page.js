'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(form);
      localStorage.setItem('bs_token', data.token);
      localStorage.setItem('bs_user', JSON.stringify(data.user));
      toast.success('Login realizado!');
      router.push('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(232,0,28,0.1)', border: '2px solid rgba(232,0,28,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Lock size={28} color="var(--red-primary)" />
          </div>
          <h1 style={{ fontSize: 40, marginBottom: 8 }}>Área Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Acesso restrito — Bruninho e Simões
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label>Usuário</label>
              <input
                className="input"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
