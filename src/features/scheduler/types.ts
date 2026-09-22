export interface ProcessInput {
  id: string
  arrivalTime: number
  burstTime: number
  priority: number
  inputOrder: number
}

export interface ReadyQueueEntry {
  processId: string
  priority: number
  remainingTime: number
}

export interface ExecutionSlice {
  processId: string | null
  start: number
  end: number
  reason: 'start' | 'preemption' | 'completion' | 'idle'
}

export interface TimeSnapshot {
  time: number
  runningProcessId: string | null
  readyQueue: ReadyQueueEntry[]
  remainingTimes: Record<string, number>
}

export interface ProcessMetrics {
  processId: string
  completionTime: number
  waitingTime: number
  turnaroundTime: number
  responseTime: number
}

export interface AnalysisResult {
  slices: ExecutionSlice[]
  snapshots: TimeSnapshot[]
  metrics: ProcessMetrics[]
  averageWaitingTime: number
  averageTurnaroundTime: number
  cpuUtilization: number
  contextSwitches: number
  totalDuration: number
}

