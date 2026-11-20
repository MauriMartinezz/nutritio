import type { Locale } from "@/lib/i18n/negotiate";
import { formatCheckInDate } from "../format";
import { checkInMessages } from "../messages";
import { trendAxis, trendPoints, type TrendPoint } from "../trend";

// Fixed-pixel box: the SVG never renders wider than BOX.width, so the 12px
// labels stay ~12px on desktop and only shrink a little on narrow phones.
const BOX = { width: 360, height: 180, padding: 44 };
const LABEL_SIZE = 12;

/**
 * Evolution of one value as a dependency-free SVG line chart. `series` is
 * oldest first; `format` prints a value with its unit; `summary` is the
 * accessible description; `name` heads the value column of the table view;
 * `formatAxis` prints the y-axis bounds (defaults to `format`); `locale`
 * formats the dates and the text.
 * Server-renderable; colours come from the theme tokens (currentColor and CSS
 * variables), so light/dark work.
 */
export function TrendChart({
  series,
  format,
  summary,
  name,
  formatAxis = format,
  locale,
}: {
  series: TrendPoint[];
  format: (value: number) => string;
  summary: string;
  name: string;
  formatAxis?: (value: number) => string;
  locale: Locale;
}) {
  if (series.length === 0) return null;
  const t = checkInMessages[locale];
  const day = (date: Date) => formatCheckInDate(date, locale);

  if (series.length === 1) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <p className="font-mono tabular-nums">{t.on(format(series[0].value), day(series[0].date))}</p>
        <p className="text-secondary">{t.sendMore}</p>
      </div>
    );
  }

  const { min, max } = trendAxis(series.map((point) => point.value));
  const points = trendPoints(series, BOX);
  const top = BOX.padding;
  const bottom = BOX.height - BOX.padding;
  const left = BOX.padding;
  const right = BOX.width - BOX.padding;

  return (
    <figure className="flex w-full flex-col gap-2" style={{ maxWidth: BOX.width }}>
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        width="100%"
        role="img"
        aria-label={summary}
        className="h-auto text-accent"
      >
        <g stroke="var(--border-strong)" strokeWidth={1}>
          <line x1={left} y1={top} x2={right} y2={top} strokeDasharray="3 3" />
          <line x1={left} y1={bottom} x2={right} y2={bottom} />
        </g>
        <g className="font-mono tabular-nums" fill="var(--text-secondary)" fontSize={LABEL_SIZE}>
          <text x={left - 6} y={top} textAnchor="end" dominantBaseline="middle">
            {formatAxis(max)}
          </text>
          <text x={left - 6} y={bottom} textAnchor="end" dominantBaseline="middle">
            {formatAxis(min)}
          </text>
          <text x={left} y={bottom + 16} textAnchor="start">
            {day(series[0].date)}
          </text>
          <text x={right} y={bottom + 16} textAnchor="end">
            {day(series[series.length - 1].date)}
          </text>
        </g>
        <polyline
          points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(({ x, y }, index) => (
          <circle key={index} cx={x} cy={y} r={3.5} fill="var(--surface)" stroke="currentColor" strokeWidth={2}>
            <title>{`${day(series[index].date)}: ${format(series[index].value)}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="text-xs text-secondary">{summary}</figcaption>
      <table className="sr-only">
        <caption>{t.byCheckIn(name)}</caption>
        <thead>
          <tr>
            <th scope="col">{t.date}</th>
            <th scope="col">{name}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point, index) => (
            <tr key={index}>
              <td>{day(point.date)}</td>
              <td>{format(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
