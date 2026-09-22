import type {
  AnalysisResult,
  ExecutionSlice,
  ProcessInput,
  ProcessMetrics,
  TimeSnapshot,
} from './types'

const byDispatchOrder = (a: ProcessInput, b: ProcessInput) =>
  a.priority - b.priority ||
  a.arrivalTime - b.arrivalTime ||
  a.inputOrder - b.inputOrder

export function simulatePreemptivePriority(
  processes: ProcessInput[],
): AnalysisResult {
  if (processes.length === 0) {
    throw new Error('At least one process is required.')
  }

  const remaining = new Map(processes.map((process) => [process.id, process.burstTime]))
  const completion = new Map<string, number>()
  const firstStart = new Map<string, number>()
  const slices: ExecutionSlice[] = []
  const snapshots: TimeSnapshot[] = []
  let completed = 0
  let time = 0
  let busyTime = 0

  while (completed < processes.length) {
    const eligible = processes
      .filter(
        (process) =>
          process.arrivalTime <= time && (remaining.get(process.id) ?? 0) > 0,
      )
      .toSorted(byDispatchOrder)
    const running = eligible[0] ?? null
    const readyQueue = eligible.slice(1).map((process) => ({
      processId: process.id,
      priority: process.priority,
      remainingTime: remaining.get(process.id) ?? 0,
    }))

    snapshots.push({
      time,
      runningProcessId: running?.id ?? null,
      readyQueue,
      remainingTimes: Object.fromEntries(remaining),
    })

    const previousSlice = slices.at(-1)
    const processId = running?.id ?? null
    if (previousSlice && previousSlice.processId === processId && previousSlice.end === time) {
      previousSlice.end += 1
    } else {
      let reason: ExecutionSlice['reason'] = 'start'
      if (!running) reason = 'idle'
      else if (previousSlice?.processId) {
        reason = (remaining.get(previousSlice.processId) ?? 0) > 0
          ? 'preemption'
          : 'completion'
      }
      slices.push({ processId, start: time, end: time + 1, reason })
    }

    if (!running) {
      time += 1
      continue
    }

    if (!firstStart.has(running.id)) firstStart.set(running.id, time)
    const nextRemaining = (remaining.get(running.id) ?? 0) - 1
    remaining.set(running.id, nextRemaining)
    busyTime += 1
    time += 1
    if (nextRemaining === 0) {
      completion.set(running.id, time)
      completed += 1
    }
  }

  const metrics: ProcessMetrics[] = processes.map((process) => {
    const completionTime = completion.get(process.id) ?? time
    const turnaroundTime = completionTime - process.arrivalTime
    return {
      processId: process.id,
      completionTime,
      turnaroundTime,
      waitingTime: turnaroundTime - process.burstTime,
      responseTime: (firstStart.get(process.id) ?? process.arrivalTime) - process.arrivalTime,
    }
  })
  const totalWaiting = metrics.reduce((sum, item) => sum + item.waitingTime, 0)
  const totalTurnaround = metrics.reduce((sum, item) => sum + item.turnaroundTime, 0)
  const processSlices = slices.filter((slice) => slice.processId !== null)
  const contextSwitches = processSlices.reduce((count, slice, index) => {
    if (index === 0) return count
    return count + (processSlices[index - 1].processId !== slice.processId ? 1 : 0)
  }, 0)

  return {
    slices,
    snapshots,
    metrics,
    averageWaitingTime: totalWaiting / processes.length,
    averageTurnaroundTime: totalTurnaround / processes.length,
    cpuUtilization: time === 0 ? 0 : (busyTime / time) * 100,
    contextSwitches,
    totalDuration: time,
  }
}

