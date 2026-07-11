import { adminAnalyticsCopy } from "@/lib/copy/admin";
import { formatKurus } from "@/lib/money";

// Server-rendered single-series bar chart: no client JS, native <title>
// tooltips as the hover layer, a <details> table as the accessible fallback.

type RevenuePoint = { date: Date; revenueCents: number; orderCount: number };

const WIDTH = 720;
const HEIGHT = 200;
const PAD_LEFT = 56;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
const BASELINE = PAD_TOP + PLOT_HEIGHT;

const axisMoney = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const axisDate = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

const fullDate = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
});

function barPath(x: number, width: number, height: number): string {
  const radius = Math.min(3, width / 2, height);
  const top = BASELINE - height;
  return [
    `M${x} ${BASELINE}`,
    `L${x} ${top + radius}`,
    `A${radius} ${radius} 0 0 1 ${x + radius} ${top}`,
    `L${x + width - radius} ${top}`,
    `A${radius} ${radius} 0 0 1 ${x + width} ${top + radius}`,
    `L${x + width} ${BASELINE}`,
    "Z",
  ].join(" ");
}

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const maxRevenue = Math.max(...points.map((p) => p.revenueCents), 1);
  const gap = 2;
  const slotWidth = PLOT_WIDTH / points.length;
  const barWidth = Math.max(slotWidth - gap, 1);
  const gridValues = [maxRevenue, maxRevenue / 2];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={adminAnalyticsCopy.chartAriaLabel(points.length)}
      >
        {gridValues.map((value) => {
          const y = BASELINE - (value / maxRevenue) * PLOT_HEIGHT;
          return (
            <g key={value}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeDasharray="2 4"
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                className="fill-muted"
              >
                {axisMoney.format(value / 100)}
              </text>
            </g>
          );
        })}
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={BASELINE}
          y2={BASELINE}
          className="stroke-border"
        />

        {points.map((point, index) => {
          const x = PAD_LEFT + index * slotWidth + gap / 2;
          const height = (point.revenueCents / maxRevenue) * PLOT_HEIGHT;
          return (
            <g key={point.date.toISOString()}>
              <title>
                {`${fullDate.format(point.date)} — ${formatKurus(point.revenueCents)} · ${point.orderCount} ${adminAnalyticsCopy.orders.toLocaleLowerCase("tr-TR")}`}
              </title>
              <rect
                x={PAD_LEFT + index * slotWidth}
                y={PAD_TOP}
                width={slotWidth}
                height={PLOT_HEIGHT}
                fill="transparent"
              />
              {height > 0 ? <path d={barPath(x, barWidth, height)} className="fill-ring" /> : null}
            </g>
          );
        })}

        <text x={PAD_LEFT} y={HEIGHT - 6} fontSize={10} className="fill-muted">
          {axisDate.format(points[0].date)}
        </text>
        <text
          x={WIDTH - PAD_RIGHT}
          y={HEIGHT - 6}
          textAnchor="end"
          fontSize={10}
          className="fill-muted"
        >
          {axisDate.format(points[points.length - 1].date)}
        </text>
      </svg>

      <details className="mt-3">
        <summary className="text-muted hover:text-ink cursor-pointer text-sm underline underline-offset-4">
          {adminAnalyticsCopy.chartTableToggle}
        </summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-muted border-border border-b text-left">
              <th className="py-1.5 font-medium">{adminAnalyticsCopy.chartDateHeader}</th>
              <th className="py-1.5 text-right font-medium">
                {adminAnalyticsCopy.chartRevenueHeader}
              </th>
              <th className="py-1.5 text-right font-medium">
                {adminAnalyticsCopy.chartOrdersHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {points
              .filter((point) => point.orderCount > 0)
              .map((point) => (
                <tr key={point.date.toISOString()} className="border-border border-b">
                  <td className="py-1.5">{fullDate.format(point.date)}</td>
                  <td className="py-1.5 text-right">{formatKurus(point.revenueCents)}</td>
                  <td className="py-1.5 text-right">{point.orderCount}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
