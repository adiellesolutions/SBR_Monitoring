import React from 'react';
import LoginForm from './components/LoginForm';

export const metadata = {
  title: 'Sign In — SBR Monitor',
};

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Left brand panel hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ backgroundColor: 'var(--card)' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px)',
            }}
          />
          <div className="absolute bottom-0 right-0 w-80 h-80 blob-cyan opacity-60" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="2"
                width="12"
                height="18"
                rx="2"
                stroke="var(--primary)"
                strokeWidth="1.6"
                fill="none"
              />
              <line
                x1="5"
                y1="7"
                x2="17"
                y2="7"
                stroke="var(--primary)"
                strokeWidth="1"
                opacity="0.6"
              />
              <line
                x1="5"
                y1="11"
                x2="17"
                y2="11"
                stroke="var(--primary)"
                strokeWidth="1"
                opacity="0.6"
              />
              <line
                x1="5"
                y1="15"
                x2="17"
                y2="15"
                stroke="var(--primary)"
                strokeWidth="1"
                opacity="0.6"
              />
              <circle cx="11" cy="2" r="1.8" fill="var(--accent)" />
            </svg>
          </div>

          <div>
            <span className="text-base font-bold text-foreground tracking-tight">
              SBR Monitor
            </span>
            <span className="block text-[11px] text-muted-foreground">
              v2.4.1 — Production
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span
              className="w-1.5 h-1.5 rounded-full bg-status-normal live-pulse"
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-primary">
              System Online
            </span>
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight mb-4 tracking-tight">
            Sequential Batch
            <br />
            Reactor Control
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            Real-time monitoring and protection for your sewage treatment plant.
            Track sensor data, respond to alerts, and maintain optimal treatment
            performance.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              {
                icon: '⚡',
                text: 'Live sensor readings — Voltage, Current, Temperature',
              },
              {
                icon: '💧',
                text: 'Water level and turbidity monitoring',
              },
              {
                icon: '🔔',
                text: 'Instant alerts with SMS notification support',
              },
              {
                icon: '📊',
                text: 'Historical trend analysis and reporting',
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-base" aria-hidden="true">
                  {feature.icon}
                </span>
                <span className="text-sm text-muted-foreground">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-muted-foreground">
            Thesis Project — Environmental Engineering Department
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Polytechnic University of the Philippines · 2026
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <LoginForm />
      </div>
    </div>
  );
}