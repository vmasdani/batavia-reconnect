/**
 * One drawn scene per era, sitting behind story mode.
 *
 * These are built from shapes rather than painted, for the same reason the HUD
 * icons are: they inherit the palette, they cost a few kilobytes, and an era's
 * backdrop is a repeating structure — poles down a road, jacks on a panel,
 * rings on a lattice, dies on a wafer — which is cheaper and steadier to write
 * as a loop than to draw by hand.
 *
 * Every scene shares one viewBox and one horizon so the eras cut against each
 * other, and every scene draws far to near in three tones. Nothing here is
 * meant to be looked at directly: `.backdrop` holds them well under the text,
 * and the scrim keeps the dialogue box readable over the busiest of them.
 */

import { artFor } from './pixelart'

const HORIZON = 620

/** Flat fills, far to near, plus the one warm accent a scene is allowed. */
const FAR = 'var(--bd-far)'
const MID = 'var(--bd-mid)'
const NEAR = 'var(--bd-near)'
const HOT = 'var(--bd-hot)'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 2030: a skyline with nothing lit in it. */
function DeadCity() {
  // x, width, height above the horizon. Fixed rather than random: the same
  // ruin should be in the same place every time the era is re-read.
  const towers = [
    [30, 92, 214], [138, 58, 302], [212, 112, 148], [338, 70, 386], [422, 96, 238],
    [532, 54, 330], [600, 128, 192], [744, 78, 418], [836, 66, 262], [914, 120, 168],
    [1048, 58, 348], [1118, 92, 228], [1224, 74, 300], [1312, 108, 178],
  ]
  return (
    <>
      <rect x="0" y={HORIZON} width="1440" height="280" fill={MID} />
      {towers.map(([x, w, h]) => (
        <path
          key={x}
          fill={FAR}
          d={`M${x} ${HORIZON} V${HORIZON - h} l${w * 0.34} ${h * 0.07} l${w * 0.3} ${-h * 0.1} l${w * 0.36} ${h * 0.05} V${HORIZON} Z`}
        />
      ))}
      {range(9).map((i) => {
        const x = 60 + i * 168
        return <path key={i} fill={NEAR} d={`M${x} 900 V760 l60 -34 l60 34 V900 Z`} />
      })}
    </>
  )
}

/** 2031: one mast, guyed, on a hill. The only lit window in the era. */
function FirstMast() {
  const top = 148
  const base = 656
  const x = 706
  return (
    <>
      <path fill={MID} d={`M0 900 V712 Q360 606 720 648 T1440 700 V900 Z`} />
      <g stroke={FAR} strokeWidth="4" fill="none">
        <path d={`M${x} ${base} V${top}`} />
        <path d={`M${x} ${top + 26} L${x - 150} ${base + 8}`} />
        <path d={`M${x} ${top + 26} L${x + 150} ${base + 8}`} />
        <path d={`M${x} ${top + 150} L${x - 96} ${base + 8}`} />
        <path d={`M${x} ${top + 150} L${x + 96} ${base + 8}`} />
      </g>
      <g stroke={FAR} strokeWidth="3">
        {range(11).map((i) => {
          const y = top + 34 + i * 44
          const w = lerp(9, 34, i / 10)
          return <path key={i} d={`M${x - w} ${y} L${x + w} ${y + 22} M${x + w} ${y} L${x - w} ${y + 22}`} />
        })}
      </g>
      <path fill={NEAR} d="M842 690 V622 l52 -32 l52 32 V690 Z" />
      <rect x="884" y="632" width="22" height="18" fill={HOT} />
    </>
  )
}

/** 2034: poles running away down the old toll road, and one of them cut. */
function CopperLine() {
  const vx = 1172
  const vy = 548
  const poles = range(9).map((i) => {
    const t = (i / 8) ** 1.55
    return { x: lerp(46, vx - 22, t), y: lerp(848, vy + 14, t), h: lerp(486, 58, t) }
  })
  return (
    <>
      <path fill={MID} d={`M${vx} ${vy} L980 900 L60 900 Z`} />
      <g stroke={FAR} strokeWidth="3" fill="none">
        {poles.slice(0, -1).map((p, i) => {
          const q = poles[i + 1]
          const sag = (p.x - q.x) * 0.16
          // The third pole is the one they cut: its wire stops in mid-air.
          if (i === 2) return <path key={i} d={`M${p.x} ${p.y - p.h} Q${(p.x + q.x) / 2} ${p.y - p.h + sag} ${(p.x + q.x) / 2 - 10} ${p.y - p.h * 0.36}`} />
          return (
            <path
              key={i}
              d={`M${p.x} ${p.y - p.h} Q${(p.x + q.x) / 2} ${(p.y + q.y) / 2 - (p.h + q.h) / 2 + sag} ${q.x} ${q.y - q.h}`}
            />
          )
        })}
      </g>
      {poles.map((p, i) => {
        const arm = p.h * 0.09
        const lean = i === 2 ? 9 : 0
        return (
          <g key={i} stroke={i === 2 ? NEAR : FAR} strokeWidth={Math.max(3, p.h * 0.022)} fill="none">
            <path d={`M${p.x} ${p.y} L${p.x + lean} ${p.y - p.h}`} />
            <path d={`M${p.x + lean - arm} ${p.y - p.h * 0.94} L${p.x + lean + arm} ${p.y - p.h * 0.94}`} />
          </g>
        )
      })}
      <path fill={NEAR} d="M0 900 V856 Q210 818 420 850 T900 900 Z" />
    </>
  )
}

/** 2039: the panel, and everything Ayu now knows because of it. */
function Switchboard() {
  const cords: [number, number, number, number][] = [
    [372, 214, 706, 366], [468, 292, 900, 214], [610, 448, 1032, 292],
    [802, 136, 526, 448], [948, 370, 1104, 136],
  ]
  return (
    <>
      <rect x="264" y="96" width="912" height="556" rx="6" fill={FAR} />
      <g fill={MID}>
        {range(8).map((row) =>
          range(22).map((col) => (
            <circle key={`${row}-${col}`} cx={310 + col * 40} cy={142 + row * 64} r="7" />
          )),
        )}
      </g>
      <g stroke={HOT} strokeWidth="4" fill="none" opacity="0.66">
        {cords.map(([x1, y1, x2, y2], i) => (
          <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 150} ${x2} ${y2}`} />
        ))}
      </g>
      <g fill={NEAR}>
        <path d="M196 900 V712 q0 -34 34 -34 h96 q34 0 34 34 V900 Z" />
        <circle cx="278" cy="632" r="46" />
        <rect x="150" y="806" width="230" height="14" rx="7" />
      </g>
    </>
  )
}

/** 2045: the shed where they stopped finding valves and started making them. */
function GlassShed() {
  return (
    <>
      <path fill={FAR} d="M180 900 V330 l540 -186 l540 186 V900 Z" />
      <g stroke={MID} strokeWidth="5" fill="none">
        <path d="M720 144 V900" />
        <path d="M180 424 H1260 M180 552 H1260" />
      </g>
      <circle cx="420" cy="672" r="150" fill={HOT} opacity="0.16" />
      <path fill={NEAR} d="M320 828 V712 a100 100 0 0 1 200 0 V828 Z" />
      <path fill={HOT} d="M382 828 V722 a38 38 0 0 1 76 0 V828 Z" />
      <rect x="820" y="716" width="380" height="12" fill={NEAR} />
      {range(7).map((i) => {
        const x = 844 + i * 52
        return (
          <g key={i} fill={NEAR}>
            <path d={`M${x} 716 V648 a17 17 0 0 1 34 0 V716 Z`} />
            <rect x={x + 10} y="716" width="4" height="20" />
            <rect x={x + 20} y="716" width="4" height="20" />
          </g>
        )
      })}
    </>
  )
}

/** 2052: core memory, which remembers with the power off. */
function CoreMemory() {
  const rings = range(9).flatMap((r) => range(13).map((c) => [220 + c * 84 + (r % 2) * 42, 128 + r * 62] as const))
  return (
    <>
      <g stroke={FAR} strokeWidth="4">
        {range(13).map((i) => (
          <path key={`a${i}`} d={`M${120 + i * 108} 80 L${120 + i * 108 + 420} 640`} />
        ))}
        {range(13).map((i) => (
          <path key={`b${i}`} d={`M${1320 - i * 108} 80 L${1320 - i * 108 - 420} 640`} />
        ))}
      </g>
      <g stroke={MID} strokeWidth="5" fill="none">
        {rings.map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="17" ry="11" transform={`rotate(-38 ${x} ${y})`} />
        ))}
      </g>
      <rect x="0" y="700" width="1440" height="200" fill={NEAR} />
      <g fill={HOT} opacity="0.5">
        {range(6).map((i) => (
          <rect key={i} x={430 + i * 104} y="742" width="46" height="8" rx="4" />
        ))}
      </g>
    </>
  )
}

/** 2061: the drawer, most of the way empty. */
function EmptyDrawer() {
  const open = { row: 2, col: 4 }
  return (
    <>
      <rect x="150" y="70" width="1140" height="620" fill={FAR} />
      <g>
        {range(5).map((row) =>
          range(8).map((col) => {
            if (row === open.row && col === open.col) return null
            const x = 172 + col * 140
            const y = 92 + row * 122
            return (
              <g key={`${row}-${col}`}>
                <rect x={x} y={y} width="118" height="100" rx="4" fill={MID} />
                <rect x={x + 38} y={y + 46} width="42" height="8" rx="4" fill={FAR} />
              </g>
            )
          }),
        )}
      </g>
      <g>
        <path fill={NEAR} d="M700 336 L1004 336 L1064 560 L640 560 Z" />
        <path fill={FAR} d="M726 366 L982 366 L1028 528 L678 528 Z" />
        {range(3).map((i) => (
          <rect key={i} x={738 + i * 92} y={438 + i * 12} width="58" height="34" rx="3" fill={HOT} opacity="0.72" />
        ))}
      </g>
      <rect x="0" y="690" width="1440" height="210" fill={NEAR} />
    </>
  )
}

/** 2068: three good dies, and a network that stops needing them from you. */
function FabAndMesh() {
  const islands: [number, number, number][] = [
    [1006, 214, 44], [1180, 302, 30], [934, 392, 34], [1128, 470, 40],
    [1274, 402, 26], [1010, 560, 30], [1220, 612, 36],
  ]
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [5, 6], [3, 6]]
  const good = new Set(['3-4', '5-2', '7-6'])
  return (
    <>
      <clipPath id="wafer">
        <path d="M170 400 a220 220 0 1 1 440 0 a220 220 0 1 1 -440 0 M170 470 h440" />
      </clipPath>
      <circle cx="390" cy="400" r="220" fill={FAR} />
      <g clipPath="url(#wafer)">
        {range(11).map((row) =>
          range(11).map((col) => {
            const key = `${row}-${col}`
            return (
              <rect
                key={key}
                x={168 + col * 41}
                y={178 + row * 41}
                width="34"
                height="34"
                fill={good.has(key) ? HOT : MID}
                opacity={good.has(key) ? 0.85 : 1}
              />
            )
          }),
        )}
      </g>
      <g stroke={MID} strokeWidth="3">
        {links.map(([a, b], i) => (
          <path key={i} d={`M${islands[a][0]} ${islands[a][1]} L${islands[b][0]} ${islands[b][1]}`} />
        ))}
      </g>
      <g fill={MID}>
        {islands.map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.62} />
        ))}
      </g>
      <rect x="0" y="820" width="1440" height="80" fill={NEAR} />
    </>
  )
}

/** 2048: racks of valves in a shed that is never dark, and a plugboard. */
function CountingRoom() {
  const racks = range(5).map((i) => 96 + i * 232)
  return (
    <>
      <rect x="0" y="0" width="1440" height="900" fill={FAR} />
      {racks.map((x) => (
        <g key={x}>
          <rect x={x} y="150" width="168" height="560" fill={MID} />
          {range(7).map((r) =>
            range(4).map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={x + 30 + c * 36}
                cy={186 + r * 76}
                r="11"
                fill={HOT}
                /* One dead valve per rack, and finding it is the whole year. */
                opacity={(r * 4 + c) % 13 === 0 ? 0.12 : 0.62}
              />
            )),
          )}
        </g>
      ))}
      <rect x="0" y="700" width="1440" height="200" fill={NEAR} />
      {/* The plugboard: the only place the machine is told anything. */}
      <rect x="1010" y="470" width="330" height="240" fill={NEAR} />
      <g stroke={HOT} strokeWidth="5" fill="none" opacity="0.7">
        {range(6).map((i) => (
          <path key={i} d={`M${1046 + i * 26} 512 q${34 + i * 12} ${86 + i * 16} ${112 - i * 8} 0`} />
        ))}
      </g>
    </>
  )
}

const SCENES = [DeadCity, FirstMast, CopperLine, Switchboard, GlassShed, CountingRoom, CoreMemory, EmptyDrawer, FabAndMesh]

export function Backdrop({ era }: { era: number }) {
  const Scene = SCENES[era] ?? SCENES[0]
  const photo = artFor(era)
  return (
    <div className="backdrop">
      {/* The photograph when the era has one, and the drawn scene when it does
          not. Both are decoration for text and neither is announced; the credit
          under the photograph is the one part a reader may want, so it is the
          one part not hidden from a screen reader. */}
      {photo ? (
        <img className="backdrop__photo" src={photo.src} alt="" aria-hidden />
      ) : (
        <svg className="backdrop__art" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <Scene />
        </svg>
      )}
      <div className="backdrop__scrim" aria-hidden />
      {photo && (
        <p className="backdrop__credit">
          <a href={photo.page} target="_blank" rel="noreferrer noopener">
            {photo.credit}
          </a>
          <span>{photo.license}</span>
        </p>
      )}
    </div>
  )
}
