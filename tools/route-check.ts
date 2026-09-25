/**
 * The drawn route and the number in the panel come out of one search.
 *
 * `PixiMap` walks `messageRoute` to put the letter on the map, and `Prologue`
 * prints `messageDays`. If those two ever disagree the map is lying about the
 * thing the era is scored on, so this checks them against each other over a
 * spread of survey states — and checks that every leg of every route is a real
 * road or a real fire link, not a straight line between two places a runner
 * could not actually get between.
 */

import { buildWorld, ROADS, type World } from '../src/world'
import {
  fireLinks, messageDays, messageRoute, newSurvey, type Survey,
} from '../src/era0'

const world: World = buildWorld(0)
const ids = world.settlements.map((s) => s.id)

/** A survey where the named settlements are talking, with the given fires laid. */
function state(talking: string[], fires: string[], boards: string[]): Survey {
  const survey = newSurvey()
  for (const id of talking) survey.contact[id] = 'talking'
  survey.fires = fires
  survey.boards = [...new Set([...survey.boards, ...boards])]
  return survey
}

const road = new Set(ROADS.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]))

const cases: Array<{ name: string; survey: Survey }> = [
  { name: 'nothing but home', survey: state([], [], []) },
  { name: 'the coastal road', survey: state(['tangerang', 'priok', 'kemayoran'], [], []) },
  { name: 'boards everywhere', survey: state(ids, [], ids) },
  { name: 'all talking, no signals', survey: state(ids, [], []) },
  { name: 'all talking, every fire', survey: state(ids, ids, []) },
  { name: 'south only, two fires', survey: state(['kemayoran', 'menteng', 'senayan', 'kebayoran', 'depok', 'bogor'], ['bogor', 'depok'], ['menteng']) },
]

let bad = 0
for (const { name, survey } of cases) {
  const links = new Set(fireLinks(world, survey).flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]))
  let routed = 0
  for (const to of ids) {
    const days = messageDays(world, survey, to)
    const route = messageRoute(world, survey, to)

    if ((days === null) !== (route === null)) {
      console.log(`  ${name}: ${to} — days ${days}, route ${route ? route.join('>') : 'null'}`)
      bad++
      continue
    }
    if (!route) continue
    routed++

    if (route[0] !== 'batavia' || route[route.length - 1] !== to) {
      console.log(`  ${name}: ${to} — route runs ${route[0]}..${route[route.length - 1]}`)
      bad++
    }
    for (let i = 1; i < route.length; i++) {
      const leg = `${route[i - 1]}>${route[i]}`
      if (!road.has(leg) && !links.has(leg)) {
        console.log(`  ${name}: ${to} — leg ${leg} is neither a road nor a fire link`)
        bad++
      }
    }
  }
  console.log(`${name}: ${routed}/${ids.length} reachable`)
}

console.log(bad === 0 ? '\nRoutes agree with the days, and every leg is real.' : `\n${bad} problems.`)
process.exit(bad === 0 ? 0 : 1)
