/**
 * HUD shell. Everything outside the canvas is ordinary React, which is the
 * whole point of the stack split: panels, rosters and readouts stay in DOM
 * where they are easy to write, and only the map goes through WebGL.
 *
 * The day is planned, not played out live: orders are given to each crew
 * member, the plan is confirmed, and then the night is resolved in one step
 * and reported back. Every order is given from the thing it acts on — a site,
 * a ruin, a bandit camp — rather than from a menu of verbs.
 */

import { Fragment, useMemo, useState } from 'react'
import { PixiMap } from './PixiMap'
import { useGame, reachableFrom, availableSkits } from './store'
import { SkitChip, SkitOverlay } from './Skit'
import { EraOpening } from './EraOpening'
import type { Lang } from './lang'
import { PARTY, type PartyMember } from './party'
import { useBacksound } from './useBacksound'
import { DayIcon, KIT_ICON, HardenedIcon, RaidIcon, RESOURCE_ICON } from './icons'
import { STAGE_LABEL, type BuildStage, type LinkStatus, type World } from './world'
import {
  actionsForTarget,
  buildsInProgress,
  daysRemaining,
  forecastDay,
  raidRisk,
  FOCUS_LABEL,
  FOCUS_NOTE,
  RECIPES,
  RESOURCE_ORDER,
  type Focus,
  type KitId,
  type Kits,
  type Need,
  type Stock,
  type Task,
  type TargetAction,
} from './sim'

const STATUS_LABEL: Record<LinkStatus, string> = {
  live: 'up',
  planned: 'surveyed',
  down: 'silent',
}

const MEMBER_BY_ID = new Map(PARTY.map((m) => [m.id, m]))

const RECIPE_NAME: Record<string, string> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r.name]),
)

/**
 * Five dots: unvisited, surveyed, installed, running, hardened. A site's whole
 * life story in the width of a roster row.
 *
 * Everything up to and including Running stays amber, the colour the whole HUD
 * uses for the project's own effort — a running site still needs looking after.
 * Only Hardened turns green and takes a tick: it is the one stage that means
 * the site can be left alone, which is the question the roster gets asked.
 */
const DONE: BuildStage = 4

function Progress({ stage, size = 'sm' }: { stage: BuildStage; size?: 'sm' | 'lg' }) {
  const done = stage >= DONE
  return (
    <span
      className={`progress progress--${size}${done ? ' is-hardened' : ''}`}
      title={STAGE_LABEL[stage]}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`progress__dot${i <= stage ? ' is-done' : ''}${i === stage ? ' is-current' : ''}`}
        />
      ))}
      {done && <HardenedIcon className="progress__tick" size={size === 'lg' ? 15 : 11} />}
    </span>
  )
}

function LinkRow({ label, status, detail }: { label: string; status: LinkStatus; detail: string }) {
  return (
    <li className={`link link--${status}`}>
      <span className="link__name">{label}</span>
      <span className="link__detail">{detail}</span>
      <span className="link__status">{STATUS_LABEL[status]}</span>
    </li>
  )
}

/** What a crew member is doing right now, in the words the roster uses. */
function taskText(task: Task, world: World): string {
  const nameOf = (id: string) =>
    world.settlements.find((s) => s.id === id)?.name ??
    world.scavenge.find((s) => s.id === id)?.name ??
    world.camps.find((c) => c.id === id)?.name ??
    id
  switch (task.kind) {
    case 'idle': return 'No orders'
    case 'scavenge': return `Stripping ${nameOf(task.target)}`
    case 'craft': return `Building a ${(RECIPE_NAME[task.recipe] ?? task.recipe).toLowerCase()}`
    case 'survey': return `Surveying ${nameOf(task.target)}`
    case 'install': return `Raising the mast at ${nameOf(task.target)}`
    case 'commission': return `Keying up ${nameOf(task.target)}`
    case 'harden': return `Hardening ${nameOf(task.target)}`
    case 'repair': return `Tuning ${nameOf(task.target)}`
    case 'guard': return `On watch at ${nameOf(task.target)}`
    case 'clear': return `Clearing ${nameOf(task.target)}`
  }
}

function Avatar({ member, size = 26 }: { member: PartyMember; size?: number }) {
  return (
    <img
      className="avatar"
      src={member.portrait}
      alt={member.name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  )
}

/** The resource bar. Icons, because six words in a row is a wall of text. */
function Stock() {
  const sim = useGame((s) => s.sim)
  return (
    <ul className="stock">
      {RESOURCE_ORDER.map((id) => {
        const Icon = RESOURCE_ICON[id]
        const amount = Math.floor(sim.stock[id])
        return (
          <li key={id} className={amount < 4 ? 'is-low' : ''} title={id}>
            <Icon size={16} />
            <span className="stock__count">{amount}</span>
          </li>
        )
      })}
      {(Object.keys(sim.kits) as KitId[])
        .filter((kit) => sim.kits[kit] > 0)
        .map((kit) => {
          const Icon = KIT_ICON[kit]
          return (
            <li key={kit} className="stock__kit" title={`${kit} kit ready`}>
              <Icon size={16} />
              <span className="stock__count">{sim.kits[kit]}</span>
            </li>
          )
        })}
    </ul>
  )
}

/**
 * What an order costs, in the same icons the stock strip uses: a price read as
 * shapes lines up with the wallet the player already reads at a glance, where
 * "6 steel, 3 parts" spelled out is a second sentence in the middle of a card.
 * Anything the depot cannot cover is marked, so a blocked order says why.
 */
function Needs({ needs, needsAny }: { needs?: Need[]; needsAny?: Need[] }) {
  const sim = useGame((s) => s.sim)
  if (!needs?.length && !needsAny?.length) return null

  const chip = (need: Need) => {
    const Icon = need.kind === 'resource' ? RESOURCE_ICON[need.id] : KIT_ICON[need.id]
    const held = need.kind === 'resource' ? Math.floor(sim.stock[need.id]) : sim.kits[need.id]
    const short = held < need.amount
    return (
      <li
        key={`${need.kind}-${need.id}`}
        className={`need need--${need.kind}${short ? ' is-short' : ''}`}
        title={
          need.kind === 'kit'
            ? `Needs ${need.amount} ${need.id} kit — ${held} on the shelf`
            : `Needs ${need.amount} ${need.id} — ${held} in store`
        }
      >
        <Icon size={15} />
        {/* Price over purse: what it costs is only half the question. */}
        <span className="need__count">
          {need.amount}<span className="need__held">/{held}</span>
        </span>
      </li>
    )
  }

  return (
    <ul className="needs">
      {needs?.map(chip)}
      {needsAny?.map((need, i) => (
        <Fragment key={`any-${need.id}`}>
          {i > 0 && <li className="needs__or">or</li>}
          {chip(need)}
        </Fragment>
      ))}
    </ul>
  )
}

/**
 * A stock movement, read as a line of ledger: what it was, what it becomes and
 * by how much. Used twice — once ahead of the day for what the plan is certain
 * to cost, and once behind it for what the day actually did — so a player who
 * learns to read the bill can read the receipt without learning anything new.
 */
interface LedgerRow {
  key: string
  label: string
  Icon: (props: { size?: number }) => JSX.Element
  from: number
  to: number
}

/**
 * A tenth of a unit is as fine as the strip reads, so the ledger rounds to
 * that and then takes its difference from the rounded pair — otherwise a line
 * shows 4 becoming 3.8 and calls it a loss of 0.3, and the player is right to
 * distrust every other figure on the panel.
 */
const tenth = (n: number) => Math.round(n * 10) / 10

function amount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function Ledger({ rows }: { rows: LedgerRow[] }) {
  if (rows.length === 0) return null
  return (
    <ul className="ledger">
      {rows.map((row) => {
        const from = tenth(row.from)
        const to = tenth(row.to)
        const delta = tenth(to - from)
        const up = delta > 0
        return (
          <li key={row.key} className={`ledger__row ledger__row--${up ? 'up' : 'down'}`}>
            <row.Icon size={15} />
            <span className="ledger__name">{row.label}</span>
            <span className="ledger__move">
              {amount(from)} <span className="ledger__arrow">-&gt;</span> {amount(to)}
            </span>
            <span className="ledger__delta">
              ({up ? '+' : '-'}{amount(Math.abs(delta))})
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Turn a pair of stock/kit snapshots into ledger lines, skipping what held. */
function ledgerRows(
  before: { stock: Stock; kits: Kits },
  after: { stock: Stock; kits: Kits },
): LedgerRow[] {
  const rows: LedgerRow[] = []
  for (const id of RESOURCE_ORDER) {
    // A payout of a hundredth of a ration is arithmetic, not a movement, and a
    // line that reads 20 -> 20 is worse than no line at all.
    if (tenth(before.stock[id]) === tenth(after.stock[id])) continue
    rows.push({
      key: `r-${id}`, label: id, Icon: RESOURCE_ICON[id],
      from: before.stock[id], to: after.stock[id],
    })
  }
  for (const id of Object.keys(before.kits) as KitId[]) {
    if (after.kits[id] === before.kits[id]) continue
    rows.push({
      key: `k-${id}`, label: `${id} kit`, Icon: KIT_ICON[id],
      from: before.kits[id], to: after.kits[id],
    })
  }
  return rows
}

/**
 * The orders available at one place, each with the crew who could take it.
 *
 * Picking the person is the whole decision — there are four of them and the
 * day is one day long — so the crew are the buttons.
 */
function Actions({ targetId }: { targetId: string }) {
  const world = useGame((s) => s.world)
  const sim = useGame((s) => s.sim)
  const order = useGame((s) => s.order)
  const standDown = useGame((s) => s.standDown)
  const actions = actionsForTarget(world, sim, targetId)

  if (actions.length === 0) {
    return <p className="note note--empty">Nothing to be done here today.</p>
  }

  const groups = actions.reduce<Record<string, TargetAction[]>>((acc, action) => {
    ;(acc[action.group] ??= []).push(action)
    return acc
  }, {})

  return (
    <div className="actions">
      {Object.entries(groups).map(([group, list]) => (
        <section key={group} className="actions__group">
          <h4>{group}</h4>
          {list.map((action) => (
            <div key={action.label} className={`action${action.blocked ? ' is-blocked' : ''}`}>
              <span className="action__label">{action.label}</span>
              <Needs needs={action.needs} needsAny={action.needsAny} />
              {action.hint && <span className="action__hint">{action.hint}</span>}
              {action.blocked && <span className="action__blocked">{action.blocked}</span>}
              <div className="action__crew">
                {action.candidates.map((candidate) => {
                  const member = MEMBER_BY_ID.get(candidate.memberId)!
                  const disabled = Boolean(action.blocked) || (candidate.busy && !candidate.assigned)
                  return (
                    <button
                      key={candidate.memberId}
                      type="button"
                      className={`crew-pick${candidate.assigned ? ' is-assigned' : ''}`}
                      disabled={disabled}
                      title={
                        candidate.assigned
                          ? `${member.name} is on this — click to stand down`
                          : candidate.busy
                            ? `${member.name} is busy`
                            : `${member.name} · ${candidate.days} day${candidate.days === 1 ? '' : 's'}`
                      }
                      onClick={() =>
                        candidate.assigned
                          ? standDown(candidate.memberId)
                          : order(candidate.memberId, action.task, candidate.days)
                      }
                    >
                      <Avatar member={member} size={24} />
                      <span className="crew-pick__days">{candidate.days}d</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

/** The plan, read back before it is committed. */
function ConfirmDialog({ onCancel, onExecute }: { onCancel: () => void; onExecute: () => void }) {
  const world = useGame((s) => s.world)
  const sim = useGame((s) => s.sim)
  const idle = PARTY.filter((m) => sim.crew[m.id].task.kind === 'idle' && sim.crew[m.id].hurtDays === 0)
  const builds = buildsInProgress(world, sim)
  const bill = forecastDay(world, sim)
  const rows = ledgerRows(
    { stock: sim.stock, kits: sim.kits },
    {
      stock: Object.fromEntries(
        RESOURCE_ORDER.map((r) => [r, sim.stock[r] + (bill.stock[r] ?? 0)]),
      ) as Stock,
      kits: Object.fromEntries(
        (Object.keys(sim.kits) as KitId[]).map((k) => [k, sim.kits[k] + (bill.kits[k] ?? 0)]),
      ) as Kits,
    },
  )

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>Execute day {sim.day}?</h2>
        <ul className="plan">
          {PARTY.map((member) => {
            const state = sim.crew[member.id]
            const hurt = state.hurtDays > 0
            const left = daysRemaining(sim, member.id)
            return (
              <li key={member.id} className={hurt ? 'is-hurt' : ''}>
                <Avatar member={member} size={30} />
                <span className="plan__name">{member.name}</span>
                <span className="plan__task">
                  {hurt ? `Laid up — ${state.hurtDays} more day${state.hurtDays === 1 ? '' : 's'}` : taskText(state.task, world)}
                </span>
                <span className="plan__days">
                  {/* A watch is a standing post, not a job with an end date. */}
                  {left === null
                    ? ''
                    : state.task.kind === 'guard'
                      ? 'standing'
                      : left === 0
                        ? 'lands tonight'
                        : `${left}d left`}
                </span>
              </li>
            )
          })}
        </ul>
        {builds.length > 0 && (
          <div className="building">
            <h3>Under construction</h3>
            <ul className="building__list">
              {builds.map((build) => {
                const Icon = build.kit ? KIT_ICON[build.kit] : DayIcon
                return (
                  <li key={build.memberId}>
                    <Icon size={15} />
                    <span className="building__what">{build.what}</span>
                    <span className="building__days">
                      {build.daysLeft === 0
                        ? 'lands tonight'
                        : `${build.daysLeft} day${build.daysLeft === 1 ? '' : 's'} left`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {rows.length > 0 && (
          <div className="building">
            <h3>Tonight's bill</h3>
            <Ledger rows={rows} />
            <p className="ledger__caveat">
              Materials and upkeep only. What a haul brings back, what the broadcast pays and
              what the night takes are not in this figure.
            </p>
          </div>
        )}
        <p className="plan__focus">
          Dusk broadcast: <strong>{FOCUS_LABEL[sim.focus]}</strong>. {FOCUS_NOTE[sim.focus]}
        </p>
        {idle.length > 0 && (
          <p className="plan__warning">
            {idle.length === 1
              ? `${idle[0].name} has`
              : `${idle.slice(0, -1).map((m) => m.name).join(', ')} and ${idle[idle.length - 1].name} have`}{' '}
            no orders and will spend the day at the depot.
          </p>
        )}
        <div className="modal__buttons">
          <button type="button" className="button" onClick={onCancel}>
            Keep planning
          </button>
          <button type="button" className="button button--primary" onClick={onExecute}>
            Execute day {sim.day}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Last night, once it has happened. */
function ReportDialog() {
  const report = useGame((s) => s.report)
  const dismiss = useGame((s) => s.dismissReport)
  const world = useGame((s) => s.world)
  const sim = useGame((s) => s.sim)
  const select = useGame((s) => s.select)
  if (!report) return null

  const raided = world.settlements.filter((s) => s.alert)
  const rows = report.before ? ledgerRows(report.before, { stock: sim.stock, kits: sim.kits }) : []

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal modal--report" onClick={(event) => event.stopPropagation()}>
        <h2>Day {report.day}</h2>
        <ul className="report">
          {report.log.length === 0 && <li className="report__quiet">A quiet day, and a quieter night.</li>}
          {report.log.map((entry, i) => (
            <li key={i} className={`report__line report__line--${entry.kind}`}>
              {entry.text}
            </li>
          ))}
        </ul>
        {rows.length > 0 && (
          <div className="building">
            <h3>The depot, after</h3>
            <Ledger rows={rows} />
          </div>
        )}
        {raided.length > 0 && (
          <div className="report__incidents">
            <h3>Needs someone</h3>
            {raided.map((s) => (
              <button
                key={s.id}
                type="button"
                className="incident"
                onClick={() => {
                  select(s.id)
                  dismiss()
                }}
              >
                <RaidIcon size={16} />
                <span className="incident__name">{s.name}</span>
                <span className="incident__detail">{s.alert!.detail}</span>
              </button>
            ))}
          </div>
        )}
        {sim.actComplete && <p className="report__act">Act 1 complete.</p>}
        <div className="modal__buttons">
          <button type="button" className="button button--primary" onClick={dismiss}>
            Plan day {sim.day}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const world = useGame((s) => s.world)
  const sim = useGame((s) => s.sim)
  const endDay = useGame((s) => s.endDay)
  const playing = useGame((s) => s.playing)
  const setFocus = useGame((s) => s.setFocus)
  const selectedId = useGame((s) => s.selectedId)
  const hovered = useGame((s) => s.hovered)
  const select = useGame((s) => s.select)
  const standDown = useGame((s) => s.standDown)
  const sound = useBacksound()
  const [confirming, setConfirming] = useState(false)

  const selectedScavengeId = useGame((s) => s.selectedScavengeId)
  const selectScavenge = useGame((s) => s.selectScavenge)
  const selectedCampId = useGame((s) => s.selectedCampId)
  const selectCamp = useGame((s) => s.selectCamp)
  const scavenge = world.scavenge.find((s) => s.id === selectedScavengeId) ?? null
  const camp = world.camps.find((c) => c.id === selectedCampId) ?? null

  const reachable = useMemo(() => reachableFrom(world, 'batavia'), [world])
  const skits = useMemo(() => availableSkits(world, sim), [world, sim])
  const selected = world.settlements.find((s) => s.id === selectedId) ?? null
  const byId = useMemo(() => new Map(world.settlements.map((s) => [s.id, s])), [world])
  const alerting = world.settlements.filter((s) => s.alert)

  const selectedLinks = selected
    ? world.links.filter((l) => l.from === selected.id || l.to === selected.id)
    : []
  const risk = selected
    ? raidRisk(world, sim, selected)
    : { level: 'none' as const, guarded: false, threat: 0 }

  const hoveredTile = hovered ? world.at(hovered.tx, hovered.ty) : undefined
  const liveCount = world.links.filter((l) => l.status === 'live').length

  /** Who is standing where, so a site can say who is on it. */
  const postedAt = (siteId: string) =>
    PARTY.filter((m) => sim.crew[m.id].at === siteId && sim.crew[m.id].daysLeft <= 0)

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
            <p>Era 1 — AM Radio · Jakarta region</p>
          </div>
        </div>
        <dl className="stats">
          <div><dt><DayIcon size={12} /> Day</dt><dd>{sim.day}</dd></div>
          <div><dt>Nodes on air</dt><dd>{reachable.size}/{world.settlements.length}</dd></div>
          <div><dt>Circuits up</dt><dd>{liveCount}/{world.links.length}</dd></div>
        </dl>
        <SkitChip skits={skits} />
        <Stock />
      </header>

      {alerting.map((s) => (
        <button
          key={s.id}
          type="button"
          className="alert-banner"
          onClick={() => select(s.id)}
        >
          <span className="alert-banner__flash" aria-hidden />
          <span className="alert-banner__text">{s.alert!.message}</span>
          <span className="alert-banner__where">{s.name}</span>
        </button>
      ))}

      <aside className="hud hud--left">
        <h2>Network roster</h2>
        <ul className="roster">
          {world.settlements.map((s) => {
            const on = reachable.has(s.id)
            const here = postedAt(s.id)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={[
                    'roster__item',
                    on ? 'is-live' : 'is-dark',
                    s.alert ? 'is-alert' : '',
                    s.id === selectedId ? 'is-selected' : '',
                  ].join(' ')}
                  onClick={() => select(s.id)}
                >
                  <span className="dot" aria-hidden />
                  <span className="roster__name">{s.name}</span>
                  <span className="roster__crew">
                    {here.map((m) => <Avatar key={m.id} member={m} size={17} />)}
                  </span>
                  <Progress stage={s.stage} />
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {selected && (
        <aside className={`hud hud--right${selected.alert ? ' is-alert' : ''}`}>
          <h2>{selected.name}</h2>
          <p className="tier">{selected.tier} · {selected.mast} m mast</p>
          <div className="stage">
            <Progress stage={selected.stage} size="lg" />
            <span className="stage__label">{STAGE_LABEL[selected.stage]}</span>
          </div>
          {selected.alert && (
            <p className="alert-detail">
              <strong>{selected.alert.message}</strong>
              {selected.alert.detail}
              {selected.alert.kind === 'raid-in-progress' && (
                <em className="alert-detail__how">
                  {risk.guarded
                    ? 'A watch is posted. They will find somebody standing in the yard tonight.'
                    : 'Post a watch here before you execute the day, or they take it tonight.'}
                </em>
              )}
            </p>
          )}
          <p className="note">{selected.note}</p>
          <dl className="detail">
            <div><dt>Population</dt><dd>{selected.population.toLocaleString('en-US')}</dd></div>
            <div><dt>Power</dt><dd>{selected.cold ? `${selected.power} — cold` : selected.power}</dd></div>
            <div><dt>Operator</dt><dd>{selected.operator ? 'posted' : 'none'}</dd></div>
            <div><dt>Wear</dt><dd>{Math.round(selected.wear)}%</dd></div>
            <div>
              <dt>Raid risk</dt>
              <dd className={`risk risk--${risk.level}`}>
                {risk.level === 'none' ? 'nothing to take' : risk.level}
                {risk.guarded ? ' · watch posted' : ''}
              </dd>
            </div>
            <div><dt>On air</dt><dd>{reachable.has(selected.id) ? 'yes' : 'no — isolated'}</dd></div>
          </dl>

          {postedAt(selected.id).length > 0 && (
            <div className="here">
              <h3>On site</h3>
              <ul className="here__list">
                {postedAt(selected.id).map((m) => (
                  <li key={m.id}>
                    <Avatar member={m} size={22} />
                    <span>{m.name}</span>
                    <span className="here__task">{taskText(sim.crew[m.id].task, world)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3>Orders</h3>
          <Actions targetId={selected.id} />

          <h3>Circuits</h3>
          <ul className="links">
            {selectedLinks.length === 0 && <li className="link link--none">No circuits surveyed.</li>}
            {selectedLinks.map((l) => {
              const otherId = l.from === selected.id ? l.to : l.from
              return (
                <LinkRow
                  key={`${l.from}-${l.to}`}
                  label={byId.get(otherId)?.name ?? otherId}
                  status={l.status}
                  detail={l.status === 'live' ? `${l.bandwidth} · ${l.latencyMs} ms` : '—'}
                />
              )
            })}
          </ul>
        </aside>
      )}

      {scavenge && (
        <aside className="hud hud--right hud--salvage">
          <button type="button" className="panel-close" onClick={() => selectScavenge(null)}>
            close
          </button>
          <h2>{scavenge.name}</h2>
          <p className="tier tier--salvage">{scavenge.kind} · {scavenge.state}</p>
          <p className="note">{scavenge.note}</p>
          <dl className="detail">
            <div>
              <dt>Risk</dt>
              <dd>{'●'.repeat(scavenge.risk)}{'○'.repeat(3 - scavenge.risk)}</dd>
            </div>
            <div><dt>Hauls taken</dt><dd>{scavenge.hauls}</dd></div>
          </dl>
          <h3>Still recoverable</h3>
          {scavenge.yields.length === 0 || scavenge.hauls >= 4 ? (
            <p className="note note--empty">Nothing left worth the trip.</p>
          ) : (
            <ul className="yields">
              {scavenge.yields.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <h3>Orders</h3>
          <Actions targetId={scavenge.id} />
        </aside>
      )}

      {camp && (
        <aside className="hud hud--right hud--camp">
          <button type="button" className="panel-close" onClick={() => selectCamp(null)}>
            close
          </button>
          <h2><RaidIcon size={18} /> {camp.name}</h2>
          <p className="tier tier--camp">
            {camp.active ? 'Occupied' : `Cleared — back around day ${camp.returnsOn ?? '?'}`}
          </p>
          <p className="note">
            Scrap raiders working outward from here. Anything with a generator within 15 km is
            worth their walk, and they are not wrong about that.
          </p>
          <h3>Orders</h3>
          <Actions targetId={camp.id} />
        </aside>
      )}

      <footer className="hud hud--bottom">
        <ul className="party">
          {PARTY.map((member) => {
            const state = sim.crew[member.id]
            const posted = byId.get(state.at) ?? null
            const hurt = state.hurtDays > 0
            const working = state.daysLeft > 0
            const alerting = Boolean(posted?.alert)
            return (
              <li key={member.id} className="party__member">
                <img className="party__portrait" src={member.portrait} alt={member.name} />
                <div className="party__text">
                  <span className="party__name">{member.name}</span>
                  <span className="party__class">
                    <img className="party__logo" src={member.logo} alt="" width={16} height={16} />
                    {member.className}
                  </span>
                  <span
                    className={[
                      'party__status',
                      working ? 'is-moving' : '',
                      hurt ? 'is-hurt' : '',
                      alerting ? 'is-alert' : '',
                    ].join(' ')}
                  >
                    <span className="party__pip" aria-hidden />
                    <span className="party__state">
                      {hurt ? 'laid up' : working ? `${state.daysLeft}d left` : 'ready'}
                    </span>
                    <span className="party__where">
                      {hurt ? `Back in ${state.hurtDays} days` : taskText(state.task, world)}
                      {state.task.kind === 'idle' && !hurt ? ` · at ${posted?.name ?? 'unknown'}` : ''}
                    </span>
                  </span>
                </div>
                {state.task.kind !== 'idle' && !hurt && (
                  <button
                    type="button"
                    className="party__cancel"
                    title="Cancel these orders"
                    onClick={() => standDown(member.id)}
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <div className="readout">
          <label className="focus">
            <span className="focus__label">Dusk broadcast</span>
            <select
              value={sim.focus}
              onChange={(event) => setFocus(event.target.value as Focus)}
              title={FOCUS_NOTE[sim.focus]}
            >
              {(Object.keys(FOCUS_LABEL) as Focus[]).map((id) => (
                <option key={id} value={id}>{FOCUS_LABEL[id]}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button--primary end-day"
            disabled={Boolean(playing)}
            onClick={() => setConfirming(true)}
          >
            {playing ? 'Out on the road…' : `Execute day ${sim.day}`}
          </button>
          <button
            type="button"
            className={`sound${sound.wanted ? ' is-on' : ''}`}
            onClick={sound.toggle}
            aria-pressed={sound.wanted}
            title={sound.wanted ? 'Mute the backing track' : 'Play the backing track'}
          >
            <span className="sound__bars" aria-hidden>
              <i /><i /><i />
            </span>
            {sound.wanted ? (sound.playing ? 'sound on' : 'tap to start') : 'sound off'}
          </button>
          <span className="probe">
            {hoveredTile
              ? `tile ${hoveredTile.tx},${hoveredTile.ty} · ${hoveredTile.terrain} · elev ${hoveredTile.elev.toFixed(1)}`
              : 'drag to pan · scroll to zoom · click a mast'}
          </span>
        </div>
      </footer>

      {confirming && (
        <ConfirmDialog
          onCancel={() => setConfirming(false)}
          onExecute={() => {
            setConfirming(false)
            endDay()
          }}
        />
      )}
      <ReportDialog />
      <SkitOverlay />
      <EraOpening era={1} lang={lang} />
    </div>
  )
}
