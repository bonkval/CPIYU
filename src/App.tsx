import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Download,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { GanttChart } from '@/components/simulator/gantt-chart'
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createProcesses, exampleProcesses } from '@/features/scheduler/presets'
import { simulatePreemptivePriority } from '@/features/scheduler/preemptive-priority'
import type { AnalysisResult, ProcessInput } from '@/features/scheduler/types'
import {
  hasValidationErrors,
  validateProcesses,
  type ProcessField,
} from '@/features/scheduler/validation'

type State = {
  processes: ProcessInput[]
  result: AnalysisResult | null
  attempted: boolean
}

type Action =
  | { type: 'set-count'; count: number }
  | { type: 'update'; index: number; field: ProcessField; value: string }
  | { type: 'load-example' }
  | { type: 'clear' }
  | { type: 'analyze'; result: AnalysisResult }

const initialState: State = {
  processes: exampleProcesses.map((process) => ({ ...process })),
  result: null,
  attempted: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set-count': {
      const nextCount = Math.max(1, Math.min(50, action.count || 1))
      const generated = createProcesses(nextCount)
      return {
        processes: generated.map((process, index) => ({
          ...(state.processes[index] ?? process),
          inputOrder: index,
        })),
        result: null,
        attempted: false,
      }
    }
    case 'update':
      return {
        ...state,
        result: null,
        processes: state.processes.map((process, index) => {
          if (index !== action.index) return process
          return {
            ...process,
            [action.field]: action.field === 'id' ? action.value : Number(action.value),
          }
        }),
      }
    case 'load-example':
      return {
        processes: exampleProcesses.map((process) => ({ ...process })),
        result: simulatePreemptivePriority(exampleProcesses),
        attempted: false,
      }
    case 'clear':
      return { processes: createProcesses(3), result: null, attempted: false }
    case 'analyze':
      return { ...state, result: action.result, attempted: true }
  }
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('scheduler-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('scheduler-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#111110' : '#f6f5f1',
    )
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next)
      return
    }
    const panel = document.createElement('div')
    panel.className = 'theme-sweep'
    panel.style.background = next === 'dark' ? '#111110' : '#f6f5f1'
    document.body.append(panel)
    const animation = panel.animate(
      [
        { transform: 'translateX(-135vw) skewX(-13deg)' },
        { transform: 'translateX(-10vw) skewX(-13deg)', offset: 0.48 },
        { transform: 'translateX(130vw) skewX(-13deg)' },
      ],
      { duration: 1050, easing: 'cubic-bezier(.72,0,.22,1)', fill: 'forwards' },
    )
    window.setTimeout(() => setTheme(next), 500)
    animation.finished.finally(() => panel.remove())
  }

  return { theme, toggleTheme }
}

function PointerEffects() {
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    const move = (event: PointerEvent) => {
      root.style.setProperty('--pointer-x', `${event.clientX}px`)
      root.style.setProperty('--pointer-y', `${event.clientY}px`)
    }
    const down = (event: PointerEvent) => {
      const ripple = document.createElement('span')
      ripple.className = 'click-ripple'
      ripple.style.left = `${event.clientX}px`
      ripple.style.top = `${event.clientY}px`
      document.body.append(ripple)
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
    }
  }, [])
  return <div className="pointer-aura" aria-hidden="true" />
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [selectedTime, setSelectedTime] = useState(0)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const { theme, toggleTheme } = useTheme()
  const inputSection = useRef<HTMLElement>(null)
  const resultsSection = useRef<HTMLElement>(null)
  const errors = useMemo(() => validateProcesses(state.processes), [state.processes])
  const activeTime = previewTime ?? selectedTime
  const snapshot = state.result?.snapshots[Math.min(activeTime, Math.max(0, state.result.snapshots.length - 1))]

  useEffect(() => {
    if (!isPlaying || !state.result) return
    const interval = window.setInterval(() => {
      setSelectedTime((current) => {
        if (current >= state.result!.totalDuration - 1) {
          setIsPlaying(false)
          return current
        }
        return current + 1
      })
    }, 850 / speed)
    return () => window.clearInterval(interval)
  }, [isPlaying, speed, state.result])

  const analyze = () => {
    if (hasValidationErrors(errors)) {
      const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      invalid?.focus()
      return
    }
    const result = simulatePreemptivePriority(state.processes)
    dispatch({ type: 'analyze', result })
    setSelectedTime(0)
    setIsPlaying(false)
    window.setTimeout(() => resultsSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const loadExample = () => {
    dispatch({ type: 'load-example' })
    setSelectedTime(0)
  }

  const exportCsv = () => {
    if (!state.result) return
    const header = 'Process,Arrival,Burst,Priority,Completion,Waiting,Turnaround,Response'
    const rows = state.processes.map((process, index) => {
      const metric = state.result!.metrics[index]
      return [
        process.id,
        process.arrivalTime,
        process.burstTime,
        process.priority,
        metric.completionTime,
        metric.waitingTime,
        metric.turnaroundTime,
        metric.responseTime,
      ].join(',')
    })
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'priority-scheduling-results.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <TooltipProvider>
      <PointerEffects />
      <a className="skip-link" href="#processes">Skip to process input</a>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Priority Lab home">
          <span>PL</span>
          <strong>Priority Lab</strong>
        </a>
        <p>Lower number = higher priority</p>
        <button type="button" className="theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun /> : <Moon />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      <main id="top">
        <section className="hero-shell" aria-labelledby="page-title">
          <div className="hero-copy">
            <span className="eyebrow">Preemptive priority scheduling</span>
            <h1 id="page-title">See every CPU decision.</h1>
            <p>Enter processes, run the scheduler, then inspect the CPU and Ready Queue at every unit of time.</p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => inputSection.current?.scrollIntoView({ behavior: 'smooth' })}>
                Build a schedule <CirclePlay />
              </button>
              <button type="button" className="text-action" onClick={loadExample}>Load the class example</button>
            </div>
          </div>
          <div className="hero-visual" aria-label="Scheduling model overview">
            <div className="visual-row incoming"><span>P1</span><span>P2</span><span>P3</span></div>
            <div className="visual-arrow">Arrival queue</div>
            <div className="visual-cpu"><small>CPU</small><strong>P2</strong><em>Priority 1</em></div>
            <div className="visual-note">Higher-priority arrivals can interrupt the running process.</div>
          </div>
        </section>

        <section className="workspace section-anchor" ref={inputSection} id="processes" aria-labelledby="process-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Process input</span>
              <h2 id="process-heading">Build the workload</h2>
            </div>
            <label className="count-control">
              <span>Number of processes</span>
              <input
                type="number"
                name="process-count"
                autoComplete="off"
                inputMode="numeric"
                min="1"
                max="50"
                value={state.processes.length}
                onChange={(event) => dispatch({ type: 'set-count', count: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="process-grid" role="group" aria-label="Process details">
            <div className="process-grid-header" aria-hidden="true">
              <span>Process</span><span>Arrival</span><span>Burst</span><span>Priority</span>
            </div>
            {state.processes.map((process, index) => (
              <div className="process-row" key={index}>
                {(['id', 'arrivalTime', 'burstTime', 'priority'] as ProcessField[]).map((field) => {
                  const labels: Record<ProcessField, string> = { id: 'Process ID', arrivalTime: 'Arrival time', burstTime: 'Burst time', priority: 'Priority' }
                  const error = errors[index]?.[field]
                  return (
                    <label key={field}>
                      <span>{labels[field]}</span>
                      <input
                        type={field === 'id' ? 'text' : 'number'}
                        name={`process-${index}-${field}`}
                        autoComplete="off"
                        spellCheck={field === 'id' ? false : undefined}
                        inputMode={field === 'id' ? undefined : 'numeric'}
                        min={field === 'burstTime' ? 1 : 0}
                        max={field === 'priority' ? 99 : undefined}
                        value={process[field]}
                        onChange={(event) => dispatch({ type: 'update', index, field, value: event.target.value })}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `error-${index}-${field}` : undefined}
                      />
                      {error ? <small id={`error-${index}-${field}`}>{error}</small> : null}
                    </label>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="input-footer">
            <div className="secondary-actions">
              <button type="button" onClick={() => dispatch({ type: 'set-count', count: state.processes.length + 1 })}><Plus /> Add process</button>
              <button type="button" onClick={loadExample}><Sparkles /> Example</button>
              <button type="button" onClick={() => dispatch({ type: 'clear' })}><Trash2 /> Clear</button>
            </div>
            <button type="button" className="analyze-button" onClick={analyze} disabled={hasValidationErrors(errors)}>
              Analyze schedule <BarChart3 />
            </button>
          </div>
          {state.attempted && hasValidationErrors(errors) ? <p className="form-message">Correct the highlighted fields before analyzing.</p> : null}
        </section>

        {state.result ? (
          <section className="results section-anchor" ref={resultsSection} id="results" aria-labelledby="results-heading">
            <div className="section-heading results-heading">
              <div><span className="section-kicker">Analysis complete</span><h2 id="results-heading">Scheduling results</h2></div>
              <button type="button" className="export-button" onClick={exportCsv}><Download /> Export CSV</button>
            </div>

            <div className="metrics" aria-label="Schedule summary">
              <article><span>Average waiting</span><strong>{state.result.averageWaitingTime.toFixed(2)}</strong><small>time units</small></article>
              <article><span>Average turnaround</span><strong>{state.result.averageTurnaroundTime.toFixed(2)}</strong><small>time units</small></article>
              <article><span>CPU utilization</span><strong>{state.result.cpuUtilization.toFixed(1)}%</strong><small>busy time</small></article>
              <article><span>Context switches</span><strong>{state.result.contextSwitches}</strong><small>process changes</small></article>
            </div>

            <div className="analysis-grid">
              <article className="panel timeline-panel">
                <div className="panel-heading"><div><span>Interactive Gantt chart</span><h3>CPU timeline</h3></div><code>t = {activeTime}</code></div>
                <GanttChart result={state.result} selectedTime={activeTime} onSelectTime={setSelectedTime} onPreviewTime={setPreviewTime} />
                <div className="playback-controls">
                  <button type="button" onClick={() => setSelectedTime((time) => Math.max(0, time - 1))} aria-label="Previous time"><ChevronLeft /></button>
                  <button type="button" className="play-button" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}>{isPlaying ? <Pause /> : <Play />}</button>
                  <button type="button" onClick={() => setSelectedTime((time) => Math.min(state.result!.totalDuration - 1, time + 1))} aria-label="Next time"><ChevronRight /></button>
                  <label><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="0.5">0.5x</option><option value="1">1x</option><option value="2">2x</option></select></label>
                </div>
              </article>

              <aside className="panel inspector" aria-live="polite">
                <span className="panel-label">Time inspector</span>
                <div className="inspector-time"><strong>{activeTime}</strong><span>current time</span></div>
                <dl><div><dt>CPU</dt><dd>{snapshot?.runningProcessId ?? 'Idle'}</dd></div><div><dt>Remaining burst</dt><dd>{snapshot?.runningProcessId ? snapshot.remainingTimes[snapshot.runningProcessId] : '-'}</dd></div></dl>
                <div className="ready-queue"><h3>Ready Queue</h3>{snapshot?.readyQueue.length ? <ol>{snapshot.readyQueue.map((entry) => <li key={entry.processId}><strong>{entry.processId}</strong><span>Priority {entry.priority}</span><em>{entry.remainingTime} remaining</em></li>)}</ol> : <p>No processes are waiting.</p>}</div>
              </aside>
            </div>

            <article className="panel results-table-panel">
              <div className="panel-heading"><div><span>Completed process table</span><h3>Per-process calculations</h3></div><p>WT = TAT - BT</p></div>
              <div className="table-scroll"><table><thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority</th><th>Completion</th><th>Waiting</th><th>Turnaround</th><th>Response</th></tr></thead><tbody>{state.processes.map((process, index) => { const metric = state.result!.metrics[index]; return <tr key={process.id}><th>{process.id}</th><td>{process.arrivalTime}</td><td>{process.burstTime}</td><td>{process.priority}</td><td>{metric.completionTime}</td><td>{metric.waitingTime}</td><td>{metric.turnaroundTime}</td><td>{metric.responseTime}</td></tr> })}</tbody></table></div>
            </article>
          </section>
        ) : (
          <section className="empty-results" id="results" aria-labelledby="empty-heading"><BookOpen /><h2 id="empty-heading">Your timeline will appear here</h2><p>Enter a valid workload and select Analyze schedule.</p></section>
        )}
      </main>

      <div className="dock-wrap">
        <Dock>
          <DockItem label="Process input" onClick={() => inputSection.current?.scrollIntoView({ behavior: 'smooth' })}><DockLabel>Processes</DockLabel><DockIcon><Plus /></DockIcon></DockItem>
          <DockItem label="Load example" onClick={loadExample}><DockLabel>Example</DockLabel><DockIcon><Sparkles /></DockIcon></DockItem>
          <DockItem label="Scheduling results" disabled={!state.result} onClick={() => resultsSection.current?.scrollIntoView({ behavior: 'smooth' })}><DockLabel>Results</DockLabel><DockIcon><BarChart3 /></DockIcon></DockItem>
          <span className="dock-divider" aria-hidden="true" />
          <DockItem label={isPlaying ? 'Pause timeline' : 'Play timeline'} disabled={!state.result} active={isPlaying} onClick={() => setIsPlaying((playing) => !playing)}><DockLabel>{isPlaying ? 'Pause' : 'Play'}</DockLabel><DockIcon>{isPlaying ? <Pause /> : <Play />}</DockIcon></DockItem>
          <DockItem label="Reset timeline" disabled={!state.result} onClick={() => { setSelectedTime(0); setIsPlaying(false) }}><DockLabel>Reset</DockLabel><DockIcon><RotateCcw /></DockIcon></DockItem>
          <DockItem label="Export results" disabled={!state.result} onClick={exportCsv}><DockLabel>Export</DockLabel><DockIcon><Download /></DockIcon></DockItem>
          <DockItem label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={toggleTheme}><DockLabel>Theme</DockLabel><DockIcon>{theme === 'dark' ? <Sun /> : <Moon />}</DockIcon></DockItem>
        </Dock>
      </div>
    </TooltipProvider>
  )
}

export default App
