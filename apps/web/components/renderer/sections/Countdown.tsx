"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import type { SectionProps } from "./types";

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown({ node }: SectionProps) {
  const { heading, targetDate, expiredText, buttonText, buttonHref } = node.props as Record<string, string>;
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!targetDate) return;
    setTimeLeft(getTimeLeft(targetDate));
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = timeLeft
    ? [
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Seconds" },
      ]
    : [];

  return (
    <div className="flex flex-col items-center gap-6">
      {heading && <h2 className="text-2xl md:text-3xl font-bold">{heading}</h2>}
      {/* Avoid an SSR/CSR mismatch on the live countdown digits — render nothing on the
          server, then the real countdown once mounted client-side. */}
      {mounted && (
        <>
          {timeLeft ? (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {units.map((unit) => (
                <div
                  key={unit.label}
                  className="flex flex-col items-center justify-center bg-white/10 rounded-lg px-5 py-4 min-w-[84px]"
                >
                  <span className="text-3xl md:text-4xl font-bold tabular-nums">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase tracking-wide opacity-75 mt-1">{unit.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-lg opacity-90">{expiredText}</p>
          )}
        </>
      )}
      {buttonText && <Button text={buttonText} href={buttonHref || "#"} variant="primary" />}
    </div>
  );
}
