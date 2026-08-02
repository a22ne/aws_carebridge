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

      <div className="mt-3 flex h-32 items-end gap-2">
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const heightPct = d.value === null ? 0 : Math.max((d.value / safeMax) * 100, 6);

          return (
            <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center justify-end">
              {d.value !== null && (
                <span className="mb-1 text-[9px] font-bold text-muted">
                  {d.value}{unit}
                </span>
              )}
              {d.value === null ? (
                <div className="h-1.5 w-full rounded-full bg-line" />
              ) : (
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{ height: `${heightPct}%`, background: isLast ? lastFill : fill }}
                />
              )}
              <span className="mt-1 text-[9px] text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
