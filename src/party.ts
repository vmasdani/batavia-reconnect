/**
 * The RECONNECT crew.
 *
 * Portraits are the cut-out versions from `assets/cut/`, produced by
 * `npm run cut:portraits`: the originals are drawn on a white card, which is
 * unusable as a map marker over terrain.
 *
 * Four roles that cover the problem between them: someone who can see the
 * shape of the network, someone who can move what it needs, someone who can
 * actually build the thing, and someone who can keep it from being carried
 * off in the night. None of them is sufficient alone — that is the point of
 * the project.
 *
 * Portraits and the backing track live in the project's top-level `assets/`
 * folder; Vite fingerprints and emits them as separate files at build time.
 */

import architect from './assets/classes/architect.svg'
import quartermaster from './assets/classes/quartermaster.svg'
import wireman from './assets/classes/wireman.svg'
import warden from './assets/classes/warden.svg'
import bayuPortrait from '../assets/cut/01-bayu.png'
import melPortrait from '../assets/cut/02-mel.png'
import pakMinPortrait from '../assets/cut/03-pak-min.png'
import tajuddinPortrait from '../assets/cut/04-tajuddin.png'

export interface PartyMember {
  id: string
  name: string
  className: string
  /** One line on what they actually do for the network. */
  role: string
  logo: string
  portrait: string
  /**
   * Their line on the map. Chosen clear of the colours the circuits already
   * use — amber for a live one, grey-blue for a surveyed one, red for a broken
   * one — so a route being planned is never mistaken for a route that exists.
   */
  color: number
}

export const PARTY: PartyMember[] = [
  {
    id: 'bayu',
    name: 'Bayu',
    className: 'Architect',
    role: 'Holds the whole topology in his head. Surveys the ground, then builds on it.',
    logo: architect,
    portrait: bayuPortrait,
    color: 0x7fc9ff,
  },
  {
    id: 'mel',
    name: 'Mel',
    className: 'Quartermaster',
    role: 'Moves copper, cells and crews between sites. Knows which roads are open.',
    logo: quartermaster,
    portrait: melPortrait,
    color: 0x8fe8d0,
  },
  {
    id: 'pakmin',
    name: 'Pak Min',
    className: 'Wireman',
    role: 'Builds and tunes the transmitters. If it carries a signal, he soldered it.',
    logo: wireman,
    portrait: pakMinPortrait,
    color: 0xe6a8ff,
  },
  {
    id: 'tajuddin',
    name: 'Tajuddin',
    className: 'Warden',
    role: 'Guards the lines and the yards. Stands between the copper and the raiders.',
    logo: warden,
    portrait: tajuddinPortrait,
    color: 0xff8fd0,
  },
]
