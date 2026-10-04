import { memo } from "react";
import { cn } from "../../lib/utils";

interface RollingDigitsProps {
  /** Clock text such as "24:18". Digits roll; any other character renders statically. */
  value: string;
  className?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** One vertical reel: a 10-digit strip translated by `digit * 10%` with a GPU-composited transform. */
function DigitReel({ digit }: { digit: number }) {
  return (
    <span className="inline-block h-[1.1em] w-[0.68em] overflow-hidden text-center align-top leading-[1.1em] tabular-nums">
      <span
        className="flex flex-col will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translate3d(0, -${digit * 10}%, 0)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1.1em] leading-[1.1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingDigitsBase({ value, className }: RollingDigitsProps) {
  const chars = value.split("");
  return (
    <span
      role="timer"
      aria-label={value.replace(":", " minutes ") + " seconds"}
      className={cn("inline-flex items-center font-serif tracking-tight tabular-nums", className)}
    >
      {chars.map((ch, i) => {
        // Key from the right so existing reels persist when minutes gain a digit.
        const key = chars.length - i;
        return /\d/.test(ch) ? (
          <span key={key} aria-hidden="true">
            <DigitReel digit={Number(ch)} />
          </span>
        ) : (
          <span key={key} aria-hidden="true" className="inline-block w-[0.3em] text-center leading-[1.1em]">
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export const RollingDigits = memo(RollingDigitsBase);
