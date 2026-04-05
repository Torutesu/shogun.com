"use client";

import { useState } from "react";
import Link from "next/link";

export default function TimeTaxCalculator() {
  const [sessions, setSessions] = useState(8);
  const [minutes, setMinutes] = useState(5);
  const [rate, setRate] = useState(75);
  const [showResult, setShowResult] = useState(false);

  const dailyMinutes = sessions * minutes;
  const monthlyHours = (dailyMinutes * 22) / 60; // 22 working days
  const monthlyCost = monthlyHours * rate;
  const yearlyCost = monthlyCost * 12;

  return (
    <div className="min-h-screen bg-dark text-dark-text">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-sm border-b border-dark-border">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between h-14 px-6">
          <Link href="/" className="font-display text-lg tracking-[0.15em]">
            SHO<span className="text-gold">G</span>UN
          </Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-[600px]">
          {/* Title */}
          <h1
            className="font-display tracking-[0.04em] text-center leading-[1.05]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            THE AI CONTEXT TAX
          </h1>
          <p className="mt-4 text-center font-body font-light text-dark-text-muted text-lg">
            How much time do you waste re-explaining yourself to AI?
          </p>

          {/* Calculator */}
          <div className="mt-12 space-y-8">
            {/* Sessions per day */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-body text-sm text-dark-text-muted">
                  AI sessions per day
                </label>
                <span className="font-mono text-sm text-gold">{sessions}</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="w-full accent-gold h-1 bg-dark-border rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-none"
              />
            </div>

            {/* Minutes per session */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-body text-sm text-dark-text-muted">
                  Minutes on context per session
                </label>
                <span className="font-mono text-sm text-gold">{minutes} min</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full accent-gold h-1 bg-dark-border rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-none"
              />
            </div>

            {/* Hourly rate */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-body text-sm text-dark-text-muted">
                  Your hourly rate
                </label>
                <span className="font-mono text-sm text-gold">${rate}/hr</span>
              </div>
              <input
                type="range"
                min={25}
                max={500}
                step={5}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-gold h-1 bg-dark-border rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-none"
              />
            </div>
          </div>

          {/* Calculate Button */}
          {!showResult && (
            <button
              onClick={() => setShowResult(true)}
              className="mt-10 w-full h-14 bg-gold text-dark font-body font-semibold text-base tracking-wide rounded-none hover:bg-gold-dark transition-colors cursor-pointer"
            >
              CALCULATE MY CONTEXT TAX
            </button>
          )}

          {/* Result */}
          {showResult && (
            <div className="mt-10 border border-gold/30 p-8 text-center">
              <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-gold mb-4">
                YOUR AI CONTEXT TAX
              </p>

              <div className="space-y-6">
                <div>
                  <p className="font-display text-5xl tracking-wide text-gold">
                    {monthlyHours.toFixed(0)} hrs
                  </p>
                  <p className="mt-1 font-body text-sm text-dark-text-muted">
                    wasted per month on context re-entry
                  </p>
                </div>

                <div className="h-px bg-dark-border" />

                <div>
                  <p className="font-display text-4xl tracking-wide text-dark-text">
                    ${monthlyCost.toLocaleString()}
                  </p>
                  <p className="mt-1 font-body text-sm text-dark-text-muted">
                    per month in lost productivity
                  </p>
                </div>

                <div>
                  <p className="font-display text-3xl tracking-wide text-dark-text-muted">
                    ${yearlyCost.toLocaleString()}
                  </p>
                  <p className="mt-1 font-body text-sm text-dark-text-dim">
                    per year
                  </p>
                </div>

                <div className="h-px bg-dark-border" />

                <div>
                  <p className="font-body text-sm text-dark-text-muted mb-1">
                    SHOGUN eliminates context re-entry for
                  </p>
                  <p className="font-display text-2xl tracking-wide text-gold">
                    $49/mo
                  </p>
                  <p className="mt-1 font-body text-xs text-dark-text-dim">
                    That&apos;s ${(49 / monthlyHours).toFixed(2)}/hr saved
                  </p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center justify-center h-14 px-12 bg-gold text-dark font-body font-semibold text-base tracking-wide rounded-none hover:bg-gold-dark transition-colors"
              >
                START FREE TRIAL
              </Link>

              {/* Share */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    const text = `I'm losing ${monthlyHours.toFixed(0)} hours/month ($${monthlyCost.toLocaleString()}/mo) re-explaining context to AI.\n\nCalculate your AI context tax: syogun.com/time-tax`;
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                      "_blank",
                    );
                  }}
                  className="font-body text-sm text-dark-text-muted hover:text-gold transition-colors cursor-pointer"
                >
                  Share your results on X &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-12 text-center font-mono text-[0.6rem] tracking-[0.15em] uppercase text-dark-text-dim">
            SHOGUN &mdash; The only AI that knows your work &mdash; syogun.com
          </p>
        </div>
      </main>
    </div>
  );
}
