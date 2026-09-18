/**
 * Useme Team - Events Seed Generator (120 records with crew assignments & venue conflicts)
 */
(function(exports) {
  const { rInt, pick, pickMultiple, REF_DATE, addDays, formatDate } = (typeof require !== 'undefined') ? require('./seed-config').SeedConfig : window.SeedConfig;

  const VENUES = [
    'Grand Horizon Convention Hall A',
    'Innovation Hub Auditorium, Bangalore',
    'Pragati Maidan Hall 5, New Delhi',
    'Jio World Convention Centre, Mumbai',
    'HITEX Exhibition Centre, Hyderabad',
    'Auto Cluster Exhibition Centre, Pune',
    'Chennai Trade Centre Hall 2',
    'Biswa Bangla Convention Centre, Kolkata',
    'Gujarat University Convention Hall, Ahmedabad',
    'Lulu Bolgatty International Convention Centre, Kochi',
    'HQ 4th Floor Tech Lab & Broadcast Suite',
    'The Leela Palace Ballroom, Bangalore'
  ];

  const EVENT_NAMES = [
    'Useme Annual Leadership Summit 2026',
    'Q3 Product Growth Showcase',
    'Regional Tech Expo & Booth Demo',
    'Internal Hackathon: AI Productivity',
    'National Direct Selling Merchant Convention',
    'All-India Payment Aggregators Roundtable',
    'Fintech Security & RBI Compliance Forum',
    'Tier-2 Merchant Digital Empowerment Workshop',
    'Soundbox Hardware Innovation Showcase',
    'Distributor Gala & Gold Crown Awards',
    'South Zone Merchant Onboarding Blitz',
    'West Zone Enterprise Merchant Summit',
    'North Zone Digital Commerce Conclave',
    'East Zone Direct Distributors Symposium',
    'Cybersecurity & AML Anti-Fraud Masterclass',
    'UX Design Sprint & Mobile Demo Jam',
    'Cross-Border Remittance & Webhook Symposium',
    'Automated Settlements & Escrow Summit',
    'Startup Accelerator Demo Day',
    'State Payouts & Taxation Tech Conference'
  ];

  const CREW_ROLES = [
    'Executive Host', 'Lead Organizer', 'Stage & Branding Designer', 'Tech Coordinator (AV & Broadcast Relay)',
    'Live Demo Presenter', 'Collateral Coordinator', 'Booth In-Charge', 'Outreach Specialist',
    'Registration Desk Lead', 'Q&A Moderator', 'Logistics Lead'
  ];

  function generateEvents(members) {
    const events = [];
    const memberIds = members.map(m => m.id);

    // Initial 4 events matching existing mock-data (includes the e1/e3 conflict at Grand Horizon on 2026-09-15)
    const initialEvents = [
      { id: 'e1', name: EVENT_NAMES[0], description: 'Company-wide strategy alignment, technical relays, and annual award ceremony.', venue: 'Grand Horizon Convention Hall A', eventDate: '2026-09-15', status: 'upcoming', members: [{ memberId: 'm1', roleAtEvent: 'Executive Host' }, { memberId: 'm3', roleAtEvent: 'Lead Organizer' }, { memberId: 'm5', roleAtEvent: 'Tech Coordinator (AV & Broadcast Relay)' }, { memberId: 'm9', roleAtEvent: 'Stage & Branding Designer' }], linkedTaskIds: [] },
      { id: 'e2', name: EVENT_NAMES[1], description: 'Demo day for cross-department milestone achievements and live architecture showcase.', venue: 'Innovation Hub Auditorium, Bangalore', eventDate: '2026-09-02', status: 'upcoming', members: [{ memberId: 'm3', roleAtEvent: 'Host & Speaker' }, { memberId: 'm5', roleAtEvent: 'Live Demo Presenter' }, { memberId: 'm10', roleAtEvent: 'Collateral Coordinator' }], linkedTaskIds: [] },
      { id: 'e3', name: EVENT_NAMES[2], description: 'External tech showcase and talent hiring booth.', venue: 'Grand Horizon Convention Hall A', eventDate: '2026-09-15', status: 'upcoming', members: [{ memberId: 'm2', roleAtEvent: 'Booth In-Charge' }, { memberId: 'm11', roleAtEvent: 'Outreach Specialist' }], linkedTaskIds: [] },
      { id: 'e4', name: EVENT_NAMES[3], description: '48-hour sprint building automated performance audit tools.', venue: 'HQ 4th Floor Tech Lab & Broadcast Suite', eventDate: '2026-08-10', status: 'completed', members: [{ memberId: 'm2', roleAtEvent: 'Judge' }, { memberId: 'm5', roleAtEvent: 'Participant' }, { memberId: 'm6', roleAtEvent: 'Participant' }], linkedTaskIds: [] }
    ];
    events.push(...initialEvents);

    // Intentional additional venue conflict pairs
    const intentionalConflicts = [
      { idA: 'e5', idB: 'e6', venue: 'Jio World Convention Centre, Mumbai', date: '2026-09-22', nameA: 'Maharashtra Merchant Conclave', nameB: 'Western Region Fintech Expo' },
      { idA: 'e7', idB: 'e8', venue: 'HITEX Exhibition Centre, Hyderabad', date: '2026-10-05', nameA: 'Telangana UPI Adoption Summit', nameB: 'Deccan Retail Tech Forum' },
      { idA: 'e9', idB: 'e10', venue: 'Pragati Maidan Hall 5, New Delhi', date: '2026-10-18', nameA: 'North India E-Commerce Summit', nameB: 'Digital India Payments Expo' }
    ];

    intentionalConflicts.forEach(conf => {
      [ { id: conf.idA, name: conf.nameA }, { id: conf.idB, name: conf.nameB } ].forEach(item => {
        const assignedCrew = pickMultiple(memberIds, rInt(2, 4)).map((mid, idx) => ({
          memberId: mid,
          roleAtEvent: CREW_ROLES[idx % CREW_ROLES.length]
        }));
        events.push({
          id: item.id,
          name: item.name,
          description: `Strategic gathering on ${conf.venue} exploring payment rails and partner networks.`,
          venue: conf.venue,
          eventDate: conf.date,
          status: 'upcoming',
          members: assignedCrew,
          linkedTaskIds: []
        });
      });
    });

    // Generate up to 120 events
    for (let i = 11; i <= 120; i++) {
      const baseName = pick(EVENT_NAMES);
      const name = `${baseName} (Chapter ${i})`;
      const venue = pick(VENUES);
      const dayOffset = rInt(-160, 60);
      const evDate = addDays(REF_DATE, dayOffset);
      const dateStr = formatDate(evDate);
      const status = dayOffset < 0 ? 'completed' : 'upcoming';

      const assignedCrew = pickMultiple(memberIds, rInt(2, 5)).map((mid, idx) => ({
        memberId: mid,
        roleAtEvent: CREW_ROLES[idx % CREW_ROLES.length]
      }));

      events.push({
        id: `e${i}`,
        name,
        description: `Corporate operational showcase and partner alignment event hosted at ${venue}.`,
        venue,
        eventDate: dateStr,
        status,
        members: assignedCrew,
        linkedTaskIds: []
      });
    }

    return events;
  }

  exports.SeedEvents = { generateEvents };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window = window || {}));
