module.exports = {
  profiles: [
    { id: 1, initials: 'AK', name: 'Anika Kapoor', role: 'UI/UX Designer', college: 'IIT Delhi', year: 'Year 3', idea: 'Want to build an accessible learning tool', skills: ['Figma', 'React', 'CSS'], lookingFor: ['Frontend Dev', 'Backend Dev'], availability: ['Mon', 'Wed', 'Fri'], matchPct: 92, hackathonsCount: 3, daysAgo: 2, avatarBg: '#EAE7FE', avatarColor: '#4F35F3' },
    { id: 2, initials: 'RS', name: 'Rahul Singh', role: 'Backend Dev', college: 'BITS Pilani', year: 'Year 4', idea: 'Smart canteen queue system', skills: ['Node.js', 'Express', 'MongoDB'], lookingFor: ['Frontend Dev', 'UI/UX'], availability: ['Sat', 'Sun'], matchPct: 88, hackathonsCount: 5, daysAgo: 1, avatarBg: 'rgba(0,212,168,0.12)', avatarColor: '#00D4A8' },
    { id: 3, initials: 'PV', name: 'Priya Verma', role: 'ML / AI Engineer', college: 'NIT Trichy', year: 'Year 2', idea: '', skills: ['Python', 'TensorFlow', 'Pandas'], lookingFor: ['Backend Dev', 'Full Stack'], availability: ['Tue', 'Thu', 'Sat'], matchPct: 75, hackathonsCount: 1, daysAgo: 5, avatarBg: 'rgba(255,179,71,0.12)', avatarColor: '#FFB347' },
    { id: 4, initials: 'AM', name: 'Aryan Modi', role: 'Frontend Dev', college: 'VIT', year: 'Year 3', idea: 'Mental health tracker', skills: ['React', 'Tailwind', 'Next.js'], lookingFor: ['Backend Dev', 'UI/UX'], availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], matchPct: 65, hackathonsCount: 2, daysAgo: 3, avatarBg: 'rgba(255,107,107,0.10)', avatarColor: '#FF6B6B' },
    { id: 5, initials: 'SG', name: 'Sneha Gupta', role: 'DevOps', college: 'Manipal', year: 'Year 4', idea: '', skills: ['Docker', 'AWS', 'Linux'], lookingFor: ['Full Stack', 'Backend Dev'], availability: ['Sat', 'Sun'], matchPct: 95, hackathonsCount: 6, daysAgo: 0, avatarBg: '#EAE7FE', avatarColor: '#4F35F3' }
  ],
  ideas: [
    { id: 101, title: 'AI Study Planner', domain: 'EdTech', problem: 'Students struggle to manage time efficiently.', solution: 'An AI that adapts to their learning pace and deadlines.', hackathon: 'CodeStorm', skillsNeeded: ['Frontend Dev', 'ML / AI Engineer', 'Backend Dev'], poster: { name: 'Karan Mehta', avatar: 'KM', daysAgo: 2 }, closesIn: 5, likes: 24 },
    { id: 102, title: 'Smart Canteen', domain: 'FinTech', problem: 'Long queues in college canteens during breaks.', solution: 'Pre-order and split bills easily via a campus wallet app.', hackathon: 'SmartHack', skillsNeeded: ['UI/UX Designer', 'Frontend Dev'], poster: { name: 'Rahul Singh', avatar: 'RS', daysAgo: 1 }, closesIn: 2, likes: 45 },
    { id: 103, title: 'Mental Health Tracker', domain: 'HealthTech', problem: 'People feel isolated without anonymous support.', solution: 'A safe, AI-moderated peer support network.', hackathon: 'BuildIt', skillsNeeded: ['Backend Dev', 'DevOps'], poster: { name: 'Aryan Modi', avatar: 'AM', daysAgo: 3 }, closesIn: 14, likes: 12 },
    { id: 104, title: 'AR Campus Tour', domain: 'AR/VR', problem: 'Freshers get lost on large campuses.', solution: 'AR navigation for campus buildings and classrooms.', hackathon: 'HackFest 2025', skillsNeeded: ['Frontend Dev', 'UI/UX Designer', 'Unity Dev'], poster: { name: 'Neha Sharma', avatar: 'NS', daysAgo: 4 }, closesIn: 10, likes: 38 },
  ],
  team: {
    name: 'ByteCrafters',
    hackathon: 'HackFest 2025',
    daysLeft: 3,
    members: [
      { id: 10, initials: 'AK', name: 'Anika Kapoor', role: 'UI/UX Designer', college: 'IIT Delhi', skills: ['Figma', 'React', 'CSS'], status: 'Captain 👑' },
      { id: 2, initials: 'RS', name: 'Rahul Singh', role: 'Backend Dev', college: 'BITS Pilani', skills: ['Node.js', 'Express'], status: '✓ Confirmed' },
      { id: 11, initials: 'MK', name: 'Mohit Kumar', role: 'Frontend Dev', college: 'NSUT', skills: ['React', 'Vue', 'HTML/CSS'], status: '⏳ Pending' }
    ]
  },
  notifications: [
    { id: 1, type: 'match', message: "It's a match!", sub: 'You and Karan Mehta both liked each other.', timestamp: '10m ago', read: false },
    { id: 2, type: 'message', message: 'Rahul Singh sent you a message:', sub: '"Are you free this weekend?"', timestamp: '1h ago', read: false },
    { id: 3, type: 'team', message: 'Priya Verma accepted your team invite.', sub: 'Your team is growing!', timestamp: '2h ago', read: true },
    { id: 4, type: 'idea', message: 'Someone liked your idea "AI Study Planner".', sub: 'You now have 24 likes.', timestamp: '5h ago', read: true },
    { id: 5, type: 'system', message: 'HackFest 2025 registration closes in 3 days!', sub: 'Complete your team setup soon.', timestamp: '1d ago', read: true }
  ],
  conversations: [
    { id: 201, partner: { id: 2, name: 'Rahul Singh', initials: 'RS', status: '● Online' }, lastMessage: '', timestamp: '', unread: 0, type: 'match' },
    { id: 202, partner: { id: 15, name: 'Karan Mehta', initials: 'KM', status: 'Last seen 2h ago' }, lastMessage: '', timestamp: '', unread: 0, type: 'team' }
  ],
  messages: {},
  adminStats: {
    totalUsers: 847, newUsersTrend: '↑ 12%',
    matchesMade: 234, matchesTrend: '↑ 5%',
    teamsFormed: 67, teamsTrend: '↑ 8%',
    ideasPosted: 128, ideasTrend: '↑ 3%'
  },
  adminUsers: [
    { id: 1, name: 'Anika Kapoor', email: 'anika@example.com', role: 'UI/UX', college: 'IIT Delhi', matches: 12, status: 'Active' },
    { id: 2, name: 'Rahul Singh', email: 'rahul@example.com', role: 'Backend', college: 'BITS Pilani', matches: 8, status: 'Active' },
    { id: 3, name: 'John Doe', email: 'john@example.com', role: 'ML', college: 'MIT', matches: 0, status: 'Pending' }
  ]
};
