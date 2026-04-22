'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [screen, setScreen] = useState({ w: 0, h: 0 });

  // When true, disable parallax/repulsion listeners entirely. Covers both
  // `prefers-reduced-motion` (spec §4.2.8) and the tab-hidden case (risk R-06).
  const [motionPaused, setMotionPaused] = useState(false);

  // Track live state in a ref so the shared mousemove handler can bail fast.
  const motionPausedRef = useRef(false);
  useEffect(() => {
    motionPausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => {
    const mq =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const syncMotion = () => {
      const reduced = mq?.matches ?? false;
      const hidden =
        typeof document !== 'undefined' && document.visibilityState === 'hidden';
      setMotionPaused(reduced || hidden);
    };
    syncMotion();

    const handleMove = (e: MouseEvent) => {
      if (motionPausedRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setMouse({ x, y });
    };
    const handleResize = () => setScreen({ w: window.innerWidth, h: window.innerHeight });

    handleResize();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', syncMotion);
    mq?.addEventListener?.('change', syncMotion);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', syncMotion);
      mq?.removeEventListener?.('change', syncMotion);
    };
  }, []);

  // Shards are randomised once. Generated via useState's lazy initializer so
  // the render function stays pure (satisfies `react-hooks/purity`) and no
  // cascading re-render is triggered from inside an effect.
  type Shard = {
    width: number;
    height: number;
    top: number;
    left: number;
    rotate: number;
    opacity: number;
    depth: number;
    color1: string;
    color2: string;
  };
  const [shards] = useState<Shard[]>(() => {
    const colors = [
      ['rgba(0,200,255,0.5)', 'rgba(0,120,255,0.5)'],
      ['rgba(180,0,255,0.5)', 'rgba(120,0,255,0.5)'],
      ['rgba(0,255,150,0.5)', 'rgba(0,200,100,0.5)'],
    ];
    return Array.from({ length: 35 }).map(() => {
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        width: 120 + Math.random() * 200,
        height: 120 + Math.random() * 200,
        top: Math.random() * 100,
        left: Math.random() * 100,
        rotate: Math.random() * 360,
        opacity: 0.4 + Math.random() * 0.5,
        depth: Math.random() * 40,
        color1: c[0],
        color2: c[1],
      };
    });
  });

  function handleLogin() {
    if (loading) return;
    setError('');
    setLoading(true);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          router.push('/tasks');
        } else {
          setError(data.error || 'Invalid email or password');
          setLoading(false);
        }
      })
      .catch(() => {
        setError('Could not reach server.');
        setLoading(false);
      });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Shard background — pointer-events-none so shards never block clicks. */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {screen.w !== 0 &&
          shards.map((s, i) => {
            const x = (s.left / 100) * screen.w;
            const y = (s.top / 100) * screen.h;

            // Freeze parallax + repulsion when motion is paused; shards still render
            // statically so the glass card retains its visual context.
            const mx = motionPaused ? 0 : mouse.x * 10;
            const my = motionPaused ? 0 : mouse.y * 10;
            const dx = mx - x;
            const dy = my - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 200;
            let repelX = 0;
            let repelY = 0;
            if (!motionPaused && dist < radius) {
              const force = (radius - dist) / radius;
              repelX = -dx * force * 0.4;
              repelY = -dy * force * 0.4;
            }
            const parallaxX = motionPaused ? 0 : mouse.x * (s.depth / 40);
            const parallaxY = motionPaused ? 0 : mouse.y * (s.depth / 40);
            return (
              <div
                key={i}
                className="prism-shard"
                style={
                  {
                    width: `${s.width}px`,
                    height: `${s.height}px`,
                    top: `${s.top}%`,
                    left: `${s.left}%`,
                    opacity: s.opacity,
                    '--rotate': `${s.rotate}deg`,
                    '--c1': s.color1,
                    '--c2': s.color2,
                    translate: `${parallaxX + repelX}px ${parallaxY + repelY}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
      </div>

      {/* Login card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-80 border border-white/20">
        <h1 className="text-3xl font-extrabold text-white text-center mb-2">PrismTask</h1>
        <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 mb-6" />

        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full mb-4 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-purple-400"
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full mb-4 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
        />

        {error && (
          <p role="alert" className="text-red-400 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        <p className="text-white/30 text-xs text-center mt-4">
          demo@prismtask.com / password123
        </p>
      </div>
    </div>
  );
}
