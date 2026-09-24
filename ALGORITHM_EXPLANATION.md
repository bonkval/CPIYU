# CPU Scheduling Logic

## How the selected CPU scheduling algorithm works

The simulator uses **preemptive priority scheduling**.

1. Time starts at `0` and advances one unit per loop.
2. At each time unit, the scheduler finds every unfinished process whose arrival time is less than or equal to the current time.
3. It sorts those processes using this order:
   - Lowest priority number first.
   - If priorities are equal, earliest arrival time first.
   - If priority and arrival time are equal, earliest input order first.
4. The first process after sorting receives the CPU for one time unit.
5. Its remaining burst time is reduced by `1`.
6. The scheduler compares all eligible processes again during the next time unit. A newly arrived process preempts the running process only when it has a lower priority number.
7. This repeats until every process has finished.

If no process has arrived, the CPU is marked idle and time advances by one unit.

## How Waiting Time is computed

```text
Waiting Time = Turnaround Time - Burst Time
WT = TAT - BT
```

Turnaround time includes all time from arrival to completion. Subtracting the time actually spent using the CPU leaves the total time spent waiting in the ready queue.

In the code:

```ts
waitingTime: turnaroundTime - process.burstTime
```

## How Turnaround Time is computed

```text
Turnaround Time = Completion Time - Arrival Time
TAT = CT - AT
```

Completion time is recorded immediately after a process uses its final unit of burst time.

In the code:

```ts
const turnaroundTime = completionTime - process.arrivalTime
```

## How the Ready Queue is determined

At each time unit, the code selects processes that:

- Have already arrived: `arrivalTime <= time`
- Still have work remaining: `remainingTime > 0`

It then sorts them by priority, arrival time, and input order. The first process becomes the running process. Every other eligible process becomes part of the ready queue.

```ts
const eligible = processes
  .filter(
    (process) =>
      process.arrivalTime <= time && (remaining.get(process.id) ?? 0) > 0,
  )
  .toSorted(byDispatchOrder)

const running = eligible[0] ?? null
const readyQueue = eligible.slice(1)
```

A process with the same priority as the running process does not automatically preempt it. The earlier arrival wins. If both arrived together, their original input order decides.

## How the Gantt Chart is generated

The scheduler creates an execution slice whenever the running process changes or the CPU changes between busy and idle.

Each slice stores:

- Process ID, or `null` for idle time
- Start time
- End time
- Reason: start, preemption, completion, or idle

If the same process continues during the next time unit, the code extends the current slice instead of creating another one:

```ts
if (
  previousSlice &&
  previousSlice.processId === processId &&
  previousSlice.end === time
) {
  previousSlice.end += 1
}
```

When the running process changes, a new slice is added:

```ts
slices.push({ processId, start: time, end: time + 1, reason })
```

The `GanttChart` component displays each slice as a block. Its width is based on the slice duration:

```ts
flexGrow: slice.end - slice.start
```

Therefore, a process that runs for more time units receives a wider block. Idle periods are also displayed as separate blocks.

## How the main source-code logic works

### Dispatch order

File: `src/features/scheduler/preemptive-priority.ts`

```ts
const byDispatchOrder = (a: ProcessInput, b: ProcessInput) =>
  a.priority - b.priority ||
  a.arrivalTime - b.arrivalTime ||
  a.inputOrder - b.inputOrder
```

The comparisons are evaluated from left to right. A lower value sorts first. The next comparison is used only when the previous values are equal.

### Remaining burst-time tracking

```ts
const remaining = new Map(
  processes.map((process) => [process.id, process.burstTime]),
)
```

The map starts with each process's full burst time. One unit is removed from the selected process during every loop:

```ts
const nextRemaining = (remaining.get(running.id) ?? 0) - 1
remaining.set(running.id, nextRemaining)
```

When the remaining time reaches zero, the current time is saved as its completion time.

### Time snapshots

Before executing each time unit, the scheduler saves the running process, ready queue, and remaining burst times in `snapshots`. The time inspector reads the snapshot for the selected time and displays that state.

### Starting the simulation

File: `src/App.tsx`

When the user selects **Analyze schedule**, `analyze()` first checks the inputs. If they are valid, it calls:

```ts
const result = simulatePreemptivePriority(state.processes)
```

The returned slices, snapshots, and metrics are stored in the application state and used to render the Gantt chart, ready queue, results table, and event log.

### Gantt chart interaction

File: `src/components/simulator/gantt-chart.tsx`

The component maps over `result.slices` to render the timeline. Clicking, hovering, or using the arrow keys changes the selected time. The application then uses that time to find the matching snapshot and execution slice.
