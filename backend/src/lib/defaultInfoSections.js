/**
 * Default info pack sections copied into every new game (or league blueprint).
 * AUTO_TEAMS and AUTO_SCHEDULE sections are rendered dynamically from game data.
 * Location-specific details use [PLACEHOLDER] format for organisers to fill in.
 */
const DEFAULT_INFO_SECTIONS = [
  {
    title: 'Welcome',
    sectionType: null,
    content: `Welcome to our roller derby home game! We are so excited to have you here today — whether you are a seasoned derby fan or completely new to the sport, we hope you have an incredible time.

Roller derby is a full-contact sport played on a flat oval track. Two teams of five skaters compete at a time: four blockers and one jammer (identified by the star on their helmet cover). The jammer scores points by lapping members of the opposing team, while the blockers work together to stop the opposing jammer and help their own jammer through.

It is fast, physical, skilful, and absolutely thrilling — and we think once you have watched your first jam, you will be hooked.

If you have any questions during the event, please look out for our volunteers who will be happy to help. We ask all spectators to stay behind the safety boundary at all times and to respect the track, the skaters, and each other.

Thank you for supporting roller derby. Enjoy the game!`,
    order: 0,
  },
  {
    title: 'Teams',
    sectionType: 'AUTO_TEAMS',
    content: '',
    order: 1,
  },
  {
    title: 'Bout Format',
    sectionType: null,
    content: `Each bout is divided into two 30-minute periods with a short half-time break.

Play is organised into "jams" — each lasting up to two minutes. At the start of each jam, four blockers from each team form a pack and skate around the track together. Behind them, the two jammers line up and attempt to fight their way through the pack. The first jammer to break through legally becomes the Lead Jammer — they earn that status and can end the jam early by placing both hands on their hips.

Points are scored each time a jammer legally laps a member of the opposing team. One point per opposing skater passed, up to four points per scoring pass.

Skaters can be sent to the penalty box for illegal blocks, back blocks, cutting the track, or other rule violations. A skater in the box temporarily leaves their team shorthanded.

The team with the most points at the end of the second period wins the bout. In the event of a tie, the result stands as a draw.

No prior knowledge is needed to enjoy the action — just cheer loudly and have fun!`,
    order: 2,
  },
  {
    title: 'Officials',
    sectionType: null,
    content: `Our bouts are officiated by a dedicated team of trained volunteers — both skating and non-skating officials.

SKATING OFFICIALS (REFEREES)
Referees skate on and around the track throughout each jam. They track legal and illegal gameplay, call penalties, and signal points scored by jammers. The Head Referee has final say on all on-track decisions.

NON-SKATING OFFICIALS (NSOs)
NSOs operate from the bench areas and officials' tables. Their roles include:
- Scorekeeping and scoreboard operation
- Jam timing and period timing
- Penalty tracking and box timing
- Lineup management and skater tracking

All officials are trained volunteers who follow WFTDA (Women's Flat Track Derby Association) officiating standards. Officiating decisions are final — please be respectful of all officials throughout the event.

If you are interested in becoming an official yourself, speak to one of our team — new officials are always welcome!`,
    order: 3,
  },
  {
    title: 'Schedule',
    sectionType: 'AUTO_SCHEDULE',
    content: '',
    order: 4,
  },
  {
    title: 'Getting Here',
    sectionType: null,
    content: `VENUE
[VENUE NAME]
[VENUE ADDRESS]

BY PUBLIC TRANSPORT
We strongly encourage travelling by public transport where possible as parking near the venue can be limited on event days.

[NEAREST TRAIN STATION] is the closest train station, approximately [X minutes] walk from the venue. Regular services run from [CITY CENTRE / MAIN INTERCHANGE].

Several bus routes stop nearby — check [LOCAL TRANSPORT APP/WEBSITE] for up-to-date timetables and routes.

BY CAR
If you are driving, [PARKING INFORMATION — e.g. "there is a pay-and-display car park on [STREET NAME], approximately 5 minutes walk from the venue"]. Please allow extra time as spaces can fill up on event days.

[POSTCODE FOR SATNAV: XXXX XXX]

CYCLING
Bike parking is available [at/near] the venue. [Add specific details if known.]

Please allow plenty of time for your journey and aim to arrive before doors open — the first bout will start promptly!`,
    order: 5,
  },
  {
    title: 'Venue',
    sectionType: null,
    content: `ACCESSIBILITY
[VENUE NAME] has step-free access [describe access — e.g. "via the main entrance on [STREET NAME]"]. Accessible toilets are available [location within venue]. If you have any specific accessibility requirements or questions ahead of the event, please contact us at [CONTACT EMAIL] and we will do our best to accommodate you.

TOILETS
Toilets are located [LOCATION IN VENUE]. Please follow any signage on the day.

CLOAKROOM / BAGS
[Add cloakroom information if available, or note that there is no cloakroom and bags should be kept with you.]

PHOTOGRAPHY
Photography for personal use is welcome throughout the event. We ask that you do not use flash photography near the track as this can distract skaters and officials.

Commercial photography or video recording requires prior permission from the organising team. Please speak to a member of staff if you have a press pass or media request.

SAFETY
Please keep behind the safety boundary tape at all times. Children must be supervised by an adult. The track area and bench areas are strictly for skaters, officials, and authorised personnel only.

In an emergency, please follow instructions from venue staff and our volunteers.`,
    order: 6,
  },
  {
    title: 'Food & Drink',
    sectionType: null,
    content: `[BAR / REFRESHMENTS]
[VENUE NAME] has a [bar / café / canteen] on site serving [soft drinks, hot drinks, beer, wine, and snacks — amend as appropriate]. [Card payments are / Cash only is] accepted.

[If there is a community fundraising stall, add details here — e.g. "Our volunteers will also be running a bake sale and merchandise stall in support of the league."]

HALF-TIME RAFFLE
We run a raffle during half-time with some brilliant prizes. Tickets will be on sale from [TIME / "doors open" / "the merchandise table"]. All proceeds go directly to supporting the league.

ALLERGIES & DIETARY REQUIREMENTS
If you have any allergies or dietary requirements, please check with venue staff before purchasing any food or drink.

MERCHANDISE
[LEAGUE NAME] merchandise will be available to purchase at the event. [Add details of what is available — hoodies, t-shirts, pins, programmes, etc.]`,
    order: 7,
  },
]

module.exports = { DEFAULT_INFO_SECTIONS }
