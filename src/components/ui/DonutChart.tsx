'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/src/lib/cn'

interface DonutChartProps {
  /** Current value (0 to max) */
  value: number
  /** Maximum value, defaults to 100 */
  max?: number
  /** SVG size in px, defaults to 80 */
  size?: number
  /** Ring stroke width in px, defaults to 8 */
  strokeWidth?: number
  /** Large center text (e.g. "72%") */
  label?: string
  /** Small center subtext (e.g. "Progress") */
  sublabel?: string
  className?: string
  /** CSS color for the filled arc */
  accentColor?: string
  /** CSS color for the background track ring */
  trackColor?: string
}

/**
 * Pure SVG donut ring chart — no library required.
 * Animates on mount via CSS keyframe defined in globals.css.
 * Fully accessible: role="img" with descriptive aria-label and <title>.
 */
export function DonutChart({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  label,
  sublabel,
  className,
  accentColor = 'var(--accent-mint)',
  trackColor,
}: DonutChartProps) {
  const arcRef = useRef<SVGCircleElement>(null)
  const clampedValue = Math.min(max, Math.max(0, value))
  const pct = Math.round((clampedValue / max) * 100)

  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clampedValue / max)

  const displayLabel = label ?? `${pct}%`
  const ariaLabel = `${displayLabel}${sublabel ? ` ${sublabel}` : ''}`

  useEffect(() => {
    const el = arcRef.current
    if (!el) return
    // Set CSS vars for the keyframe animation
    el.style.setProperty('--donut-circumference', String(circumference))
    el.style.setProperty('--donut-offset', String(offset))
    // Trigger animation by resetting then applying the class
    el.style.animation = 'none'
    // Flush reflow
    void el.getBoundingClientRect()
    el.style.animation = 'donut-fill 650ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
  }, [circumference, offset])

  const resolvedTrackColor = trackColor ?? 'rgba(0, 255, 179, 0.10)'

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn('flex-shrink-0', className)}
      style={{ overflow: 'visible' }}
    >
      <title>{ariaLabel}</title>

      {/* Background track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={resolvedTrackColor}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />

      {/* Filled arc — animated via CSS keyframes in globals.css */}
      <circle
        ref={arcRef}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={accentColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          filter: `drop-shadow(0 0 5px ${accentColor}) drop-shadow(0 0 10px ${accentColor}33)`,
        }}
        aria-hidden="true"
      />

      {/* Center text — label */}
      {label !== undefined && (
        <text
          x={center}
          y={sublabel ? center - 4 : center + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-0)"
          fontSize={size * 0.175}
          fontFamily="var(--font-mono)"
          fontWeight="700"
          letterSpacing="-0.03em"
          aria-hidden="true"
        >
          {label}
        </text>
      )}

      {/* Center text — sublabel */}
      {sublabel && (
        <text
          x={center}
          y={center + size * 0.155}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-3)"
          fontSize={size * 0.11}
          fontFamily="var(--font-sans)"
          fontWeight="500"
          letterSpacing="0.06em"
          aria-hidden="true"
        >
          {sublabel.toUpperCase()}
        </text>
      )}
    </svg>
  )
}
