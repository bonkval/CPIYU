import { describe, expect, it } from 'vitest'
import { validateProcesses } from '@/features/scheduler/validation'

describe('process validation', () => {
  it('rejects duplicate IDs and invalid numeric values', () => {
    const errors = validateProcesses([
      { id: 'P1', arrivalTime: -1, burstTime: 0, priority: 100, inputOrder: 0 },
      { id: 'p1', arrivalTime: 0, burstTime: 2, priority: 1, inputOrder: 1 },
    ])
    expect(errors[0]).toMatchObject({
      id: expect.any(String),
      arrivalTime: expect.any(String),
      burstTime: expect.any(String),
      priority: expect.any(String),
    })
    expect(errors[1].id).toBeTruthy()
  })

  it('requires priorities to start at one', () => {
    const errors = validateProcesses([
      { id: 'P1', arrivalTime: 0, burstTime: 1, priority: 0, inputOrder: 0 },
    ])
    expect(errors[0].priority).toContain('1 to 99')
  })

  it('limits process names to 25 characters', () => {
    const errors = validateProcesses([
      { id: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', arrivalTime: 0, burstTime: 1, priority: 1, inputOrder: 0 },
    ])
    expect(errors[0].id).toContain('25 characters')
  })
})
