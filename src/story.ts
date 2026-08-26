/**
 * Story mode: the whole arc, era by era, with no gameplay under it.
 *
 * Every chapter is in three parts, in the order a played era would run them:
 * an opening that states the era's problem and starts the work, a card saying
 * what the work actually is, and a closing that counts what it cost. The
 * middle card is where the era's gameplay goes once it exists; here it is one
 * line of text, so the script still reads at the pace the game will play at.
 *
 * This is the MVP script — complete in shape and playable start to finish, but
 * still expected to be revised as each era is built. What every chapter has to
 * land is in `spec.txt`.
 *
 * The through-line across all eight is two sentences pulling against each
 * other:
 *
 *     People die. Ideas do not.
 *
 *     But an idea nobody can build is only a story, and closing the distance
 *     between the two takes a lifetime.
 *
 * Era 0 states the first. Era 5 kills Pak Min to state the second. Era 7 is
 * what closing that distance actually cost.
 *
 * The prose is deliberately plain. Readers learning English should get every
 * beat on one pass: short sentences, ordinary words, no idioms left to guess
 * at. What is implied stays implied — plain is not the same as literal, and
 * none of these people say the thing they mean outright.
 *
 * Running underneath that is the argument about the war itself, which the
 * narration picks up three times and never in the same mood: 2027 as a war
 * that changed (Era 0), copper theft as a war that changed back (Era 2), and
 * the published standard as the only defence that ever held (Era 7).
 */

import { castById } from './cast'

export interface StoryLine {
  /** A cast id, or `narrator` for the game's own voice. */
  who: string
  text: string
}

/** Everyone with a portrait who speaks in these lines, in order of first line. */
export function castOf(lines: StoryLine[]): string[] {
  const seen: string[] = []
  for (const line of lines) {
    if (line.who !== 'narrator' && !seen.includes(line.who) && castById(line.who)) seen.push(line.who)
  }
  return seen
}

export interface Chapter {
  era: number
  year: number
  title: string
  /** One line under the title card, setting the era's problem. */
  premise: string
  /** Before the work. */
  opening: StoryLine[]
  /** What the era is, on the card between the halves. */
  interlude: string
  /** After it. */
  closing: StoryLine[]
}

const n = (text: string): StoryLine => ({ who: 'narrator', text })
const say = (who: string, text: string): StoryLine => ({ who, text })

export const CHAPTERS: Chapter[] = [
  {
    era: 0,
    year: 2030,
    title: 'Humanity Rebuilds',
    premise: '40 villages, and none of them can hear each other.',
    interlude:
      'Prologue. Walk the region on foot, find out who is still alive, and count what is left in the store.',
    opening: [
      n('War never changes.'),
      n('People used to say that. They said it the way you say a prayer — to feel better, not because it was true.'),
      n('In 2027 it stopped being true.'),
      n('That war did not want land. No army marched. No flag came down and no flag went up.'),
      n('It attacked the satellites first. Then the sea cables. Then the exchanges, the refineries, the ports, the power grid.'),
      n('It lasted 11 weeks. Fewer than 200,000 people died. For a war, that is a small number.'),
      n('Then it stopped, because there was nothing left that was worth attacking.'),
      n('The real dying started afterwards.'),
      n('Not from bombs. A truck had no fuel, so the rice never arrived, so a town went hungry. The same town had no water, because a power station 400 kilometres away needed one small part, and the factory that made that part no longer existed.'),
      n('The fighting ended after 18 months. The collapse took 6 more years. Nobody can say which day it finished.'),
      n('So war did change. It became clean, and exact, and short. And it killed more people than any war ever fought with rifles.'),
      n('What a war does to a person did not change at all. You walk. You bury your dead. You count the rice.'),
      n('It is 2030.'),
      say('bayu', 'Jakarta is not a city any more. It is 40 villages, and none of them can hear each other.'),
      say('mel', '38 villages. Cikarang went silent in March, and I stopped counting after that.'),
      say('bayu', 'Then you understand the problem.'),
      say('mel', 'I understand that you are reading a map. I am reading the store list. They are different jobs.'),
      say('bayu', 'I want to bring communication back. Not the world we lost — one message that can cross this region in a day, and an answer coming back.'),
      say('tajuddin', 'How far is Bogor?'),
      say('bayu', '2 days of walking. It used to take 8 seconds to call them. We have already forgotten that it did.'),
      say('mel', 'Then we have forgotten. People are hungry now, Bayu. Today. Not in 8 seconds.'),
      say('bayu', 'Depok has rice and no salt. We have salt and no rice. Neither of us knows about the other.'),
      say('bayu', 'That is not a talking problem that turns into a food problem later. It is one problem, and it is the food one.'),
      say('tajuddin', 'And when the other villages learn that we can hear things they cannot?'),
      say('bayu', 'Then they come to us instead of walking past us.'),
      say('tajuddin', 'That is the hopeful answer. I will prepare for the other one.'),
      say('mel', 'Tell me what you actually need.'),
      say('bayu', 'Step one is not a radio. Step one is walking to all 38 of them and finding out who is still alive.'),
      say('bayu', 'Then copper. Steel. Batteries. Fuel. 4 people who will not quit in the rainy season.'),
      say('bayu', 'And one person who worked a switchboard before the war and is still alive.'),
      say('mel', '…I know someone.'),
    ],
    closing: [
      n('First they walked. Every village they could reach, on foot, with a notebook.'),
      n('They left a notice board on every gate that would take one, and laid a signal fire on the hills that could see each other. 2 kinds of message: one that waits for a courier, and one that can say nothing except come.'),
      say('mel', '38 villages. 19 will talk to us. 6 told us to go away.'),
      say('tajuddin', 'And the other 13?'),
      say('mel', 'They asked what we would charge them.'),
      say('bayu', 'Nothing.'),
      say('mel', 'I told them nothing. They trusted us less after that.'),
      n('The libraries burned. The engineers died.'),
      n('What they knew did not die. It stayed in damaged books, in half-remembered lessons, and in the memory of old people, waiting for somebody with a reason to go and find it.'),
      n('People die. Ideas do not.'),
      n('In 2030 that is all the hope there is, and it is enough to begin with.'),
    ],
  },
  {
    era: 1,
    year: 2031,
    title: 'The First Voice',
    premise: '100 kilometres, and a radio that has to answer twice.',
    interlude:
      'Raise a mast, a generator and a transmitter above New Batavia, and hold the link to Tangerang through a rainy season.',
    opening: [
      n('Pak Min is 61 years old. He has not touched a switchboard in 4 years.'),
      say('bayu', 'They tell me you ran the telephone exchange at Gambir.'),
      say('pakmin', 'For 31 years. I ran the room. I did not own it.'),
      say('bayu', 'I want you to build an exchange out of a drum of wire and a truck battery.'),
      say('pakmin', 'You want a radio. Then say radio. An exchange is a different machine, and the wrong word insults both of us.'),
      say('pakmin', 'And be exact about which radio. AM — the voice rides on the strength of the wave. Crudest thing that works, and the only one where a village can build the other half itself.'),
      say('pakmin', 'It will carry 4 provinces on skywave at midnight and barely reach Tangerang at noon. Neither of us can do anything about that, so stop planning around it.'),
      say('bayu', 'A radio, then. One that answers.'),
      say('pakmin', 'Anything answers once. A wet finger and a razor blade will answer once.'),
      say('pakmin', 'Ask me for one that answers in March, and again in November, and again in the rain. Then I will take you seriously.'),
      say('bayu', 'That one. I am asking for that one.'),
      say('pakmin', '…That one is real work.'),
      say('bayu', 'One circuit. New Batavia to Tangerang, answering every single day. If we hold that for a week, the rest of the region will believe it can be done.'),
      n('Copper for the antenna. Batteries for the bench. A generator for transmitting. And a mast that will still be standing after a rainy season.'),
      say('mel', 'The mast is 11 days of work for 4 people, and most of what is in the store.'),
      say('mel', 'If it does not work, we do not eat in November.'),
      say('bayu', 'I understand.'),
      say('mel', 'Then say the second half of it out loud.'),
      say('bayu', 'If it does not work, we do not eat in November.'),
      say('mel', 'Good. Now it has been said, and I can stop repeating it.'),
      say('tajuddin', 'And somebody stands outside it at night. Every night. Starting the day it works.'),
      say('bayu', 'It is a mast, Tajuddin.'),
      say('tajuddin', 'It is the most valuable object in the province, and you have put it on a hill with a light on top of it.'),
    ],
    closing: [
      n('New Batavia to Tangerang. 100 kilometres of open air.'),
      say('pakmin', 'Press the key.'),
      n('Static. The sound of nothing.'),
      say('pakmin', 'Again.'),
      n('Static — and then a voice. Flat, bored, very far away. It asks who this is.'),
      say('bayu', 'It answered.'),
      say('pakmin', 'Press the key again.'),
      say('bayu', 'Pak. It answered.'),
      say('pakmin', 'Once is luck. Write down the time. Write down the weather. Then press it again.'),
      n('It answered.'),
      n('Nobody in the room said anything worth writing down. That is how you know it mattered.'),
    ],
  },
  {
    era: 2,
    year: 2034,
    title: 'The Copper War',
    premise: 'The network is on the ground now, where anyone can reach it.',
    interlude:
      'String 400 kilometres of telegraph across the Jakarta region, and keep it standing while people cut it down.',
    opening: [
      n('A radio carries a voice between 2 towns that already trust each other. It cannot carry a list of grain prices.'),
      say('iwan', 'Voice is expensive. Every radio needs one man who can speak and one man who will listen, at the same hour, both of them sober.'),
      say('iwan', 'Wire is cheap, and wire never sleeps. Give me poles.'),
      say('sari', 'I will climb them.'),
      say('bayu', 'That is 400 kilometres of poles.'),
      say('sari', 'I counted them. I still want to do it.'),
      say('bayu', 'Then that is the work. A telegraph line from here to Bekasi, and a message that costs a village nothing to send.'),
      say('iwan', 'A key at one end, an electromagnet at the other, and copper in between. The letters go as Morse code — short and long, nothing else — and a child can learn to read it by ear in a month.'),
      say('iwan', 'Every 30 kilometres we put in a relay. The signal comes in too weak to hear, works a magnet, and leaves again with a fresh battery behind it. That is the only reason distance stops mattering.'),
      n('40 kilometres in 11 days. New Batavia to Bekasi, along the old toll road, on poles cut and planted by hand.'),
      say('sari', 'I have never been prouder of anything in my life.'),
      say('iwan', 'On the twelfth night somebody took 6 kilometres of it.'),
      say('sari', '…'),
      say('iwan', 'Cut cleanly at both ends and rolled up. They knew exactly what they were taking.'),
      say('mel', 'Copper is money now. We built a bank, spread it out across open country, and did not put a door on it.'),
      say('tajuddin', 'In 2027 nobody had to touch anything to take it from you. Somebody sat in a room with a screen, and our lights went out.'),
      say('tajuddin', 'Last night it was 6 men and a hand saw.'),
      say('tajuddin', 'War changed. Then it changed back. Nobody warns you about the second part.'),
      say('bayu', 'Then we guard it.'),
      say('tajuddin', 'With what? 400 kilometres, one warden, and a rifle I have never pointed at a person.'),
      say('tajuddin', 'You cannot guard a line that long. You can only make it not worth cutting.'),
      say('bayu', 'You mean make it worthless.'),
      say('tajuddin', 'No. Make it worth more standing up. Worth more to them, not to us.'),
      say('bayu', 'Then every village the line passes gets a key and one hour on it. Their own grain prices. Their own missing people. Their messages, not ours.'),
      say('mel', 'And in return they walk their own section of it.'),
      say('bayu', 'They will not be guarding our wire. They will be guarding their wire.'),
      say('iwan', 'And the first village that decides one hour is not enough?'),
      say('bayu', 'Then we will have a different argument, and it will not be about copper.'),
    ],
    closing: [
      say('sari', 'Kampung Sawah repaired 2 kilometres by themselves. They did it badly.'),
      say('iwan', 'And you fixed it.'),
      say('sari', 'I fixed it and said nothing about the mistakes. I only said thank you.'),
      say('tajuddin', 'I have 3 fewer men on patrol and 400 more people watching the line.'),
      say('tajuddin', 'It works better than anything I have ever organised. I am still not comfortable with that.'),
      n('Theft fell by two thirds in a single season.'),
      n('The first thing people relearn about infrastructure is that it has to be defended.'),
      n('The second thing is that defending it is a political problem, even when it looks like a military one.'),
    ],
  },
  {
    era: 3,
    year: 2039,
    title: 'Who Owns The Line',
    premise: 'Everyone depends on it. Nobody voted for it.',
    interlude:
      'Run switchboards for 9 settlements, and negotiate who owns each exchange as fast as you can build them.',
    opening: [
      n('Switchboards. 9 settlements can reach each other now, without anybody carrying the message by hand.'),
      say('ayu', '240 calls yesterday. I connected every one of them.'),
      say('ayu', 'I know who is ill in Karawang. I know whose husband is not coming home. I know what Bekasi will pay for rice before Bekasi knows it.'),
      say('ayu', 'Nobody decided that I should know all of that. It simply happened.'),
      say('ayu', 'There is a machine that does my job. A step-by-step switch — a rotating arm that moves one position for every pulse the dial sends. Nobody here can build one yet. The day somebody does, I am the last operator in Java.'),
      say('ratna', 'Bandung wants its exchange back.'),
      say('bayu', 'We built it.'),
      say('ratna', 'They live in it. Those are 2 different claims, and theirs is the older one.'),
      say('bayu', 'It runs on our parts, our operators and our timetable.'),
      say('ratna', 'Yes. Say that again slowly, and listen to what kind of sentence it is.'),
      say('bayu', '…'),
      say('ratna', 'You decide who may speak to whom. You decide the price. You decide the order of the queue. You decide who is told first when the water is unsafe.'),
      say('ratna', 'There is a word for an organisation that does all 4 of those things, and there is no polite way around it.'),
      say('bayu', 'We are not a government. Nobody elected us.'),
      say('ratna', 'The second half of that is correct.'),
      say('tajuddin', 'Life was simpler when people were only stealing from us.'),
      say('ayu', 'Then give it away. Give Bandung the exchange, and let them run it badly for a year.'),
      say('bayu', 'And the standard? The rules every machine has to follow to be understood?'),
      say('ayu', 'Keep the standard. Anyone may build a switchboard. Every switchboard speaks the same way.'),
      say('ratna', 'That is still power, Bayu. It is only a kind of power you can defend in a room full of people who disagree with you.'),
      say('bayu', 'Then that is what we do this year. Hand the exchanges to the towns that live in them, and keep only the rules that let their machines understand each other.'),
      say('bayu', 'Is that better?'),
      say('ratna', 'It is survivable. Nothing here is better. You will get used to that.'),
    ],
    closing: [
      say('ayu', 'Bandung ran it for a year.'),
      say('bayu', 'Badly?'),
      say('ayu', 'Badly at first. Then not badly. Then they changed the queue rules and did not ask us first.'),
      say('bayu', '…Good.'),
      say('ayu', 'You do not sound like a man who thinks it is good.'),
      say('bayu', 'I think it is good. I did not enjoy it. Both of those are true.'),
      n('The charter was 4 pages long, and 3 of those pages were about who to blame when something breaks.'),
      n('A network that everybody depends on is a government that nobody voted for.'),
      n('You cannot escape that by not wanting it.'),
    ],
  },
  {
    era: 4,
    year: 2045,
    title: 'Make, Not Find',
    premise: 'The old world runs out of parts before it runs out of problems.',
    interlude:
      'Build the glassworks and the chemistry under it, and make valves that outlast the ones you can no longer find.',
    opening: [
      n('There is nothing left in the ruins.'),
      say('mel', 'Last salvage trip: 9 valves. 4 cracked in the cart. 2 were already dead when we found them.'),
      say('mel', 'We burn 3 days of fuel to bring back 3 days of parts.'),
      say('bayu', 'Then we stop looking for them.'),
      say('bayu', 'We make them instead. Glass, vacuum, acid, wire — every part of a valve, made in this town, again and again.'),
      say('hendra', 'You want me to blow glass to a tenth of a millimetre. In a shed. The same way. Every single time.'),
      say('hendra', 'I made bottles, Pak Bayu. A bottle forgives your mistakes. This will not.'),
      say('dewi', 'And I have to make the acid he cleans the glass with. Out of chemicals I have to make first. Out of rock I have to dig up.'),
      say('dewi', 'Nobody in this country has made sulphuric acid to a proper specification for 18 years.'),
      say('pakmin', 'I can repair anything that anyone has ever put in front of me.'),
      say('pakmin', 'I have never made a valve in my life. Not one. And never a transistor either.'),
      say('bayu', 'But you know how they work.'),
      say('pakmin', 'I know how a great many things work, Bayu.'),
      say('pakmin', 'Knowing has never once been the hard part.'),
      say('pakmin', 'One valve amplifies. 2 of them in a loop make an oscillator. Everything you have ever wanted out of electronics is those 2 tricks, repeated until you run out of glass.'),
      n("Cathode. Grid. Anode. Getter. Vacuum. Seal. 6 words, and each one of them is somebody else's whole profession."),
    ],
    closing: [
      say('hendra', '14.'),
      say('dewi', '14 what?'),
      say('hendra', '14 of them before one of them held its vacuum overnight. I want that number written down somewhere.'),
      say('pakmin', 'It will be. With the date.'),
      n('The first batch lasted 400 hours. The salvaged ones used to last 12,000.'),
      say('dewi', 'It is worse than the rubbish we dug out of a bank in Kebayoran.'),
      say('bayu', 'Yes. It is.'),
      say('dewi', 'Then why are you smiling?'),
      say('bayu', 'Because next month we can make more of these. There will never be more of those.'),
      n('Salvage ends here.'),
      n('From now on they make everything themselves — badly, expensively, and on purpose.'),
    ],
  },
  {
    era: 5,
    year: 2052,
    title: 'The Thinking Machine',
    premise: 'Memory you can hold in your hand, and the first person who never saw the old world.',
    interlude:
      'Thread core memory, build a machine that can hold a routing table, and teach the generation that was born after the war.',
    opening: [
      n('Ferrite rings, baked in a kiln, then threaded by hand with 3 wires each.'),
      say('fajar', '4,096 bits of memory. 11 women. 4 months of work.'),
      say('fajar', 'And it remembers with the power switched off. It sits there in the dark, remembering.'),
      say('pakmin', 'Do not be so amazed. It is a magnet that stays the way you left it.'),
      say('fajar', 'A magnet that remembers, Pak. That is the whole job this year — memory the network can keep, so a machine can hold a message and decide where to send it.'),
      say('fajar', 'And the program goes in on punched cards. A hole is a one, no hole is a zero, and a whole day of work fits in both hands.'),
      say('bayu', 'Correct one with a pencil. Post it to Bandung. Read it back in 40 years. Nothing we ever pulled out of a ruin can say that.'),
      n('Fajar is 19. He was born the year the first mast went up. He has never seen the old world.'),
      say('fajar', 'What was it actually like?'),
      say('bayu', '…'),
      say('fajar', 'You always go quiet when I ask that.'),
      say('bayu', 'Because every time I try to describe it, it sounds like a story I am making up.'),
      say('fajar', 'Try anyway.'),
      say('bayu', 'Everything. Everywhere. Immediately. And free.'),
      say('bayu', 'Every book that had ever been written. Any living person, in one second, for no money at all.'),
      say('fajar', 'That is not a description. That is boasting.'),
      say('bayu', 'And we were bored of it. That is the part you will not believe.'),
      say('fajar', 'I do not believe any of it.'),
      say('bayu', 'No. In your position I would not believe it either.'),
    ],
    closing: [
      n('One morning in the dry season, Pak Min does not come to the workbench.'),
      n('He was old. He had been working on this for 22 years, and he often said he intended to die while people still owed him money.'),
      say('fajar', 'He left his notebook open.'),
      say('bayu', 'What does it say?'),
      say('fajar', '"Write it down properly. With the date."'),
      say('bayu', 'That is what he said on the first night that anything ever answered.'),
      n('He knew exactly how a semiconductor is made.'),
      n('He could describe the furnace, the crystal, the masks, the diffusion, and the order of every step. He read all of it before the war, and he never forgot a page of it.'),
      n('He never saw one being made.'),
      n('The knowledge was not lost. It was in his hands the whole time.'),
      n('Knowledge survives a collapse easily. It is light, it copies itself, and it hides inside people.'),
      n('The ability to build does not survive. That means furnaces, and supply chains, and 10,000 hours of being wrong on purpose.'),
      n('Rebuilding that ability is the real work, and the work takes longer than one life.'),
      say('bayu', 'Write it down properly, Fajar.'),
      say('fajar', 'With the date.'),
    ],
  },
  {
    era: 6,
    year: 2061,
    title: 'The Drawer Runs Out',
    premise: 'Every router in the country runs on a chip that nobody alive can make.',
    interlude:
      'Stretch the last salvaged chips across 15 provinces, while 9 of them argue about a furnace at Cilegon.',
    opening: [
      n('Every router in the network runs on a chip that somebody found in a drawer.'),
      n('The lines stopped being wires between 2 towns years ago. A modem turns the bits into tones the telephone network already carries, a message is cut into packets, and every packet carries the address it is going to.'),
      n('Some of them arrive wrong. Every packet carries a checksum, and one that fails it is simply asked for again — which has always been cheaper than perfect wire.'),
      say('anisa', 'Every single one. And nobody alive can make another.'),
      say('mel', 'Last year we recovered 9. The year before that, 40. The year before that, 311.'),
      say('mel', 'I can draw you the line on a graph. You will not like its shape.'),
      n('The chips themselves were fine. 30 years in a drawer and still perfect — ceramic and plastic outlast almost everything people build.'),
      n('Everything around them died. The capacitors dried out. The batteries leaked. The disks seized. The screens went black and stayed black.'),
      n('The programs died as well. Memory without power does not keep what is in it. The boards came back undamaged, and empty.'),
      say('fajar', 'The machines survived. The software did not.'),
      say('fajar', '40 years of other people thinking, and we inherited the machines and none of the thinking.'),
      say('anisa', 'The thinking we can do again. That part is only difficult.'),
      say('anisa', 'The chips we cannot do again at all, and that is a different word entirely.'),
      say('bayu', 'Then we make our own. Silicon. From sand. From here.'),
      say('ratna', 'Bayu.'),
      say('bayu', 'I know what I just said.'),
      say('ratna', 'That is not a workshop. That is a furnace that never goes out, and gases that nobody in this country produces, and water cleaner than anything anyone here has ever drunk.'),
      say('ratna', 'It is a chemical industry. A chemical industry needs a supply chain. A supply chain needs 9 provinces to agree with each other for 10 years without fighting.'),
      say('bayu', 'Yes.'),
      say('ratna', '…You already knew all of that.'),
      say('bayu', 'I have known it since 2030. It was true when the problem was salt.'),
      say('bayu', 'It is the same problem. It has only stopped being about radios.'),
      say('anisa', 'How long will it take?'),
      say('bayu', 'Longer than I have left.'),
      say('anisa', 'That is not an answer.'),
      say('bayu', 'It is the honest one. Do you want the other one?'),
      say('anisa', 'No. Light the furnace.'),
    ],
    closing: [
      n('They chose a site at Cilegon: the sand, the water, and a road that had survived.'),
      say('dewi', 'First furnace run. 9 hours. The crucible cracked in the eighth hour.'),
      say('hendra', 'The second one held.'),
      say('anisa', 'And it produced a crystal with the internal structure of a house brick.'),
      say('bayu', 'Write it down.'),
      say('anisa', 'With the date, yes. Everybody here says that, and nobody explains why.'),
      say('fajar', 'Ask me another time.'),
      n('9 provinces signed the agreement for that furnace. Not one of the people who signed it expected to live long enough to see what it made.'),
      n('They signed it anyway, which is the only genuinely interesting thing anybody did that decade.'),
    ],
  },
  {
    era: 7,
    year: 2068,
    title: 'A Path Nobody Chose',
    premise: 'The last thing to build is the thing that makes you unnecessary.',
    interlude:
      'Run the fab until it works, publish everything you learned, and hand the network to people who never asked your permission.',
    opening: [
      n('It failed 5 times. Each failure named a problem that an entire region had to solve before the next attempt was even possible.'),
      n('Purity. Growing the crystal. Making the masks. Handling the dopants. Dust.'),
      say('dewi', 'Dust. 23 years of chemistry, and we lost a whole year to dust.'),
      say('hendra', 'The room has to be cleaner than the operating theatre in Bogor. I keep saying that, and it keeps sounding like a joke.'),
      say('fajar', '3 good chips out of 400.'),
      say('bayu', 'That is enough.'),
      say('fajar', 'It is one bit wide, Pak Bayu. One. Anything we ever pulled out of a ruin would be embarrassed to sit next to it.'),
      say('fajar', 'We copied a dead one. MC14500B, printed on the package — Motorola, 1977. 16 instructions, one bit at a time.'),
      say('bayu', 'There is an Intel 8051 in the same drawer that is an entire computer on one chip. It is better than ours by every measure anybody can take.'),
      say('bayu', 'And tomorrow we can make another one.'),
      say('bayu', 'Nothing in that drawer could ever do that. Not once. Not ever.'),
      n('Speed was never the point.'),
      n('15 provinces cannot be supplied out of a drawer. A network that runs on rationed scrap belongs to whoever controls the rations.'),
      n('A network that can sell chips is an equal.'),
      say('ratna', 'Bandung asked again. About the exchange.'),
      say('bayu', 'Give it to them.'),
      say('ratna', 'And the standard?'),
      say('bayu', 'Publish it. All of it. The protocol, the frame format, the addressing, the furnace process, the failures.'),
      say('ratna', 'The failures as well.'),
      say('bayu', 'The failures especially. 23 years of them. Nobody should have to pay for those a second time.'),
      say('ratna', 'Then we stop being necessary.'),
      say('bayu', 'That was always the job.'),
      say('tajuddin', 'You understand what you are doing.'),
      say('bayu', 'Tell me anyway.'),
      say('tajuddin', 'For 30 years I guarded things because we were the only people who had them.'),
      say('tajuddin', 'You are about to make the network not worth stealing. That is the only defence I have ever seen actually work.'),
    ],
    closing: [
      n('War never changes.'),
      n('What changes is what is worth taking.'),
      n('A network that one city owns is worth a war. A network that anyone can build is not worth the walk.'),
      n('New Batavia to Surabaya.'),
      n('Through a gateway that New Batavia manufactured, inside a network that New Batavia does not own, along a route that nobody chose.'),
      say('mel', 'Which way did it go?'),
      say('bayu', 'I cannot tell you.'),
      say('mel', 'Can you find out?'),
      say('bayu', 'No. That is the point.'),
      n('People die. Ideas do not.'),
      n('But an idea that nobody can build is only a story with references at the bottom.'),
      n('Closing the distance between knowing a thing and being able to make it was the whole point of all of this.'),
      n('It took 41 years.'),
      n('The man who understood it best did not live to see the end of it. He would have told you that this is normal.'),
    ],
  },
]
