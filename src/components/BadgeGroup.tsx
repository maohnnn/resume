import React from "react";

type Props = {
  items: [string, string][];
  title?: string;
};

export const BadgeGroup: React.FC<Props> = ({ items, title }) => (
  <div className="ml-6 mt-1 rounded-lg bg-emerald-400/10 p-2">
    {title && (
      <div className="mb-1 text-[12px] font-bold tracking-wide text-slate-300">
        {title}
      </div>
    )}
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, color]) => (
        <span
          key={label}
          className={[
            "inline-flex min-h-6 select-none items-center gap-2 rounded-full border px-3 py-1 text-[12px] leading-none backdrop-saturate-125 transition-transform duration-150 ease-out",
            "border-white/10 bg-white/5 hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10",
            color,
          ].join(" ")}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
          {label}
        </span>
      ))}
    </div>
  </div>
);

export default BadgeGroup;

