import type { ProcessInput } from './types'

export type ProcessField = 'id' | 'arrivalTime' | 'burstTime' | 'priority'
export type ValidationErrors = Record<number, Partial<Record<ProcessField, string>>>

export function validateProcesses(processes: ProcessInput[]): ValidationErrors {
  const errors: ValidationErrors = {}
  const normalizedIds = processes.map((process) => process.id.trim().toLowerCase())

  processes.forEach((process, index) => {
    const rowErrors: Partial<Record<ProcessField, string>> = {}
    if (!process.id.trim()) rowErrors.id = 'Process ID is required.'
    else if (normalizedIds.filter((id) => id === normalizedIds[index]).length > 1) {
      rowErrors.id = 'Process IDs must be unique.'
    }
    if (!Number.isInteger(process.arrivalTime) || process.arrivalTime < 0) {
      rowErrors.arrivalTime = 'Use an integer of 0 or greater.'
    }
    if (!Number.isInteger(process.burstTime) || process.burstTime <= 0) {
      rowErrors.burstTime = 'Use an integer greater than 0.'
    }
    if (!Number.isInteger(process.priority) || process.priority < 0 || process.priority > 99) {
      rowErrors.priority = 'Use an integer from 0 to 99.'
    }
    if (Object.keys(rowErrors).length > 0) errors[index] = rowErrors
  })

  if (processes.reduce((sum, process) => sum + (process.burstTime || 0), 0) > 10_000) {
    errors[0] = { ...errors[0], burstTime: 'Total burst time cannot exceed 10,000.' }
  }
  return errors
}

export const hasValidationErrors = (errors: ValidationErrors) =>
  Object.keys(errors).length > 0

