import { useEffect } from "react";
import { SidebarNavContent } from "./Sidebar";
import { CloseIcon } from "./icons";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

// The Sidebar is `hidden` below the `lg` breakpoint (there isn't room for a
// persistent column on a phone/tablet), so this is the only way to reach
// most nav sections on a small screen — opened from the hamburger button in
// Navbar. Renders the exact same SidebarNavContent, just inside a slide-in
// panel instead of a static column.
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  // Prevent the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-agora-bg p-4 shadow-lg shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-agora-muted hover:bg-white/5"
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <SidebarNavContent onNavigate={onClose} />
      </div>
    </div>
  );
}
