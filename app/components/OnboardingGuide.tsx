"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";

export type OnboardingStep = {
  key: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  /** Known from the user's data. Steps without data count as done once their link is opened. */
  done?: boolean;
};

const storageKey = (userId: string, name: string) => `boothify_onboarding_${name}_${userId}`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the guide simply shows again next time */
  }
}

/**
 * "Mulai di sini" checklist for new organizers and tenants. Progress comes from the
 * account's data where possible; the person can hide the guide and bring it back.
 */
export default function OnboardingGuide({
  userId,
  title,
  description,
  steps,
}: {
  userId: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
}) {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    setHidden(readJson(storageKey(userId, "hidden"), false));
    setVisited(readJson(storageKey(userId, "visited"), [] as string[]));
    setReady(true);
  }, [userId]);

  if (!ready) return null;

  const isDone = (step: OnboardingStep) => step.done ?? visited.includes(step.key);
  const doneCount = steps.filter(isDone).length;
  const allDone = doneCount === steps.length;

  const setHiddenSaved = (value: boolean) => {
    setHidden(value);
    writeJson(storageKey(userId, "hidden"), value);
  };

  const markVisited = (key: string) => {
    if (visited.includes(key)) return;
    const next = [...visited, key];
    setVisited(next);
    writeJson(storageKey(userId, "visited"), next);
  };

  if (hidden) {
    return (
      <div className="mb-6 flex justify-end">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHiddenSaved(false)}>
          <Icon name="clipboard" size={16} />
          Tampilkan panduan memulai ({doneCount}/{steps.length})
        </button>
      </div>
    );
  }

  return (
    <section className="card-base onboarding animate-fade-in" aria-labelledby="onboarding-title" id="onboarding-guide">
      <div className="onboarding-head">
        <div className="min-w-0">
          <h2 id="onboarding-title" className="section-title">
            {allDone ? "Semua langkah awal selesai" : title}
          </h2>
          <p className="section-desc">
            {allDone ? "Kamu sudah siap. Panduan ini boleh disembunyikan." : description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground fig">
            {doneCount}/{steps.length} selesai
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHiddenSaved(true)}>
            Sembunyikan
          </button>
        </div>
      </div>

      <div className="onboarding-progress" aria-hidden="true">
        <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ol className="onboarding-steps">
        {steps.map((step, i) => {
          const done = isDone(step);
          return (
            <li key={step.key} className={`onboarding-step ${done ? "is-done" : ""}`}>
              <span className="onboarding-step-mark" aria-hidden="true">
                {done ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="onboarding-step-title">
                  {step.title}
                  {done && <span className="visually-hidden"> (selesai)</span>}
                </p>
                <p className="onboarding-step-text">{step.text}</p>
                {!done && (
                  <Link href={step.href} className="btn btn-secondary btn-sm" onClick={() => markVisited(step.key)}>
                    {step.cta}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
