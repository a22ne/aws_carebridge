export interface BarDatum {
  /** Short axis label, e.g. 08/02 */
  label: string;
  /** Null means the day has no reading — rendered as an empty slot */
  value: number | null;
}

interface TrendBarChartProps {
  title: string;
  /** Right-aligned caption, e.g. "7 days" or "avg 5.6h" */
  caption?: string;
  data: BarDatum[];
  /** Bar gradient. The final bar switches to `lastFill` to draw the eye. */
  fill?: string;
  lastFill?: string;
  /** Appended to the value shown above each bar */
  unit?: string;
}

export function TrendBarChart({
  title,
  caption,
  data,
  fill = 'linear-gradient(#7FB685, #B9D9BE)',
  lastFill = 'linear-gradient(#e7b464, #f3d6a1)',
  unit = '',
}: TrendBarChartProps) {
  const values = data.map(d => d.value).filter((v): v is number => v !== null);
  if (values.length === 0) return null;

  // Scale against the peak so the tallest bar always fills the plot area
  const max = Math.max(...values);
  const safeMax = max > 0 ? max : 1;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-[11px] text-muted">
        <strong className="text-ink">{title}</strong>
        {caption && <span>{caption}</span>}
      </div>

      {/*
        Fixed-height plot area. Each column stretches to the full height so the
        bar track below gets a definite height from flex — percentage heights
        cannot resolve against an auto-height ancestor.
      */}
      <div className="mt-3 flex h-40 items-stretch gap-2">
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const heightPct = d.value === null ? 0 : Math.max((d.value / safeMax) * 100, 4);

          return (
            <div key={`${d.label}-${i}`} className="flex h-full flex-1 flex-col">
              {/* Value label — fixed height keeps every column's track identical */}
              <span className="h-4 shrink-0 text-center text-[9px] font-bold leading-4 text-muted">
                {d.value !== null ? `${d.value}${unit}` : ''}
              </span>

              {/* Bar track: definite height via flex-1, so the bar's % resolves */}
              <div className="relative min-h-0 flex-1">
                {d.value === null ? (
                  <div className="absolute bottom-0 h-1.5 w-full rounded-full bg-line" />
                ) : (
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg transition-[height] duration-300"
                    style={{ height: `${heightPct}%`, background: isLast ? lastFill : fill }}
                  />
                )}
              </div>

              {/* Axis label */}
              <span className="h-4 shrink-0 text-center text-[9px] leading-4 text-muted">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
