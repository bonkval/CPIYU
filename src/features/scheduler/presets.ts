import type { ProcessInput } from './types'

export const exampleProcesses: ProcessInput[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3, inputOrder: 0 },
  { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, inputOrder: 1 },
  { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 2, inputOrder: 2 },
]

export function exampleProcessesForCount(count: number): ProcessInput[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const template = exampleProcesses[index % exampleProcesses.length]
    const round = Math.floor(index / exampleProcesses.length)
    return {
      ...template,
      id: `P${index + 1}`,
      arrivalTime: template.arrivalTime + round * 2,
      inputOrder: index,
    }
  })
}

export function createProcesses(count: number): ProcessInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `P${index + 1}`,
    arrivalTime: index,
    burstTime: Math.max(1, 5 - index),
    priority: index + 1,
    inputOrder: index,
  }))
}

export function randomProcesses(count: number): ProcessInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `P${index + 1}`,
    arrivalTime: Math.floor(Math.random() * Math.max(1, count + 2)),
    burstTime: Math.floor(Math.random() * 7) + 1,
    priority: Math.floor(Math.random() * 5),
    inputOrder: index,
  }))
}
