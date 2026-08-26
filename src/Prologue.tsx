/**
 * Era 0 — The Survey.
 *
 * The same ground as Era 1 with none of it built, and three people instead of
 * four: Pak Min is not recruited until the end of this era, which is the point
 * of it. The rules are in `era0.ts`; this is the panel work.
 *
 * The screen is arranged around the one number that matters here — how many
 * days a message takes to cross the region — because everything the player
 * does is an attempt to bring that number down, and there is no hardware to
 * show instead.
 */

import { useMemo, useState } from 'react'
import { PixiMap } from './PixiMap'
import { useGame } from './store'
import { DayIcon, RESOURCE_ICON } from './icons'
import { Dialogue } from './Dialogue'
import { SkitChip, SkitOverlay } from './Skit'
import { availableSurveySkits } from './era0-skits'
import { castOf } from './story'
import { chaptersIn, type Lang } from './lang'
import {
  CONTACT_LABEL,
  CONTACT_NOTE,
  SURVEY_CREW,
  contactOf,
  daysLeftAfterToday,
  fireLinks,
  fireReach,
  fireSite,
  GOAL,
  hasBoard,
  hasFire,
  HOLD_DAYS,
  HOLD_TALKING,
  messageDays,
  RELAY_WAIT,
  roundTripDays,
  surveyIncome,
  surveyOptions,
  surveyUpkeep,
  type Contact,
  type SurveyTask,
} from './era0'

const Rations = RESOURCE_ICON.rations

const CONTACT_CLASS: Record<Contact, string> = {
  unknown: 'is-dark',
  found: 'is-found',
  wary: 'is-wary',
  talking: 'is-live',
}

function ReportDialog() {
  const report = useGame((s) => s.report)
  const dismiss = useGame((s) => s.dismissReport)
  const survey = useGame((s) => s.survey)
  if (!report) return null

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal modal--report" onClick={(event) => event.stopPropagation()}>
        <h2>Day {report.day}</h2>
        <ul className="report">
          {report.log.length === 0 && <li className="report__quiet">Nobody went anywhere.</li>}
          {report.log.map((entry, i) => (
            <li key={i} className={`report__line report__line--${entry.kind}`}>
              {entry.text}
            </li>
          ))}
        </ul>
        <div className="modal__buttons">
          <button type="button" className="button button--primary" onClick={dismiss}>
            Plan day {survey.day}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Prologue({ lang, onExit, onFinish }: { lang: Lang; onExit: () => void; onFinish: () => void }) {
  const world = useGame((s) => s.world)
  const survey = useGame((s) => s.survey)
  const hovered = useGame((s) => s.hovered)
  const selectedId = useGame((s) => s.selectedId)
  const select = useGame((s) => s.select)
  const orderWalk = useGame((s) => s.orderWalk)
  const sendLetter = useGame((s) => s.sendLetter)
  const endDay = useGame((s) => s.endDay)
  const playing = useGame((s) => s.playing)
  const report = useGame((s) => s.report)
  const skit = useGame((s) => s.skit)
  const [showOrders, setShowOrders] = useState<string | null>(null)
  const [endLine, setEndLine] = useState(0)

  const hoveredTile = hovered ? world.at(hovered.tx, hovered.ty) : undefined
  const selected = world.settlements.find((s) => s.id === selectedId) ?? null

  const talking = world.settlements.filter((s) => contactOf(survey, s.id) === 'talking').length
  const toGoal = useMemo(() => messageDays(world, survey, GOAL), [world, survey])
  const lit = useMemo(() => fireLinks(world, survey), [world, survey])
  const roundTrip = useMemo(() => roundTripDays(world, survey), [world, survey])
  const goalName = () => byId.get(GOAL)?.name ?? GOAL
  const ending = useMemo(() => chaptersIn(lang)[0].closing, [lang])
  const skits = useMemo(() => availableSurveySkits(survey, lang), [survey, lang])
  const income = surveyIncome(survey)
  const upkeep = surveyUpkeep(survey)

  const byId = useMemo(() => new Map(world.settlements.map((s) => [s.id, s])), [world])

  /**
   * Everything anybody could be told to do about the selected place today,
   * gathered by the order rather than by the person — which is how Era 1's
   * panel reads, and the two screens should not disagree about that.
   */
  const ordersHere = useMemo(() => {
    if (!selected) return []
    const groups = new Map<string, { label: string; picks: Array<{ member: (typeof SURVEY_CREW)[number]; task: SurveyTask; days: number; blocked?: string }> }>()
    for (const member of SURVEY_CREW) {
      for (const option of surveyOptions(world, survey, member.id)) {
        if (!('target' in option.task) || option.task.target !== selected.id) continue
        const group = groups.get(option.task.kind) ?? { label: option.label, picks: [] }
        group.label = option.label
        group.picks.push({ member, task: option.task, days: option.days, blocked: option.blocked })
        groups.set(option.task.kind, group)
      }
    }
    // Fixed order, so the panel does not reshuffle as the crew moves around.
    return (['parley', 'board', 'fire', 'walk'] as const)
      .map((kind) => groups.get(kind))
      .filter((group): group is NonNullable<typeof group> => Boolean(group))
  }, [world, survey, selected])

  return (
    <div className="app">
      <PixiMap />

      <header className="hud hud--top">
        <div className="title">
          <button type="button" className="title__back" onClick={onExit} title="Back to the main menu">
            ←
          </button>
          <div>
            <h1>New Batavia<span>: Reconnect</span></h1>
            <p>Era 0 — The Survey · 2030</p>
          </div>
        </div>
        <dl className="stats">
          <div><dt><DayIcon size={12} /> Day</dt><dd>{survey.day}</dd></div>
          <div><dt>Talking</dt><dd>{talking}/{world.settlements.length}</dd></div>
          <div>
            <dt>Message to {byId.get(GOAL)?.name ?? GOAL}</dt>
            <dd>{toGoal === null ? 'no route' : `${toGoal}d`}</dd>
          </div>
          <div title={`${HOLD_TALKING} settlements talking, ${HOLD_DAYS} days running`}>
            <dt>Hold</dt>
            <dd className={survey.hold > 0 ? 'is-good' : undefined}>
              {survey.hold}/{HOLD_DAYS}
            </dd>
          </div>
          <div title="Notice boards standing, fires laid, and pairs of fires that can answer each other">
            <dt>Signals</dt>
            <dd>
              {survey.boards.length}b · {survey.fires.length}f
              {lit.length > 0 && <em> {lit.length} linked</em>}
            </dd>
          </div>
        </dl>
        <SkitChip skits={skits} label={lang === 'id' ? 'Obrolan' : 'Skit'} />
        <div className="stock">
          <span className="stock__item" title={`${income.toFixed(1)} in, ${upkeep.toFixed(1)} out each day`}>
            <Rations size={14} />
            {Math.round(survey.rations)}
            <em className={income - upkeep < 0 ? 'is-bad' : 'is-good'}>
              {income - upkeep >= 0 ? '+' : ''}{(income - upkeep).toFixed(1)}
            </em>
          </span>
        </div>
      </header>

      <aside className="hud hud--left">
        <h2>The region</h2>
        <ul className="roster">
          {world.settlements.map((s) => {
            const contact = contactOf(survey, s.id)
            const here = SURVEY_CREW.filter(
              (m) => survey.crew[m.id].at === s.id && survey.crew[m.id].daysLeft <= 0,
            )
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={[
                    'roster__item',
                    CONTACT_CLASS[contact],
                    s.id === selectedId ? 'is-selected' : '',
                  ].join(' ')}
                  onClick={() => select(s.id)}
                >
                  <span className="dot" aria-hidden />
                  <span className="roster__name">{s.name}</span>
                  <span className="roster__crew">
                    {here.map((m) => (
                      <img key={m.id} className="avatar" src={m.portrait} alt={m.name} width={17} height={17} />
                    ))}
                  </span>
                  <span className="roster__state">{CONTACT_LABEL[contact]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {selected && (
        <aside className="hud hud--right">
          <h2>{selected.name}</h2>
          <p className="tier">
            {selected.tier} · {selected.population.toLocaleString('en-US')} people
          </p>
          <p className="note">{selected.note}</p>
          <p className="prologue__unknown">{CONTACT_NOTE[contactOf(survey, selected.id)]}</p>

          <h3>Signals</h3>
          <ul className="signals">
            <li className={hasBoard(survey, selected.id) ? 'is-on' : ''}>
              <span className="signals__what">Notice board</span>
              <span className="signals__state">
                {hasBoard(survey, selected.id)
                  ? 'on the gate — nothing waits here'
                  : `none — a message waits ${RELAY_WAIT} days here for a runner`}
              </span>
            </li>
            <li className={hasFire(survey, selected.id) ? 'is-on' : ''}>
              <span className="signals__what">
                Signal fire<em> · hill {Math.round(fireSite(world, selected).metres)} m</em>
              </span>
              <span className="signals__state">
                {(() => {
                  const canSee = fireReach(world, selected.id)
                  if (canSee.length === 0) return 'the high ground here sees nothing'
                  const answering = canSee.filter((s) => hasFire(survey, s.id))
                  if (!hasFire(survey, selected.id)) {
                    return `not laid — would watch ${canSee.map((s) => s.name).join(', ')}`
                  }
                  return answering.length > 0
                    ? `lit, answered by ${answering.map((s) => s.name).join(', ')}`
                    : `lit — waiting on ${canSee.map((s) => s.name).join(', ')}`
                })()}
              </span>
            </li>
          </ul>

          <h3>Orders</h3>
          <div className="actions">
            {ordersHere.length === 0 && (
              <p className="note note--empty">Nothing to be done here today.</p>
            )}
            {ordersHere.map((group) => (
              <section key={group.label} className="actions__group">
                <div className="action">
                  <span className="action__label">{group.label}</span>
                  <div className="action__crew">
                    {group.picks.map(({ member, task, days, blocked }) => {
                      const state = survey.crew[member.id]
                      const busy = state.daysLeft > 0 || state.hurtDays > 0
                      const assigned =
                        state.task.kind === task.kind &&
                        'target' in state.task &&
                        'target' in task &&
                        state.task.target === task.target
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={`crew-pick${assigned ? ' is-assigned' : ''}`}
                          disabled={Boolean(playing) || Boolean(blocked) || (busy && !assigned)}
                          title={
                            blocked
                              ? blocked
                              : assigned
                                ? `${member.name} is on this — click to stand down`
                                : busy
                                  ? `${member.name} is already out`
                                  : `${member.name} · ${days} day${days === 1 ? '' : 's'}`
                          }
                          onClick={() =>
                            assigned
                              ? orderWalk(member.id, { kind: 'idle' }, 0)
                              : orderWalk(member.id, task, days)
                          }
                        >
                          <img className="avatar" src={member.portrait} alt="" width={24} height={24} />
                          <span className="crew-pick__days">{days}d</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {group.picks[0]?.blocked && group.picks.every((p) => p.blocked) && (
                  <p className="note note--empty">{group.picks[0].blocked}</p>
                )}
              </section>
            ))}
          </div>
        </aside>
      )}

      <footer className="hud hud--bottom">
        <ul className="party">
          {SURVEY_CREW.map((member) => {
            const state = survey.crew[member.id]
            const posted = byId.get(state.at) ?? null
            const left = daysLeftAfterToday(survey, member.id)
            const working = state.daysLeft > 0
            const task = state.task
            return (
              <li key={member.id} className="party__member">
                <img className="party__portrait" src={member.portrait} alt={member.name} />
                <div className="party__text">
                  <span className="party__name">{member.name}</span>
                  <span className="party__class">
                    <img className="party__logo" src={member.logo} alt="" width={16} height={16} />
                    {member.className}
                  </span>
                  <span className={`party__status${working ? ' is-moving' : ''}`}>
                    <span className="party__pip" aria-hidden />
                    <span className="party__state">{working ? `${left}d left` : 'ready'}</span>
                    <span className="party__where">
                      {task.kind === 'walk'
                        ? `walking to ${byId.get(task.target)?.name ?? task.target}`
                        : task.kind === 'parley'
                          ? `talking to ${byId.get(task.target)?.name ?? task.target}`
                          : task.kind === 'board'
                            ? `building a board at ${byId.get(task.target)?.name ?? task.target}`
                            : task.kind === 'fire'
                              ? `laying a fire above ${byId.get(task.target)?.name ?? task.target}`
                              : task.kind === 'forage'
                                ? 'foraging'
                                : `at ${posted?.name ?? 'unknown'}`}
                    </span>
                  </span>
                </div>
                {working ? (
                  <button
                    type="button"
                    className="party__cancel"
                    title="Cancel these orders"
                    onClick={() => orderWalk(member.id, { kind: 'idle' }, 0)}
                  >
                    ×
                  </button>
                ) : (
                  <button
                    type="button"
                    className="party__forage"
                    title="Spend the day looking for food"
                    onClick={() => orderWalk(member.id, { kind: 'forage' }, 1)}
                    onFocus={() => setShowOrders(member.id)}
                    onBlur={() => setShowOrders(null)}
                  >
                    forage
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="readout">
          <div className="letter">
            {survey.letter.state === 'unsent' && (
              <>
                <button
                  type="button"
                  className="button letter__send"
                  disabled={roundTrip === null || Boolean(playing)}
                  onClick={sendLetter}
                >
                  Send word to {goalName()}
                </button>
                <span className="letter__note">
                  {roundTrip === null
                    ? `No road of talking villages reaches ${goalName()} yet.`
                    : `${roundTrip} days there and back, as the region stands tonight.`}
                </span>
              </>
            )}
            {survey.letter.state === 'out' && (
              <span className="letter__note is-live">
                The letter is on the road. {goalName()} in {Math.max(0, survey.letter.due - survey.day + 1)} days.
              </span>
            )}
            {survey.letter.state === 'back' && (
              <span className="letter__note is-live">
                {goalName()} has it. The answer is {Math.max(0, survey.letter.due - survey.day + 1)} days out.
              </span>
            )}
            {survey.letter.state === 'home' && (
              <span className="letter__note is-good">
                The answer came back on day {survey.letter.on}.
              </span>
            )}
          </div>
          <button
            type="button"
            className="button button--primary end-day"
            disabled={Boolean(playing)}
            onClick={endDay}
          >
            {playing ? 'On the road…' : `End day ${survey.day}`}
          </button>
          <span className="probe">
            {showOrders
              ? 'A day spent on food is a day not spent walking.'
              : hoveredTile
                ? `tile ${hoveredTile.tx},${hoveredTile.ty} · ${hoveredTile.terrain}`
                : 'click a settlement, then send somebody'}
          </span>
        </div>
      </footer>

      <ReportDialog />
      <SkitOverlay />

      {/*
        The era's ending is the story's own Era 0 closing, played over the map
        the crew just walked. It is the same text story mode shows, because it
        is the same scene — the only difference is that here it was earned.
      */}
      {survey.wonOn !== null && !report && !playing && !skit && (
        <Dialogue
          cast={castOf(ending)}
          lines={ending}
          index={endLine}
          label={`Era 0 · ${chaptersIn(lang)[0].title}`}
          onAdvance={() => (endLine + 1 < ending.length ? setEndLine(endLine + 1) : onFinish())}
          onClose={onFinish}
          endLabel="Era 1 — The First Voice"
          closeLabel="skip"
        />
      )}
    </div>
  )
}
