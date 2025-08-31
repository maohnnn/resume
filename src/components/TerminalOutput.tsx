import React from "react";

export const TerminalOutput: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-4 pixel-border-muted bg-[#101810] px-3 py-2 text-[var(--text)] pixel-shadow">
    {children}
  </div>
);

export default TerminalOutput;
