/**
 * What a message says, in as few bytes as the two ends can agree on.
 *
 * A circuit that carries 300 bits a second is a circuit where the wording of a
 * message is a cost. "RICE 14000; FLOUR 5000" is twenty-two characters, and
 * twenty of them are spelling out two things every relay operator on the
 * network already knows: that the first number is rice and the second is
 * flour. If both ends hold the same table, the message is a table index and a
 * number — three bytes each — and the spelling never goes on the wire at all.
 *
 * That is the whole of the idea, and it is not a new one. This is CayenneLPP:
 * a reading is an identifier followed by a value whose width and scale the
 * identifier implies, packed one after another with no separators, because
 * there is nothing to separate — the receiver knows how long each field is
 * before it reads it. The temperature, humidity and pressure identifiers below
 * are LPP's own numbers, since there is no reason to invent numbers somebody
 * has already agreed on. LPP sends a channel *and* a type, because a node may
 * have three thermometers on it; here the identifier is the quantity itself,
 * so one byte does both jobs.
 *
 * Nothing between the two ends reads any of this. A relay reads the address on
 * the front and the checksum on the back; the codebook is the ends' business.
 */

/** A quantity both ends of the circuit already agree on. */
export interface Field {
  id: number
  name: string
  unit: string
  /** Bytes the value occupies. Implied by the id, so it is never sent. */
  width: 1 | 2
  /** The value is carried as `value / step`, which is how a tenth of a degree fits in an integer. */
  step: number
  signed?: boolean
}

/**
 * The codebook.
 *
 * Goods are counted in whole units and never negative, so they are plain
 * 16-bit counts. The weather fields are LPP's: 0x67 is a tenth of a degree and
 * can go below zero, 0x68 is half a percent in one byte, 0x73 is a tenth of a
 * millibar. Wind has no LPP type, so it gets one of ours, which is the honest
 * thing to say about it.
 */
export const FIELDS: Field[] = [
  { id: 0x01, name: 'RICE', unit: 'kg', width: 2, step: 1 },
  { id: 0x02, name: 'FLOUR', unit: 'kg', width: 2, step: 1 },
  { id: 0x03, name: 'SALT', unit: 'kg', width: 2, step: 1 },
  { id: 0x04, name: 'FUEL', unit: 'L', width: 2, step: 1 },
  { id: 0x05, name: 'CELLS', unit: '', width: 2, step: 1 },
  { id: 0x67, name: 'TEMP', unit: '°C', width: 2, step: 0.1, signed: true },
  { id: 0x68, name: 'HUMIDITY', unit: '%', width: 1, step: 0.5 },
  { id: 0x73, name: 'PRESSURE', unit: 'hPa', width: 2, step: 0.1 },
  { id: 0x77, name: 'WIND', unit: 'm/s', width: 2, step: 0.1 },
]

const BY_ID = new Map(FIELDS.map((field) => [field.id, field]))

/** One thing being reported: which quantity, and how much of it. */
export interface Reading {
  id: number
  value: number
}

/**
 * The first byte of a payload, and the only thing that is not the message.
 *
 * It sits in the payload rather than in the frame header on purpose: a relay
 * has no business knowing whether it is carrying a stock count or a sentence,
 * and putting it in the header would invite one to look.
 */
export const KIND_TEXT = 0
export const KIND_READINGS = 1

export type Template = 'text' | 'stock' | 'weather'

/** What each template starts out saying. Editable on screen; these are the defaults. */
export const TEMPLATES: Record<Template, { text: string; readings: Reading[] }> = {
  text: { text: 'HELLO', readings: [] },
  stock: {
    text: '',
    readings: [
      { id: 0x01, value: 14000 },
      { id: 0x02, value: 5000 },
    ],
  },
  weather: {
    text: '',
    readings: [
      { id: 0x67, value: 31.4 },
      { id: 0x68, value: 78 },
      { id: 0x73, value: 1008.5 },
      { id: 0x77, value: 4.2 },
    ],
  },
}

export const fieldOf = (id: number) => BY_ID.get(id)

const limit = (field: Field) => (field.signed ? (1 << (field.width * 8 - 1)) - 1 : (1 << (field.width * 8)) - 1)

/**
 * The largest value this field can carry, in the unit a person types.
 *
 * Rounded, because 32767 tenths is 3276.7000000000003 in binary floating point
 * and a limit that cannot be typed back in is not a limit.
 */
export const maxValue = (field: Field) => Number((limit(field) * field.step).toFixed(2))

/** Big-endian, which is the order a wire has always been read in. */
function toBytes(raw: number, width: number): number[] {
  return Array.from({ length: width }, (_, i) => (raw >> ((width - 1 - i) * 8)) & 0xff)
}

function fromBytes(bytes: number[], signed: boolean): number {
  const raw = bytes.reduce((n, byte) => (n << 8) | byte, 0)
  const top = 1 << (bytes.length * 8 - 1)
  return signed && raw >= top ? raw - top * 2 : raw
}

/**
 * Pack readings for the wire: kind, then id and value, id and value.
 *
 * A value that will not fit is clamped rather than wrapped. A wrapped reading
 * is a plausible lie — 70 000 kg of rice arriving as 4464 — and a report that
 * has quietly halved itself is worse than one that is obviously at its limit.
 */
export function packReadings(readings: Reading[]): number[] {
  const out = [KIND_READINGS]
  for (const reading of readings) {
    const field = BY_ID.get(reading.id)
    if (!field) continue
    const bound = limit(field)
    const raw = Math.max(field.signed ? -bound - 1 : 0, Math.min(bound, Math.round(reading.value / field.step)))
    out.push(field.id, ...toBytes(raw < 0 ? raw + (1 << (field.width * 8)) : raw, field.width))
  }
  return out
}

/** Pack a sentence: the kind byte, then one 7-bit character per byte. */
export function packText(text: string): number[] {
  return [KIND_TEXT, ...[...text].map((ch) => ch.charCodeAt(0) & 0x7f)]
}

/** Read a payload back. Unknown ids stop the read: their width is unknowable. */
export function unpack(payload: number[]): { kind: number; text: string; readings: Reading[] } {
  const body = payload.slice(1)
  if (payload[0] !== KIND_READINGS) {
    return { kind: KIND_TEXT, text: body.map((byte) => String.fromCharCode(byte)).join(''), readings: [] }
  }
  const readings: Reading[] = []
  for (let i = 0; i < body.length; ) {
    const field = BY_ID.get(body[i])
    // An unknown id has an unknown width, so there is no skipping past it: the
    // rest of the payload is unreadable and the read stops where it stopped.
    if (!field || i + 1 + field.width > body.length) break
    const value = fromBytes(body.slice(i + 1, i + 1 + field.width), Boolean(field.signed))
    readings.push({ id: field.id, value: Number((value * field.step).toFixed(2)) })
    i += 1 + field.width
  }
  return { kind: KIND_READINGS, text: '', readings }
}

/** How a reading reads out loud, and how it would have had to be spelled. */
export function spell(reading: Reading): string {
  const field = BY_ID.get(reading.id)
  if (!field) return '?'
  return `${field.name} ${reading.value}${field.unit ? ` ${field.unit}` : ''}`
}

/** The whole message as a person would write it — the thing the packing avoids sending. */
export const asWritten = (readings: Reading[]) => readings.map(spell).join('; ')
