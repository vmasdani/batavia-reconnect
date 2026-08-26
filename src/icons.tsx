/**
 * Inline icons for the HUD.
 *
 * Drawn rather than imported so they inherit `currentColor` and stay legible
 * at 14 px against the amber-on-slate palette: a resource strip of six words
 * reads as a wall of text, six shapes reads at a glance.
 */

import type { ResourceId } from './world'
import type { KitId } from './sim'

interface IconProps {
  size?: number
  className?: string
}

function Svg({
  size = 15,
  className,
  strokeWidth = 1.8,
  children,
}: IconProps & { strokeWidth?: number; children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Copper: a coil of wire on a drum, the thing everyone is stealing. */
const Copper = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="7" rx="7" ry="3" />
    <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
    <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </Svg>
)

/** Steel: girder stock. */
const Steel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18l-4 4H7z" />
    <path d="M7 9v10" />
    <path d="M17 9v10" />
    <path d="M7 19h10" />
  </Svg>
)

/** Cells: a lead-acid battery. */
const Cells = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="15" height="10" rx="1.5" />
    <path d="M18 11h3v4h-3" />
    <path d="M7 6v2M13 6v2" />
    <path d="M7 13h5" />
  </Svg>
)

/** Parts: a valve, the currency of the electronics era to come. */
const Parts = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4h8v6a4 4 0 0 1-4 4 4 4 0 0 1-4-4z" />
    <path d="M12 14v4" />
    <path d="M9 18h6l-1 3h-4z" />
  </Svg>
)

/** Fuel: a drum. */
const Fuel = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M5 9h14M5 15h14" />
    <path d="M12 3v18" />
  </Svg>
)

/** Rations: a sack of rice. */
const Rations = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3h6l-1.5 3.5C17 8 19 11.4 19 15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4c0-3.6 2-7 4.5-8.5z" />
    <path d="M10 13h4" />
  </Svg>
)

export const RESOURCE_ICON: Record<ResourceId, (p: IconProps) => JSX.Element> = {
  copper: Copper,
  steel: Steel,
  cells: Cells,
  parts: Parts,
  fuel: Fuel,
  rations: Rations,
}

/** Kits reuse the shape of what they are made of, with a mast of their own. */
const Mast = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="M7 21 12 8l5 13" />
    <path d="M9 15h6" />
  </Svg>
)

const Transmitter = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" />
    <path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15" />
  </Svg>
)

const Genset = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="9" width="18" height="10" rx="2" />
    <path d="M7 9V6h6v3" />
    <path d="M13 12l-3 3h4l-3 3" />
  </Svg>
)

const Feeder = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20c4-6 12-6 16-12" />
    <path d="M4 20h4M16 4h4" />
  </Svg>
)

export const KIT_ICON: Record<KitId, (p: IconProps) => JSX.Element> = {
  mast: Mast,
  transmitter: Transmitter,
  battery: Cells,
  genset: Genset,
  feeder: Feeder,
}

/** A bandit camp, and the raid it produces. */
export const RaidIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 4 7v5c0 4.4 3.2 8.2 8 9 4.8-.8 8-4.6 8-9V7z" />
    <path d="m9 11 6 5M15 11l-6 5" />
  </Svg>
)

/** The day counter. */
export const DayIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7v5l3 2" />
  </Svg>
)

/** A site that is finished: hardened, and no longer asking for anything. */
export const HardenedIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.6}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)
