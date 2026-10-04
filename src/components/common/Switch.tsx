import { cn } from "../../lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Accessible toggle switch (role="switch"). */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300 ease-silk disabled:cursor-not-allowed",
        checked ? "border-accent bg-accent" : "border-edge bg-transparent",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full transition-all duration-300 ease-silk",
          checked ? "translate-x-5 bg-onaccent" : "translate-x-0 bg-subtle",
        )}
      />
    </button>
  );
}
