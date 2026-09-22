'use client'

import {
  AnimatePresence,
  motion,
  type MotionValue,
  type SpringOptions,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

const DOCK_HEIGHT = 112
const DEFAULT_MAGNIFICATION = 72
const DEFAULT_DISTANCE = 140
const DEFAULT_PANEL_HEIGHT = 62

type DockProps = {
  children: ReactNode
  className?: string
  distance?: number
  panelHeight?: number
  magnification?: number
  spring?: SpringOptions
}

type DockItemProps = {
  className?: string
  children: ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

type DockInjectedProps = {
  width?: MotionValue<number>
  isHovered?: MotionValue<number>
}

type DockContextType = {
  mouseX: MotionValue<number>
  spring: SpringOptions
  magnification: number
  distance: number
  reduceMotion: boolean
}

const DockContext = createContext<DockContextType | undefined>(undefined)

function useDock() {
  const context = useContext(DockContext)
  if (!context) throw new Error('useDock must be used within Dock.')
  return context
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 170, damping: 18 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: DockProps) {
  const mouseX = useMotionValue(Infinity)
  const isHovered = useMotionValue(0)
  const prefersReducedMotion = useReducedMotion()
  const maxHeight = useMemo(
    () => Math.max(DOCK_HEIGHT, magnification + magnification / 2),
    [magnification],
  )
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight])
  const height = useSpring(heightRow, spring)

  return (
    <motion.div
      style={{ height: prefersReducedMotion ? panelHeight : height, scrollbarWidth: 'none' }}
      className="flex max-w-[calc(100vw-1rem)] items-end overflow-x-auto px-1"
    >
      <motion.div
        onMouseMove={({ clientX }) => {
          if (prefersReducedMotion) return
          isHovered.set(1)
          mouseX.set(clientX)
        }}
        onMouseLeave={() => {
          isHovered.set(0)
          mouseX.set(Infinity)
        }}
        className={cn('dock-panel mx-auto flex w-fit items-center gap-2 px-2', className)}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Simulator commands"
      >
        <DockContext.Provider
          value={{
            mouseX,
            spring,
            distance,
            magnification,
            reduceMotion: Boolean(prefersReducedMotion),
          }}
        >
          {children}
        </DockContext.Provider>
      </motion.div>
    </motion.div>
  )
}

function DockItem({
  children,
  className,
  label,
  active = false,
  disabled = false,
  onClick,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const { distance, magnification, mouseX, spring, reduceMotion } = useDock()
  const isHovered = useMotionValue(0)
  const mouseDistance = useTransform(mouseX, (value) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return value - rect.x - rect.width / 2
  })
  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [42, reduceMotion ? 42 : magnification, 42],
  )
  const width = useSpring(widthTransform, spring)

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      style={{ width }}
      onClick={onClick}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className={cn('dock-item relative inline-flex aspect-square shrink-0 items-center justify-center', className)}
    >
      {Children.map(children, (child) =>
        cloneElement(child as ReactElement<DockInjectedProps>, { width, isHovered }),
      )}
    </motion.button>
  )
}

function DockLabel({
  children,
  className,
  isHovered,
}: {
  children: ReactNode
  className?: string
  isHovered?: MotionValue<number>
}) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => isHovered?.on('change', (value) => setIsVisible(value === 1)), [isHovered])

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.span
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: -8 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.16 }}
          className={cn('dock-label', className)}
          role="tooltip"
        >
          {children}
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}

function DockIcon({
  children,
  className,
  width,
}: {
  children: ReactNode
  className?: string
  width?: MotionValue<number>
}) {
  const fallback = useMotionValue(42)
  const iconWidth = useTransform(width ?? fallback, (value) => value * 0.46)
  return (
    <motion.span style={{ width: iconWidth }} className={cn('flex items-center justify-center', className)}>
      {children}
    </motion.span>
  )
}

export { Dock, DockIcon, DockItem, DockLabel }
