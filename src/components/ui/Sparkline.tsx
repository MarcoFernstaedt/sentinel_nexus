import { cn } from '@/src/lib/cn'

interface SparklineProps {
  /** Array of numeric data points (at least 2 required to render) */
  data: number[]
  /** SVG width in px, defaults to 80 */
  width?: number
  /** SVG height in px, defaults to 28 */
  height?: number
  /** Descriptive label for screen readers (e.g. "Mission progress trend") */
  label: string
  /** CSS color for the line stroke and fill gradient */
  color?: string
  className?: string
}

/**
 * Pure SVG sparkline (line + area chart) — no library required.
 * Smooth cubic bezier curve with a gradient fill beneath.
 * Fully accessible: role="img" with descriptive aria-label.
 * Returns null when fewer than 2 data points are provided.
 */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  label,
  color = 'var(--accent-mint)',
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const padding = 2
  const w = width - padding * 2
  const h = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Normalize points to SVG coordinate space
  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * w,
    y: padding + h - ((v - min) / range) * h,
  }))

  // Build smooth cubic bezier path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + pt.x) / 2
    return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`
  }, '')

  // Area fill path: close to bottom corners
  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`

  const gradientId = `sparkline-grad-${label.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`

  const lastVal = data[data.length - 1]
  const firstVal = data[0]
  const trend = lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'flat'
  const ariaDescription = `${label}: trend ${trend}, min ${Math.round(min)}, max ${Math.round(max)}, current ${Math.round(lastVal)}`

  return (
    <svg
      role="img"
      aria-label={ariaDescription}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      preserveAspectRatio="none"
    >
      <title>{ariaDescription}</title>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.00" />
        </linearGradient>
      </defs>
      {/* Gradient fill area */}
      <path
        d={areaD}
        fill={`url(#${gradientId})`}
        aria-hidden="true"
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />
      {/* End-point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        aria-hidden="true"
      />
    </svg>
  )
}
