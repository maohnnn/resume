import React from "react";

export const TerminalOutput: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-6 block rounded-md bg-emerald-400/10 px-3 py-1.5 text-slate-200 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
    {children}
  </div>
);

export default TerminalOutput;

