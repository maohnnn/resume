import React from "react";

type Props = {
  items: [string, string][];
  title?: string;
};

export const BadgeGroup: React.FC<Props> = ({ items, title }) => (
  <div className="ml-4 mt-2 pixel-border-muted bg-[#0f120f] p-2">
    {title && (
      <div className="mb-2 pixel-title text-[10px] text-[var(--accent)]">
        {title}
      </div>
    )}
    <div className="flex flex-wrap gap-2">
      {items.map(([label, color]) => (
        <span
          key={label}
          className={["pixel-badge text-[12px]", color].join(" ")}
        >
          {label}
        </span>
      ))}
    </div>
  </div>
);

export default BadgeGroup;
