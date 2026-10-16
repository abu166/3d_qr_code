import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: ReactNode; title?: string }[];
  label: string;
}) {
  return (
    <div
      className="segmented"
      role="group"
      aria-label={label}
      style={
        {
          "--items": options.length,
          "--active": options.findIndex((o) => o.id === value),
        } as CSSProperties
      }
    >
      <span className="segment-indicator" />
      {options.map((o) => (
        <button
          key={o.id}
          title={o.title}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Scrub({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  format = (v: number) => `${Math.round(v * 100)}%`,
  ends,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  ends?: [string, string];
}) {
  const id = useId(),
    drag = useRef({ x: 0, value: 0 });
  return (
    <div className="scrub">
      <label htmlFor={id}>{label}</label>
      <div
        className="scrub-bar"
        style={
          {
            "--fill": `${((value - min) / (max - min)) * 100}%`,
          } as CSSProperties
        }
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="scrub-ticks" />
        <output
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, value };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.buttons)
              onChange(
                Math.max(
                  min,
                  Math.min(
                    max,
                    Math.round(
                      (drag.current.value +
                        ((e.clientX - drag.current.x) * (max - min)) / 200) /
                        step,
                    ) * step,
                  ),
                ),
              );
          }}
        >
          {format(value)}
        </output>
      </div>
      {ends && (
        <div className="range-ends">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
    </div>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="toggle-row">
      <span>
        {label}
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch" />
    </label>
  );
}
export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; icon?: ReactNode; description?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="picker" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.icon && <span className="picker-icon">{o.icon}</span>}
          <span>
            {o.label}
            {o.description && <small>{o.description}</small>}
          </span>
          {value === o.id && <Check size={13} />}
        </button>
      ))}
    </div>
  );
}
export function Popover({
  label,
  children,
  icon,
}: {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <details className="popover">
      <summary>
        {icon}
        {label}
        <ChevronDown size={12} />
      </summary>
      <div className="popover-panel">{children}</div>
    </details>
  );
}
