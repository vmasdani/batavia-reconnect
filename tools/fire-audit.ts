import { buildWorld, groundMetres, KM_PER_TILE } from '../src/world'
import { fireSite, fireReach } from '../src/era0'
const world = buildWorld(0)
for (const s of world.settlements) {
  const f = fireSite(world, s)
  const d = Math.hypot(f.tx - s.tx, f.ty - s.ty)
  const tile = world.at(f.tx, f.ty)
  console.log(
    `${s.name.padEnd(14)} at ${String(s.tx).padStart(3)},${String(s.ty).padStart(2)} (${groundMetres(s.tx,s.ty).toFixed(0).padStart(4)}m)` +
    `  fire ${String(f.tx).padStart(3)},${String(f.ty).padStart(2)} ${f.metres.toFixed(0).padStart(4)}m` +
    `  ${(d * KM_PER_TILE).toFixed(1).padStart(4)}km  ${tile ? tile.terrain : 'OFF-GRID'}` +
    `  sees ${fireReach(world, s.id).map((x) => x.name).join(',') || '—'}`,
  )
}
