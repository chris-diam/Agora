import type { SVGProps } from "react";

// Small stroke-based icon set, one consistent style (24px grid, round caps),
// used across the sidebar/topbar. Kept as plain inline SVG rather than an
// icon font/library — no extra dependency for a handful of shapes.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 8.5a2.75 2.75 0 1 1 3 4.5" />
      <path d="M15 19a4.5 4.5 0 0 1 5.5-4.4" />
    </svg>
  );
}

export function UserCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.75" />
      <path d="M6.5 18.5a5.7 5.7 0 0 1 11 0" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function UserHeartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="9" r="3.25" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M17.2 12.3c.9-.9 2.4-.9 3 .3.6-1.2 2.1-1.2 3-.3.9.9.7 2-.2 2.9L20 18l-3-2.8c-.9-.9-1.1-2-.2-2.9Z" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16v10.5a1 1 0 0 1-1 1H9l-4.5 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <path d="M7.5 9.5h9M7.5 13h6" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5a1 1 0 0 1 1-1h2l1.2-1.8a1 1 0 0 1 .8-.7h5.5a1 1 0 0 1 .8.7L16.5 7.5h2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <circle cx="12" cy="13" r="3.25" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 4.5 19 8l-9.5 9.5H6v-3.5Z" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8s3.8 8 8.5 8c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5h1.8c2.5 0 4.5-2 4.5-4.4 0-3.5-4-6.4-8.6-6.4Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NewsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M7 8.5h6M7 12h10M7 15.5h10" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function MusicNoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 17.5V5.5l10-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M6 11.5a6 6 0 0 0 12 0" />
      <path d="M12 17.5v3.5M9 21h6" />
    </svg>
  );
}

export function BookmarkIcon(props: IconProps & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg {...base} {...rest} fill={filled ? "currentColor" : "none"}>
      <path d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-4-6.5 4V5.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.4 19.1a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}
