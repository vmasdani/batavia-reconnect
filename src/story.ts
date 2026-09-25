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
  /**
   * Technologies to put on screen while this line is being said.
   *
   * Only for the lines where somebody names the thing the era is about to
   * build — "build a radio out of a drum of wire and a truck battery" is worth
   * a photograph of a radio and of a mast; "Bandung asked again" is not. Every
   * other term in the script is a photograph on hover and nothing until then,
   * because a picture that appears on every third line stops being a picture
   * and becomes furniture.
   *
   * Glossary term ids, at most 3, and structure rather than text: the
   * Indonesian script supplies lines at the same indices and inherits these.
   */
  shows?: string[]
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

const n = (text: string, shows?: string[]): StoryLine => ({ who: 'narrator', text, shows })
const say = (who: string, text: string, shows?: string[]): StoryLine => ({ who, text, shows })

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
      say('mel', 'In 2027 I drove a container to Bogor. It took 3 days. The man waiting for it was 2 days dead when I got there.'),
       n('It is 2030.'),
       n('There are no working telephones or radio stations. Messages still travel by foot.'),
       say('bayu', 'Jakarta is not a city any more. It is 40 villages, and none of them can hear each other.'),
       say('mel', '38 villages. Cikarang went silent in March. I stopped counting after that.'),
       say('bayu', 'And you think that is the problem.'),
       say('mel', 'I think the problem is that we have 3 days of rice. Your map does not show that.'),
      say('bayu', 'I want to bring communication back. Not the world we lost — one message that can cross this region in a day, and an answer coming back.'),
      say('tajuddin', 'How far is Bogor?'),
      say('bayu', '2 days of walking. It used to take 8 seconds to call them. We have already forgotten that it did.'),
      say('mel', 'Then we have forgotten. People are hungry now, Bayu. Today. Not in 8 seconds.'),
      say('bayu', 'Depok has rice and no salt. We have salt and no rice. Neither of us knows about the other.'),
      say('bayu', 'That is not a talking problem that turns into a food problem later. It is one problem, and it is the food one.'),
      say('tajuddin', 'And when the other villages learn that we can hear things they cannot?'),
      say('bayu', 'Then they come to us instead of walking past us.'),
       say('tajuddin', 'That is the hopeful answer. I will prepare for people coming with knives.'),
      say('mel', 'Tell me what you actually need.'),
       say('bayu', 'Step one is not a radio. We walk to all 38 villages and find out who is still alive.'),
      say('bayu', 'Then copper. Steel. Batteries. Fuel. 4 people who will not quit in the rainy season.'),
      say('bayu', 'And one person who worked a switchboard before the war and is still alive.'),
      say('mel', '…I know someone.'),
    ],
    closing: [
      n('First they walked. Every village they could reach, on foot, with a notebook.'),
       n('They left a notice board at every gate that would take one, and built signal fires on hills that could see each other. One message waited for a courier. The other said only: come.'),
      say('mel', '38 villages. 19 will talk to us. 6 told us to go away.'),
      say('tajuddin', 'And the other 13?'),
      say('mel', 'They asked what we would charge them.'),
      say('bayu', 'Nothing.'),
      say('mel', 'I told them nothing. They trusted us less after that.'),
      n('The libraries burned. The engineers died.'),
      n('What they knew did not die. It stayed in damaged books, in half-remembered lessons, and in the memory of old people, waiting for somebody with a reason to go and find it.'),
      n('People die. Ideas do not.'),
       n('In 2030, that was enough to begin.'),
    ],
  },
  {
    era: 1,
    year: 2031,
    title: 'The First Voice',
    premise: '100 kilometres, and a radio that has to answer twice.',
     interlude:
       'Raise a radio tower, a generator and a transmitter above New Batavia, and hold the link to Tangerang through a rainy season.',
     opening: [
       n('The year is 2031. Villages have started passing messages again, but only by courier, notice board and signal fire. Now they are ready to try a radio.'),
       n('Pak Min is 61 years old. He has not touched a switchboard in 4 years.'),
      say('bayu', 'They tell me you ran the telephone exchange at Gambir.'),
      say('pakmin', 'For 31 years. I ran the room. I did not own it.'),
       say('bayu', 'I want you to build a radio out of a drum of wire and a truck battery.', ['am-radio', 'antenna']),
      say('pakmin', 'You want a radio. Then say radio. An exchange is a different machine, and the wrong word insults both of us.'),
      say('pakmin', 'And be exact about which radio. AM — the voice rides on the strength of the wave. Crudest thing that works, and the only one where a village can build the other half itself.'),
       say('pakmin', 'At midnight it may reach 4 provinces. At noon it may barely reach Tangerang. Plan for the bad hours.'),
      say('bayu', 'A radio, then. One that answers.'),
       say('pakmin', 'A crude radio can answer once. That proves nothing.'),
       say('pakmin', 'Ask me for one that answers in March, November, and rain. Then I will take you seriously.'),
      say('bayu', 'That one. I am asking for that one.'),
      say('pakmin', '…That one is real work.'),
      say('bayu', 'One circuit. New Batavia to Tangerang, answering every single day. If we hold that for a week, the rest of the region will believe it can be done.'),
       n('Copper for the antenna. Batteries for the bench. A generator for transmitting. And a radio tower that will still be standing after a rainy season.', ['antenna', 'battery', 'generator', 'transmitter']),
       say('mel', 'The radio tower costs 11 days of work for 4 people, and most of what is in the store.'),
      say('mel', 'If it does not work, we do not eat in November.'),
      say('bayu', 'I understand.'),
      say('mel', 'Then say the second half of it out loud.'),
      say('bayu', 'If it does not work, we do not eat in November.'),
      say('mel', 'Good. Now it has been said, and I can stop repeating it.'),
      say('tajuddin', 'And somebody stands outside it at night. Every night. Starting the day it works.'),
       say('bayu', 'It is a radio tower, Tajuddin.'),
       say('tajuddin', 'It is the most valuable object in the province. You put it on a hill with a light on top.'),
    ],
    closing: [
      n('New Batavia to Tangerang. 100 kilometres of open air.'),
      say('pakmin', 'Press the transmit switch.', ['transmitter']),
      n('Static. The sound of nothing.'),
      say('pakmin', 'Again.'),
      n('Static — and then a voice. Flat, bored, very far away. It asks who this is.'),
       say('bayu', 'It answered us.'),
      say('pakmin', 'Press it again.'),
      say('bayu', 'Pak. It answered.'),
       say('pakmin', 'Once is luck. Write down the time and weather. Now press it again.'),
      n('It answered.'),
       n('Mel laughed once. Then she covered her mouth and checked the fuel again.'),
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
       n('The year is 2034. Radio can carry a voice between towns, but every broadcast needs 2 trained people awake at the same time. Telegraphs are starting to be built.'),
       n('A radio carries a voice between 2 towns that already trust each other. It cannot carry a list of grain prices.'),
      say('iwan', 'Voice is expensive. Every radio needs one man who can speak and one man who will listen, at the same hour, both of them sober.'),
      say('iwan', 'Wire is cheap, and wire never sleeps. Give me poles.'),
      say('sari', 'I will climb them.'),
      say('bayu', 'That is 400 kilometres of poles.'),
      say('sari', 'I counted them. I still want to do it.'),
      say('bayu', 'Then that is the work. A telegraph line from here to Bekasi, and a message that costs a village nothing to send.', ['telegraph']),
      say('iwan', 'A key at one end, an electromagnet at the other, and copper in between. The letters go as Morse code — short and long, nothing else — and a child can learn to read it by ear in a month.', ['telegraph-key', 'electromagnet', 'morse-code']),
      say('iwan', 'Every 30 kilometres we put in a relay. The signal comes in too weak to hear, works a magnet, and leaves again with a fresh battery behind it. That is the only reason distance stops mattering.', ['relay-station']),
      n('40 kilometres in 11 days. New Batavia to Bekasi, along the old toll road, on poles cut and planted by hand.'),
       say('sari', 'I have never been prouder of anything.'),
      say('iwan', 'On the twelfth night somebody took 6 kilometres of it.'),
      say('sari', '…'),
      say('iwan', 'Cut cleanly at both ends and rolled up. They knew exactly what they were taking.'),
      say('mel', 'Copper is money now. We built a bank, spread it out across open country, and did not put a door on it.'),
      say('tajuddin', 'In 2027 nobody had to touch anything to take it from you. Somebody sat in a room with a screen, and our lights went out.'),
      say('tajuddin', 'Last night it was 6 men and a hand saw.'),
       say('tajuddin', 'In 2027 they cut power from a room. Last night they used a saw. I preferred the room.'),
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
       n('People learned to defend the section of wire outside their own doors.'),
       n('That worked better than putting one armed person over 400 kilometres of copper.'),
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
       n('The year is 2039. Telegraph lines now cross the region, but each end still needs a trained operator. The next step is a telephone exchange.'),
       n('Switchboards. 9 settlements can reach each other now, without anybody carrying the message by hand.', ['switchboard']),
      say('ayu', '240 calls yesterday. I connected every one of them.'),
      say('ayu', 'I know who is ill in Karawang. I know whose husband is not coming home. I know what Bekasi will pay for rice before Bekasi knows it.'),
      say('ayu', 'Nobody decided that I should know all of that. It simply happened.'),
      say('ayu', 'There is a machine that does my job. A step-by-step switch — a rotating arm that moves one position for every pulse the dial sends. Nobody here can build one yet. The day somebody does, I am the last operator in Java.', ['strowger']),
      say('ratna', 'Bandung wants its exchange back.'),
      say('bayu', 'We built it.'),
      say('ratna', 'They live in it. Those are 2 different claims, and theirs is the older one.'),
      say('bayu', 'It runs on our parts, our operators and our timetable.'),
      say('ratna', 'Yes. Say that again slowly, and listen to what kind of sentence it is.'),
      say('bayu', '…'),
       say('ratna', 'You decide who may speak to whom. You decide the price and the queue. You decide who hears about bad water first.'),
       say('ratna', 'You run a government, Bayu. You just do not have a vote.'),
      say('bayu', 'We are not a government. Nobody elected us.'),
      say('ratna', 'The second half of that is correct.'),
      say('tajuddin', 'Life was simpler when people were only stealing from us.'),
      say('ayu', 'Then give it away. Give Bandung the exchange, and let them run it badly for a year.'),
      say('bayu', 'And the standard? The rules every machine has to follow to be understood?'),
      say('ayu', 'Keep the standard. Anyone may build a switchboard. Every switchboard speaks the same way.'),
      say('ratna', 'That is still power, Bayu. It is only a kind of power you can defend in a room full of people who disagree with you.'),
      say('bayu', 'Then that is what we do this year. Hand the exchanges to the towns that live in them, and keep only the rules that let their machines understand each other.'),
      say('bayu', 'Is that better?'),
       say('ratna', 'It is survivable. That is the standard now.'),
    ],
    closing: [
      say('ayu', 'Bandung ran it for a year.'),
      say('bayu', 'Badly?'),
      say('ayu', 'Badly at first. Then not badly. Then they changed the queue rules and did not ask us first.'),
      say('bayu', '…Good.'),
      say('ayu', 'You do not sound like a man who thinks it is good.'),
       say('bayu', 'I think it is good. I hated watching it happen.'),
      n('The charter was 4 pages long, and 3 of those pages were about who to blame when something breaks.'),
       n('A network that everybody depends on has to answer to everybody.'),
       n('Bayu disliked that rule. He signed it anyway.'),
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
       n('The year is 2045. People can call across the region, but the network still runs on parts taken from the old world. The supply of those parts is almost gone.'),
       n('There is nothing left in the ruins.'),
      say('mel', 'Last salvage trip: 9 valves. 4 cracked in the cart. 2 were already dead when we found them.'),
      say('mel', 'We burn 3 days of fuel to bring back 3 days of parts.'),
      say('bayu', 'Then we stop looking for them.'),
      say('bayu', 'We make them instead. Glass, vacuum, acid, wire — every part of a valve, made in this town, again and again.', ['vacuum-tube', 'glassblowing', 'sulphuric-acid']),
      say('hendra', 'You want me to blow glass to a tenth of a millimetre. In a shed. The same way. Every single time.'),
       say('hendra', 'I made bottles, Pak Bayu. A bottle forgives a bad hand. A valve does not.'),
      say('dewi', 'And I have to make the acid he cleans the glass with. Out of chemicals I have to make first. Out of rock I have to dig up.'),
      say('dewi', 'Nobody in this country has made sulphuric acid to a proper specification for 18 years.'),
      say('pakmin', 'I can repair anything that anyone has ever put in front of me.'),
      say('pakmin', 'I have never made a valve in my life. Not one. And never a transistor either.'),
      say('bayu', 'But you know how they work.'),
      say('pakmin', 'I know how a great many things work, Bayu.'),
       say('pakmin', 'Knowing was never the hard part. Making one is the hard part.'),
      say('pakmin', 'One valve amplifies. 2 of them in a loop make an oscillator. Everything this network runs on today is those 2 tricks, repeated until you run out of glass.', ['amplifier', 'oscillator']),
      say('pakmin', 'There is a third trick. Drive a valve hard enough and it stops amplifying anything at all — it is passing everything, or it is passing nothing, and it will change its mind 1,000,000 times a second.'),
      say('bayu', 'What is that one for?'),
      say('pakmin', 'Ask me when you have 1,000 valves and a reason. Not this year.'),
      n("Cathode. Grid. Anode. Getter. Vacuum. Seal. 6 words, and each one of them is somebody else's whole profession."),
    ],
    closing: [
      say('hendra', '14.'),
      say('dewi', '14 what?'),
      say('hendra', '14 of them before one of them held its vacuum overnight. I want that number written down somewhere.'),
      say('pakmin', 'It will be. With the date.'),
      n('The first batch lasted 400 hours. The salvaged ones used to last 12,000.'),
       say('dewi', 'It is worse than the rubbish we dug out of that bank in Kebayoran.'),
      say('bayu', 'Yes. It is.'),
      say('dewi', 'Then why are you smiling?'),
       say('bayu', 'Because next month we can make more. We can never make more old ones.'),
      n('Salvage ends here.'),
       n('From now on they made everything themselves. It was worse, slower, and finally theirs.'),
    ],
  },
  {
    era: 5,
    year: 2048,
    title: 'The Counting Room',
    premise: 'It cannot remember anything, and it must never be switched off.',
    interlude:
      'Build a machine out of valves that does the arithmetic the region runs on, and keep 3,000 of them alight through a rainy season.',
    opening: [
      n('The year is 2048. The region makes its own valves now. Every timetable, every toll and every queue on the network is still worked out by a person with a pencil.'),
      say('ayu', 'Every night somebody sits down with the traffic book and works out tomorrow.'),
      say('ayu', 'Which line carries which town. Who gets the morning hour. What we owe Bekasi for carrying our messages last week.'),
      say('ayu', '15 exchanges now. It takes 6 hours, and it is wrong by breakfast, because Karawang changes its mind at dawn.'),
      say('bayu', 'How wrong?'),
      say('ayu', 'Serang was left out of the timetable for a day in March. Nobody noticed until Serang walked here to ask why.'),
      say('bayu', 'Then the arithmetic has to stop being a person.'),
      say('pakmin', 'You want a machine that adds.'),
      say('bayu', 'I want a machine that adds, does not get tired, and has no opinion about Karawang.'),
      say('pakmin', 'We have had one strung along the roads since 2034. Nobody ever looked at it properly.', ['relay-station']),
      say('pakmin', 'A relay is a switch that another switch can throw. There is nothing else in it.', ['electromagnet']),
      say('pakmin', 'Put 2 in a line and the current arrives only if both are closed. Call that "and".'),
      say('pakmin', 'Put 2 side by side and it arrives if either one is closed. Call that "or".'),
      say('pakmin', 'Wire one to open when it is fed instead of closing, and that is "not". 3 ideas, and there is no fourth.'),
      say('bayu', 'On or off. Nothing in between, and nothing else to say.', ['binary']),
      say('pakmin', 'Morse has been doing it since 2034. The only new part is that nobody has to be listening.'),
      say('bayu', 'And a sum is built out of those 3 ideas.'),
      say('pakmin', 'A sum is built out of nothing else. Neither is a comparison. Neither is a decision.'),
      n('They took 200 relays off the spares shelf — telegraph stock, wound in 2036, for a line to Sukabumi that was never built.'),
      n('It took 5 weeks to make it add 2 numbers of 4 bits.'),
      say('bayu', '6 and 7.'),
      n('The shed clicked like rain on a tin roof, for a second and a half, and printed 13.'),
      say('mel', 'That is the finest thing I have ever seen in this town. How long did it take?'),
      say('bayu', 'A second and a half.'),
      say('ayu', 'The traffic book is 40,000 of those.'),
      say('mel', 'Then the machine needs 16 hours and the pencil needs 6.'),
      say('mel', 'We have built a slower pencil.'),
      say('pakmin', 'We have built a pencil that is never wrong. Now we make it quick.'),
      say('pakmin', 'A relay closes because a piece of metal moves. Metal is heavy, and metal wears out. That is the whole of what is slow.'),
      say('pakmin', 'A valve does the same 3 tricks with nothing moving inside it at all.', ['vacuum-tube']),
      say('hendra', 'How many.'),
      say('pakmin', 'For the traffic book, 3,000. Probably more.'),
      say('hendra', 'I make 40 a week. On a good week, with no cracked seals.'),
      say('hendra', 'That is 18 months of my life before your machine adds anything at all.'),
      say('bayu', 'Yes.'),
      say('hendra', 'And they last 400 hours. I am the one who wrote that number down.'),
      say('hendra', '3,000 valves at 400 hours each is one of them dying every 8 minutes.'),
      say('pakmin', 'That is the number if you keep switching it off.'),
      say('pakmin', 'A valve dies cold, at the moment you make it hot. The glass pulls one way, the metal pulls the other, and one of them loses.'),
      say('pakmin', 'Leave the heaters lit and hardly any of them die. So the machine is never switched off. Not at night, not on a holiday, not ever.'),
      say('mel', 'Say the fuel out loud.'),
      say('bayu', 'I do not have that number yet.'),
      say('mel', 'I do. A machine that is never switched off is a generator that is never switched off.', ['generator']),
      say('mel', 'We have argued about fuel every year since 2031. Never once about a thing that burns it while it sits there doing nothing.'),
      say('bayu', 'It will not be doing nothing. It will be waiting.'),
      say('mel', 'It is the same diesel either way.'),
      n('Fajar is 15. He is small, and in this shed that turns out to be a qualification.'),
      say('fajar', 'When one of them dies, how do you know which one?'),
      say('pakmin', 'The answer comes out wrong.'),
      say('fajar', 'That tells you the machine is broken. It does not tell you where.'),
      say('pakmin', '…No. It does not.'),
      say('fajar', 'Then that is the work I want. I will go in and find it.'),
      say('tajuddin', 'He is 15 years old.'),
      say('pakmin', 'He is also the only one of us who fits between the racks. Ask me the second question, boy.'),
      say('fajar', 'How long will it take me to find one?'),
      say('pakmin', 'Good. Nobody knows. That is what this year is for.'),
      say('bayu', 'And somebody has to tell it what to do.'),
      say('pakmin', 'It has nowhere to keep what you tell it. Whatever it knows, it knows because of where the wires go.'),
      say('bayu', 'So a program is a wiring diagram.'),
      say('pakmin', 'A program is 300 plugs in 300 sockets. Put 1 of them in the wrong hole and the answer is wrong, and nothing anywhere will tell you which hole.'),
      say('bayu', 'How long to make it do a different job?'),
      say('pakmin', 'Half a day. Longer when it is you.'),
    ],
    closing: [
      n('It filled the long shed behind the glassworks: 3,140 valves, a plugboard the size of a door, and a heat you could feel from the gate.'),
      say('ayu', 'The traffic book. Read it out.'),
      n('4 minutes. Putting the plugs in had taken half a day.'),
      say('ayu', 'Do it again.'),
      say('bayu', 'It is the same answer, Ayu.'),
      say('ayu', 'Pak Min made you press the switch twice in 2031. Do it again.'),
      n('It was the same answer.'),
      say('fajar', '11.'),
      say('bayu', '11 what?'),
      say('fajar', '11 valves since Tuesday. I found 9 of them. The other 2 I found by pulling out a good one by mistake and putting it back.'),
      say('pakmin', 'Write that down. With the date.'),
      n('The heaters stayed lit through the whole rainy season, and hardly any of them died. Nobody has switched that machine off since.'),
      n('It could do the arithmetic of 40 clerks. It could not remember one thing it had ever done.'),
      say('bayu', 'Every morning it is exactly as clever as the wires we left in it, and not one bit cleverer.'),
      say('pakmin', 'Yes. Write that down as well. It is the next problem, and it is not this year.'),
      n('One morning in the dry season, Pak Min does not come to the workbench.'),
      say('mel', 'He wrote in that notebook every day. Even the days it only said that nothing worked.'),
      say('fajar', 'There is no entry for yesterday. The last one stops in the middle of a sentence.'),
      say('bayu', 'Read it out.'),
      say('pakmin', '"Fajar asked me what I did when Gambir went quiet. I said: when you are older. He is older now. Tomorrow I will—"'),
      n('Nothing came after that.'),
      say('tajuddin', 'I will stand the gate tonight. He hated a crowd.'),
      say('mel', '31 years at Gambir. 17 here. Count it however you like. It is a life.'),
      say('mel', 'He used to say he intended to die while people still owed him money. He got his wish.'),
      say('bayu', 'Of course he did. He timed everything.'),
      say('fajar', 'The answer was his to give. Nobody else was there.'),
      say('bayu', 'Then write the question down. It is the only part we can still keep.'),
      say('fajar', 'I will write it down properly.'),
      say('fajar', 'With the date.'),
    ],
  },
  {
    era: 6,
    year: 2052,
    title: 'The Thinking Machine',
    premise: 'Memory you can hold in your hand, and the first person who never saw the old world.',
    interlude:
      'Thread core memory, build a whole computer around a chip from the drawer to a design the old world published, and teach the generation that was born after the war.',
     opening: [
       n('The year is 2052. The counting room has run for 4 years without once being switched off, and every morning it still knows nothing. What the network needs next is a machine that remembers — and one a workshop can build twice.'),
       n('In the drawer beside the valves: processors. A whole computer on one chip, salvaged and perfect, and doing nothing at all.'),
      say('fajar', 'This chip is cleverer than the entire counting room, and it has sat in a tin since before I was born. Why has nobody used it?'),
      say('bayu', 'Because a processor with no memory and no program is a stone. Give it a memory it keeps, a program it keeps, and a way to face a person — then it is a computer. Leave one of those out and it stays a stone.'),
      say('fajar', 'The counting room forgets everything the moment we change its wires. 300 plugs, by hand, every time. I have pulled those plugs for 4 years.'),
       n('So they wove it a memory. Ferrite rings, baked in a kiln and threaded by hand, 3 fine wires to a ring — 4,096 bits, 11 women, 4 months.', ['core-memory']),
      say('fajar', 'It remembers with the power off. It sits in the dark, remembering. Pak Min would have said do not be so amazed — it is only a magnet that stays the way you left it.'),
      say('fajar', 'And the program goes in on punched cards. A hole is a one, no hole is a zero, and a whole day of work fits in both hands.', ['punched-card']),
      say('bayu', 'We are not inventing the machine. The old world printed a whole microcomputer in a magazine once — every schematic, on purpose, so any workshop could build its own. We copy it chip for chip, stand one at each junction, and it holds a message, looks the address up in a routing table, and decides where it goes.', ['microcomputer']),
       n('Fajar is 19. He was born 2 years after the first radio tower went up, and he has spent 4 of them crawling between hot racks with a lamp. He has never seen the old world.'),
       say('fajar', 'Tell me one thing I would have seen.'),
      say('bayu', '…'),
      say('fajar', 'You always go quiet when I ask that.'),
      say('bayu', 'Because every time I try to describe it, it sounds like a story I am making up.'),
      say('fajar', 'Try anyway.'),
       say('bayu', 'You could call somebody on the other side of the world from your kitchen.'),
       say('bayu', 'You could read any book without finding a copy. You could watch a match from a country you had never visited.'),
       say('fajar', 'That sounds made up.'),
       say('bayu', 'People complained that it was slow.'),
       say('fajar', 'I do not believe that part.'),
       say('bayu', 'You should not. I barely believe it myself.'),
    ],
    closing: [
      n('The first machine stood on a bench, not in a shed: the salvaged processor, the woven memory, a keypad, and a screen showing one line of type. A whole computer, copied from a magazine, that a person could sit down at.'),
      say('ayu', 'Read it back.'),
      n('It read back every bit, exactly as written.'),
      say('fajar', 'Again.'),
      n('It was the same.'),
      n('For the rest of the year they wrote down everything Pak Min knew.'),
      say('fajar', 'The furnace. The crystal. The masks. The order of every step of a semiconductor. He said it to Ayu, and I wrote it.'),
      say('bayu', 'He read all of it before the war, and he never forgot a page. He never saw one made.'),
      say('bayu', 'Knowing was in his hands the whole time. Making needs furnaces, supply chains, and 10,000 hours of being wrong on purpose. That takes longer than a man has.'),
      n('Knowledge survives a collapse easily. It is light, it copies itself, and it hides inside people.'),
      n('Capability does not. Capability is rebuilt by hand, once in a lifetime, and that is the work.'),
      say('ayu', 'One page stays empty. What he did when Gambir went quiet.'),
      say('bayu', 'Then write that the page is empty. A book with one honest hole is worth more than a book with none.'),
      say('fajar', 'He would have argued with that.'),
      say('bayu', 'For hours. Write it anyway.'),
    ],
  },
  {
    era: 7,
    year: 2061,
    title: 'The Drawer Runs Out',
    premise: 'Every router in the country runs on a chip that nobody alive can make.',
    interlude:
      'Stretch the last salvaged chips across 15 provinces, while 9 of them argue about a furnace at Cilegon.',
     opening: [
       n('The year is 2061. Messages now travel as packets, and routers decide where to send them. Almost every router depends on one old chip that nobody here can make.'),
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
       say('fajar', '40 years of other people thinking, and we inherited the machines without their instructions.'),
       say('anisa', 'We can think again. It will be hard, but we can do it.'),
      say('anisa', 'The chips we cannot do again at all, and that is a different word entirely.'),
      say('bayu', 'Then we make our own. Silicon. From sand. From here.', ['integrated-circuit']),
      say('ratna', 'Bayu.'),
      say('bayu', 'I know what I just said.'),
       say('ratna', 'That is not a workshop. It is a furnace that never stops, gases we do not make, and water cleaner than drinking water.', ['photolithography']),
      say('ratna', 'It is a chemical industry. A chemical industry needs a supply chain. A supply chain needs 9 provinces to agree with each other for 10 years without fighting.'),
      say('bayu', 'Yes.'),
      say('ratna', '…You already knew all of that.'),
      say('bayu', 'I have known it since 2030. It was true when the problem was salt.'),
      say('bayu', 'It is the same problem. It has only stopped being about radios.'),
      say('anisa', 'How long will it take?'),
      say('bayu', 'Longer than I have left.'),
       say('anisa', 'That tells me how long you expect to live. It does not tell me how long the work takes.'),
      say('bayu', 'It is the honest one. Do you want the other one?'),
      say('anisa', 'No. Light the furnace.'),
    ],
    closing: [
      n('They chose a site at Cilegon: the sand, the water, and a road that had survived.'),
      say('dewi', 'First furnace run. 9 hours. The crucible cracked in the eighth hour.'),
      say('hendra', 'The second one held.'),
       say('anisa', 'It produced a crystal with the internal structure of a house brick.'),
      say('bayu', 'Write it down.'),
      say('anisa', 'With the date, yes. Everybody here says that, and nobody explains why.'),
      say('fajar', 'Ask me another time.'),
      n('9 provinces signed the agreement for that furnace. Not one of the people who signed it expected to live long enough to see what it made.'),
       n('They signed it anyway. Then they sent the first truck of sand to Cilegon.'),
    ],
  },
  {
    era: 8,
    year: 2068,
    title: 'A Path Nobody Chose',
    premise: 'The last thing to build is the thing that makes you unnecessary.',
    interlude:
      'Run the fab until it works, publish everything you learned, and hand the network to people who never asked your permission.',
     opening: [
       n('The year is 2068. They can finally make their own chips, even though the first ones are far worse than the old ones. The network can now belong to everyone, not just its founders.'),
       n('It failed 5 times. Each failure named a problem that an entire region had to solve before the next attempt was even possible.'),
      n('Purity. Growing the crystal. Making the masks. Handling the dopants. Dust.'),
      say('dewi', 'Dust. 23 years of chemistry, and we lost a whole year to dust.'),
      say('hendra', 'The room has to be cleaner than the operating theatre in Bogor. I keep saying that, and it keeps sounding like a joke.'),
      say('fajar', '3 good chips out of 400.'),
      say('bayu', 'That is enough.'),
      say('fajar', 'It is one bit wide, Pak Bayu. One. Anything we ever pulled out of a ruin would be embarrassed to sit next to it.'),
      say('fajar', 'We copied a dead one. MC14500B, printed on the package — Motorola, 1977. 16 instructions, one bit at a time.', ['one-bit-machine']),
      say('bayu', 'There is an Intel 8051 in the same drawer that is an entire computer on one chip. It is better than ours by every measure anybody can take.'),
      say('bayu', 'And tomorrow we can make another one.'),
      say('bayu', 'Nothing in that drawer could ever do that. Not once. Not ever.'),
      n('Speed was never the point.'),
      n('15 provinces cannot be supplied out of a drawer. A network that runs on rationed scrap belongs to whoever controls the rations.'),
       n('A network that can sell chips can say no.'),
      say('ratna', 'Bandung asked again. About the exchange.'),
      say('bayu', 'Give it to them.'),
      say('ratna', 'And the standard?'),
      say('bayu', 'Publish it. All of it. The protocol, the frame format, the addressing, the furnace process, the failures.', ['open-standard', 'protocol']),
       say('ratna', 'The failures too.'),
      say('bayu', 'The failures especially. 23 years of them. Nobody should have to pay for those a second time.'),
      say('ratna', 'Then we stop being necessary.'),
      say('bayu', 'That was always the job.'),
       say('tajuddin', 'You understand what happens when everyone can build this.'),
      say('bayu', 'Tell me anyway.'),
      say('tajuddin', 'For 30 years I guarded things because we were the only people who had them.'),
       say('tajuddin', 'You are about to make the network not worth stealing. I have spent 30 years waiting to see that.'),
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
       n('Knowing how to make a thing was not enough. Now they could make one.'),
       n('It took 41 years.'),
       n('The man who understood it best did not live to see the end of it. He would have told you that this is normal.'),
    ],
  },
]
