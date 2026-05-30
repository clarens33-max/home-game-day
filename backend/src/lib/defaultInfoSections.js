/**
 * Default info pack sections copied into every new game (or league blueprint).
 * AUTO_TEAMS and AUTO_SCHEDULE sections are rendered dynamically from game data.
 */
const DEFAULT_INFO_SECTIONS = [
  {
    title: 'Welcome',
    sectionType: null,
    content: `Welcome to our roller derby home game! We're so excited to have you here — whether you're a long-time fan or completely new to the sport, we hope you have an incredible time.

Roller derby is a full-contact sport played on an oval flat track. Two teams of five skaters compete at a time, and the action is fast, physical, and absolutely thrilling.

If you have any questions during the event, look out for our volunteers in high-vis vests who will be happy to help. Enjoy the game!`,
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
    content: `Each bout consists of two 30-minute periods with a short half-time break.

Play is divided into "jams" — each lasting up to 2 minutes. At the start of each jam, blockers from both teams form a pack, and jammers (wearing the star helmet covers) start behind them. The jammer who breaks through the pack first becomes "Lead Jammer" and can end the jam early by placing their hands on their hips.

Points are scored each time the jammer laps a member of the opposing team. The team with the most points at the end of the second period wins.

No experience needed to follow the action — just cheer for your team!`,
    order: 2,
  },
  {
    title: 'Officials',
    sectionType: null,
    content: `Our bouts are officiated by a team of trained skating officials (referees) and non-skating officials (NSOs).

Referees track penalties and points on track. NSOs handle timing, scorekeeping, penalty tracking, and lineup management from the bench and tables.

All officials have completed recognised training and follow WFTDA officiating standards. If you see them making calls, please respect their decisions — they're working hard to keep the game fair and safe for everyone.`,
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
    content: `We encourage everyone to use public transport where possible as parking near the venue can be limited.

Please check the venue details for the nearest bus stops, train stations, and any parking information. Allow extra time if you're travelling on the day — doors open before the first bout and we'd love you to be settled before the action starts!`,
    order: 5,
  },
  {
    title: 'Venue',
    sectionType: null,
    content: `The venue has step-free access and accessible toilets available. If you have any accessibility requirements or questions, please contact us in advance and we'll do our best to accommodate you.

Photography for personal use is welcome, but please be mindful of other spectators. Flash photography and video recording for commercial use requires prior permission.

Please keep all spectating areas clear of the track at all times for the safety of skaters and officials.`,
    order: 6,
  },
  {
    title: 'Food & Drink',
    sectionType: null,
    content: `There will be refreshments available on the day including soft drinks, hot drinks, and snacks. Please check for any announcements about a bar or catering on the day.

If you have any dietary requirements or allergies, please check with venue staff before purchasing food or drink.`,
    order: 7,
  },
]

module.exports = { DEFAULT_INFO_SECTIONS }
