import React from 'react';

/**
 * Adapted from 21st.dev @21st/hero-waves-aurora
 * Layered SVG wave ambient animation with faint rising bubbles.
 * Automatically disabled under prefers-reduced-motion.
 */
export const OceanHeroWave: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-3xl opacity-40">
      {/* Ambient Caustic Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl bg-cyan-400/25" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-teal-400/25" />

      {/* Rising Micro-Bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        <span
          className="absolute left-[12%] bottom-0 w-2 h-2 rounded-full bg-cyan-200/40 animate-bubble-rise-slow"
          style={{ animationDelay: '0s', animationDuration: '9s' }}
        />
        <span
          className="absolute left-[34%] bottom-0 w-1.5 h-1.5 rounded-full bg-cyan-300/35 animate-bubble-rise-slow"
          style={{ animationDelay: '2.5s', animationDuration: '11s' }}
        />
        <span
          className="absolute left-[62%] bottom-0 w-2.5 h-2.5 rounded-full bg-white/30 animate-bubble-rise-slow"
          style={{ animationDelay: '4.8s', animationDuration: '8s' }}
        />
        <span
          className="absolute left-[82%] bottom-0 w-1.5 h-1.5 rounded-full bg-seafoam-200/35 animate-bubble-rise-slow"
          style={{ animationDelay: '1.2s', animationDuration: '10s' }}
        />
      </div>

      {/* Layered Flowing Ocean Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-28 overflow-hidden">
        {/* Wave Layer 1 */}
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 w-[200%] h-full opacity-25 animate-wave-drift-slow"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32L60,42.7C120,53,240,75,360,80C480,85,600,75,720,58.7C840,43,960,21,1080,21.3C1200,21,1320,43,1380,53.3L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            fill="url(#wave-grad-1)"
          />
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave Layer 2 */}
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -bottom-2 w-[200%] h-full opacity-35 animate-wave-drift-reverse"
          preserveAspectRatio="none"
        >
          <path
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            fill="url(#wave-grad-2)"
          />
          <defs>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
