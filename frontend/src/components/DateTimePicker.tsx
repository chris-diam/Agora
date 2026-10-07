import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "./icons";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const to12Hour = (hour24: number): { hour: number; period: "AM" | "PM" } => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour, period };
};

const to24Hour = (hour12: number, period: "AM" | "PM"): number => {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
};

const selectClasses =
  "appearance-none rounded-lg border border-agora-border bg-agora-surface px-2.5 py-1.5 text-sm text-agora-text focus:ring-2 focus:ring-agora/30 focus:outline-none";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (value: Date) => void;
  minDate?: Date;
}

// A calendar + time popover replacing the browser's native datetime-local
// widget, whose look varies wildly (and often clashes with the rest of the
// app) across browsers/OSes. Built on react-day-picker for the calendar
// grid, with a small custom hour/minute/AM-PM control for time rather than
// pulling in a second widget for it.
export function DateTimePicker({ value, onChange, minDate }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const { hour, period } = to12Hour(value?.getHours() ?? 18);
  const minute = Math.round((value?.getMinutes() ?? 0) / 5) * 5;

  const applyDay = (day: Date) => {
    const next = new Date(day);
    next.setHours(value?.getHours() ?? 18, value ? value.getMinutes() : 0, 0, 0);
    onChange(next);
  };

  const applyTime = (nextHour: number, nextMinute: number, nextPeriod: "AM" | "PM") => {
    const base = value ? new Date(value) : new Date();
    base.setHours(to24Hour(nextHour, nextPeriod), nextMinute, 0, 0);
    onChange(base);
  };

  const label = value
    ? `${value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : "Pick a date & time";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-xl border border-agora-border bg-agora-surface p-2.5 text-left text-sm focus:ring-2 focus:ring-agora/30 focus:outline-none"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-agora-dim" />
        <span className={value ? "text-agora-text" : "text-agora-dim"}>{label}</span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-[300px] rounded-2xl border border-agora-border bg-agora-surface p-3 shadow-[0_14px_32px_-8px_rgba(0,0,0,0.5)]">
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={(day) => day && applyDay(day)}
            disabled={minDate ? { before: minDate } : undefined}
            showOutsideDays
            components={{
              Chevron: ({ orientation, className }) =>
                orientation === "left" ? (
                  <ChevronLeftIcon className={className ?? "h-4 w-4"} />
                ) : (
                  <ChevronRightIcon className={className ?? "h-4 w-4"} />
                ),
            }}
            classNames={{
              root: "text-sm",
              months: "flex flex-col",
              month: "flex flex-col gap-2",
              month_caption: "flex items-center justify-center py-1 font-semibold text-agora-text",
              caption_label: "text-sm",
              nav: "flex items-center justify-between absolute inset-x-0 top-1",
              button_previous:
                "flex h-7 w-7 items-center justify-center rounded-full text-agora-muted hover:bg-agora-light",
              button_next: "flex h-7 w-7 items-center justify-center rounded-full text-agora-muted hover:bg-agora-light",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "h-8 w-9 text-center text-xs font-medium text-agora-dim",
              weeks: "flex flex-col",
              week: "flex",
              day: "h-9 w-9 p-0 text-center align-middle",
              day_button:
                "h-9 w-9 rounded-full text-sm text-agora-text hover:bg-agora-light focus:outline-none focus:ring-2 focus:ring-agora/40",
              today: "font-semibold text-agora",
              selected: "[&>button]:bg-agora [&>button]:text-agora-on [&>button]:hover:bg-agora-hover",
              outside: "text-agora-dim opacity-50",
              disabled: "text-agora-dim opacity-30",
              hidden: "invisible",
              chevron: "fill-agora-muted",
              dropdowns: "flex gap-1",
              dropdown: "rounded-md border border-agora-border bg-agora-surface text-xs",
              dropdown_root: "relative",
              months_dropdown: "text-xs",
              years_dropdown: "text-xs",
              footer: "hidden",
              week_number: "hidden",
              week_number_header: "hidden",
            }}
          />

          <div className="mt-3 flex items-center gap-1.5 border-t border-agora-border pt-3">
            <ClockIcon className="h-4 w-4 shrink-0 text-agora-dim" />
            <select
              value={hour}
              onChange={(event) => applyTime(Number(event.target.value), minute, period)}
              className={selectClasses}
              aria-label="Hour"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-agora-dim">:</span>
            <select
              value={minute}
              onChange={(event) => applyTime(hour, Number(event.target.value), period)}
              className={selectClasses}
              aria-label="Minute"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <div className="ml-1 flex overflow-hidden rounded-lg border border-agora-border">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyTime(hour, minute, p)}
                  className={`px-2.5 py-1.5 text-xs font-medium ${
                    period === p ? "bg-agora text-agora-on" : "bg-agora-surface text-agora-muted hover:bg-agora-light"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                // Deferred rather than called directly: closing synchronously
                // from the clicked button's own handler — which unmounts
                // that same button as part of the same native click's
                // dispatch — causes Chrome to re-hit-test and fire a
                // second, phantom click against whatever now sits at those
                // coordinates post-unmount (reproducibly landed on the
                // trigger button above, silently reopening the popover).
                // A macrotask tick moves the close outside that window.
                setTimeout(() => setIsOpen(false), 0);
              }}
              className="ml-auto rounded-full bg-agora px-3 py-1.5 text-xs font-medium text-agora-on hover:bg-agora-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
