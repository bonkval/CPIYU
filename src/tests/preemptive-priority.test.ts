import { describe, expect, it } from 'vitest'
import { simulatePreemptivePriority } from '@/features/scheduler/preemptive-priority'
import type { ProcessInput } from '@/features/scheduler/types'

describe('preemptive priority scheduling', () => {
  it('matches the required classroom example', () => {
    const processes: ProcessInput[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3, inputOrder: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, inputOrder: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 2, inputOrder: 2 },
    ]
    const result = simulatePreemptivePriority(processes)

    expect(result.slices.map(({ processId, start, end }) => ({ processId, start, end }))).toEqual([
      { processId: 'P1', start: 0, end: 1 },
      { processId: 'P2', start: 1, end: 5 },
      { processId: 'P3', start: 5, end: 7 },
      { processId: 'P1', start: 7, end: 11 },
    ])
    expect(result.metrics).toEqual([
      { processId: 'P1', completionTime: 11, waitingTime: 6, turnaroundTime: 11, responseTime: 0 },
      { processId: 'P2', completionTime: 5, waitingTime: 0, turnaroundTime: 4, responseTime: 0 },
      { processId: 'P3', completionTime: 7, waitingTime: 3, turnaroundTime: 5, responseTime: 3 },
    ])
    expect(result.averageWaitingTime).toBe(3)
    expect(result.averageTurnaroundTime).toBeCloseTo(6.67, 2)
  })

  it('records CPU idle time', () => {
    const result = simulatePreemptivePriority([
      { id: 'P1', arrivalTime: 2, burstTime: 2, priority: 1, inputOrder: 0 },
    ])
    expect(result.slices).toMatchObject([
      { processId: null, start: 0, end: 2 },
      { processId: 'P1', start: 2, end: 4 },
    ])
    expect(result.cpuUtilization).toBe(50)
  })

  it('does not preempt for an equal-priority arrival', () => {
    const result = simulatePreemptivePriority([
      { id: 'P1', arrivalTime: 0, burstTime: 3, priority: 1, inputOrder: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 1, priority: 1, inputOrder: 1 },
    ])
    expect(result.slices.map((slice) => slice.processId)).toEqual(['P1', 'P2'])
  })
})

