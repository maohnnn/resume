// Shared types
export type CommandFn = (arg?: string) => string | React.ReactNode | null;
export type CommandMap = Record<string, CommandFn>;

export type Profile = {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  summary: string;
  website?: string;
  github?: string;
  linkedin?: string;
};

export type Project = {
  name: string;
  stack: string[];
  desc: string;
  highlights?: string[];
};

// Legacy MQL alias for older browsers
export type MediaQueryListLegacy = MediaQueryList & {
  addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
};
