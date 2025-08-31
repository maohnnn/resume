import React from "react";

export const Prompt: React.FC = () => (
  <>
    <span className="text-[var(--accent)] pixel-title">FS</span>
    <span className="mx-1 text-[var(--muted)]">@</span>
    <span className="text-[var(--accent-2)] pixel-title">RESUME</span>
    <span className="mx-1 text-[var(--muted)]">:</span>
    <span className="text-[var(--yellow)]">~</span>$
  </>
);

export default Prompt;
