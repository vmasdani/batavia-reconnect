/**
 * Play Era 0 with nobody watching, and print the ration curve.
 *
 * `resolveSurveyDay` is a pure function of (world, survey), so a run is a loop
 * and forty days take sixty milliseconds. Driving the same forty days through
 * a browser takes minutes, because every one of them animates crew tokens
 * across the map — which is the right thing for a player and the wrong thing
 * for a balance question.
 *
 * The crew here plays greedily and a little stupidly: talk to whoever you are
 * standing in front of, otherwise walk to the nearest place that is not
 * talking yet. That is deliberately worse than a person would play, so the
 * numbers below are close to a floor rather than a best case.
 *
 *   npm run balance:survey [days]
 */

import { buildWorld } from '../src/world'
import {
  SURVEY_CREW,
  contactOf,
  messageDays,
  newSurvey,
  order,
  resolveSurveyDay,
  roundTripDays,
  sendLetter,
  surveyIncome,
  surveyOptions,
  surveyUpkeep,
  type SurveyTask,
} from '../src/era0'

import { availableSurveySkits } from '../src/era0-skits'

const targetOf = (task: SurveyTask) => ('target' in task ? task.target : null)

/** Skits already offered, so each one is reported on the day it first unlocks. */
const offered = new Set<string>()

const world = buildWorld(0)
let survey = newSurvey()

function plan() {
  for (const member of SURVEY_CREW) {
    const state = survey.crew[member.id]
    if (state.daysLeft > 0 || state.hurtDays > 0) continue
    const options = surveyOptions(world, survey, member.id)

    const talk = options.find((o) => o.task.kind === 'parley')
    if (talk) {
      survey = order(survey, member.id, talk.task, talk.days)
      continue
    }
    // Once a place is in, put up what it will keep: a board always, a fire
    // wherever the hill is worth the wood — but only out of a store that can
    // stand it, because a crew that builds itself to zero is not a balance
    // reading, it is a mistake anybody would see coming.
    const build = survey.rations < 12
      ? undefined
      : options.find((o) => (o.task.kind === 'board' || o.task.kind === 'fire') && !o.blocked)
    if (build) {
      survey = order(survey, member.id, build.task, build.days)
      continue
    }
    // Nobody walks to a place somebody else is already walking to.
    const claimed = new Set(
      SURVEY_CREW.map((m) => targetOf(survey.crew[m.id].task)).filter(Boolean),
    )
    const walk = options
      .filter((o) => o.task.kind === 'walk')
      .filter((o) => !claimed.has(targetOf(o.task)))
      .filter((o) => contactOf(survey, targetOf(o.task)!) !== 'talking')
      .sort((a, b) => a.days - b.days)[0]
    if (walk) survey = order(survey, member.id, walk.task, walk.days)
  }
}

const days = Number(process.argv[2] ?? 30)
for (let day = 1; day <= days; day++) {
  plan()
  // Send the letter the first day there is any way for it to get there and
  // back. Waiting for a better road would be the smarter play; this is the
  // earliest a player could possibly try it, which is the number worth having.
  if (survey.letter.state === 'unsent' && roundTripDays(world, survey) !== null) {
    survey = sendLetter(world, survey)
  }
  survey = resolveSurveyDay(world, survey).survey

  const talking = world.settlements.filter((s) => contactOf(survey, s.id) === 'talking').length
  const net = surveyIncome(survey) - surveyUpkeep(survey)
  const message = messageDays(world, survey, 'tangerang')
  const bogor = messageDays(world, survey, 'bogor')
  console.log(
    `day ${String(day).padStart(2)}  talking ${String(talking).padStart(2)}/${world.settlements.length}` +
      `  rations ${survey.rations.toFixed(1).padStart(5)} (${net >= 0 ? '+' : ''}${net.toFixed(1)})` +
      `  signals ${survey.boards.length}b/${survey.fires.length}f` +
      `  Tangerang ${message === null ? '—' : `${message}d`}` +
      `  Bogor ${bogor === null ? '—' : `${bogor}d`}` +
      `  hold ${survey.hold}  letter ${survey.letter.state}`,
  )
  for (const skit of availableSurveySkits(survey, 'en')) {
    if (offered.has(skit.id)) continue
    offered.add(skit.id)
    console.log(`          skit unlocked: ${skit.id} — ${skit.title}`)
  }
  if (survey.wonOn !== null) {
    console.log(`\nEra 0 won on day ${survey.wonOn}.`)
    break
  }
}

const left = world.settlements.filter((s) => contactOf(survey, s.id) !== 'talking')
console.log(
  left.length === 0
    ? `\nEveryone is talking after ${days} days.`
    : `\nStill not talking: ${left.map((s) => `${s.name} (${contactOf(survey, s.id)})`).join(', ')}`,
)
