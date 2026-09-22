import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import type { AnalysisResult } from '@/features/scheduler/types'

const processColors = [
  'var(--process-1)',
  'var(--process-2)',
  'var(--process-3)',
  'var(--process-4)',
  'var(--process-5)',
  'var(--process-6)',
]

type GanttChartProps = {
  result: AnalysisResult
  selectedTime: number
  onSelectTime: (time: number) => void
  onPreviewTime: (time: number | null) => void
}

export function GanttChart({
  result,
  selectedTime,
  onSelectTime,
  onPreviewTime,
}: GanttChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [focusedSlice, setFocusedSlice] = useState<number | null>(null)

  const getTimeFromPointer = (event: MouseEvent<HTMLDivElement>) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const ratio = Math.min(0.9999, Math.max(0, (event.clientX - rect.left) / rect.width))
    return Math.floor(ratio * result.totalDuration)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? -1 : 1
    onSelectTime(Math.max(0, Math.min(result.totalDuration - 1, selectedTime + delta)))
  }

  return (
    <div className="timeline-scroll" aria-label="CPU execution timeline">
      <div
        ref={chartRef}
        className="gantt-track"
        onMouseMove={(event) => onPreviewTime(getTimeFromPointer(event))}
        onMouseLeave={() => onPreviewTime(null)}
        onClick={(event) => onSelectTime(getTimeFromPointer(event))}
        onKeyDown={handleKeyDown}
        role="application"
        tabIndex={0}
      >
        {result.slices.map((slice, index) => {
          const processIndex = slice.processId
            ? Math.max(0, Number.parseInt(slice.processId.replace(/\D/g, ''), 10) - 1)
            : 0
          const active = selectedTime >= slice.start && selectedTime < slice.end
          return (
            <button
              key={`${slice.processId ?? 'idle'}-${slice.start}`}
              type="button"
              className="gantt-slice"
              style={{
                flexGrow: slice.end - slice.start,
                background: slice.processId ? processColors[processIndex % processColors.length] : 'var(--idle)',
              }}
              data-active={active || undefined}
              onClick={(event) => {
                event.stopPropagation()
                onSelectTime(slice.start)
              }}
              onFocus={() => {
                setFocusedSlice(index)
                onPreviewTime(slice.start)
              }}
              onBlur={() => {
                setFocusedSlice(null)
                onPreviewTime(null)
              }}
              aria-label={`${slice.processId ?? 'CPU idle'} from time ${slice.start} to ${slice.end}`}
            >
              <strong>{slice.processId ?? 'IDLE'}</strong>
              <span>{slice.start}-{slice.end}</span>
              {focusedSlice === index ? <i className="sr-only">Selected timeline segment</i> : null}
            </button>
          )
        })}
        <div
          className="time-cursor"
          style={{ left: `${((selectedTime + 0.5) / result.totalDuration) * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="time-axis" aria-hidden="true">
        <span>0</span>
        <span>{result.totalDuration}</span>
      </div>
    </div>
  )
}

