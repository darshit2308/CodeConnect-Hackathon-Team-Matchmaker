const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Idea = require('../models/Idea');

const seededUsers = [
  {
    firstName: 'Rahul',
    lastName: 'Singh',
    email: 'rahul@example.com',
    password: 'Rahul@123',
    profile: {
      role: 'Backend Dev',
      college: 'BITS Pilani',
      year: 'Year 4',
      idea: 'Smart canteen queue system',
      skills: ['Node.js', 'Express', 'MongoDB'],
      lookingFor: ['Frontend Dev', 'UI/UX'],
      hackathonsCount: 5,
      matchPct: 88,
      avatarBg: 'rgba(0,212,168,0.12)',
      avatarColor: '#00D4A8'
    }
  },
  {
    firstName: 'Anika',
    lastName: 'Kapoor',
    email: 'anika@example.com',
    password: 'Anika@123',
    profile: {
      role: 'UI/UX Designer',
      college: 'IIT Delhi',
      year: 'Year 3',
      idea: 'Want to build an accessible learning tool',
      skills: ['Figma', 'React', 'CSS'],
      lookingFor: ['Frontend Dev', 'Backend Dev'],
      hackathonsCount: 3,
      matchPct: 92,
      avatarBg: '#EAE7FE',
      avatarColor: '#4F35F3'
    }
  },
  {
    firstName: 'Priya',
    lastName: 'Verma',
    email: 'priya@example.com',
    password: 'Priya@123',
    profile: {
      role: 'ML / AI Engineer',
      college: 'NIT Trichy',
      year: 'Year 2',
      skills: ['Python', 'TensorFlow', 'Pandas'],
      lookingFor: ['Backend Dev', 'Full Stack'],
      hackathonsCount: 1,
      matchPct: 75,
      avatarBg: 'rgba(255,179,71,0.12)',
      avatarColor: '#FFB347'
    }
  },
  {
    firstName: 'Karan',
    lastName: 'Mehta',
    email: 'karan@example.com',
    password: 'Karan@123',
    profile: {
      role: 'Full Stack Dev',
      college: 'Delhi University',
      year: 'Year 3',
      idea: 'AI Study Planner idea',
      skills: ['React', 'Node.js', 'Python', 'ML'],
      lookingFor: ['ML / AI Engineer', 'UI/UX Designer'],
      hackathonsCount: 4,
      matchPct: 85,
      avatarBg: 'rgba(255,71,87,0.12)',
      avatarColor: '#FF4757'
    }
  },
  {
    firstName: 'Aryan',
    lastName: 'Modi',
    email: 'aryan@example.com',
    password: 'Aryan@123',
    profile: {
      role: 'DevOps Engineer',
      college: 'VIT Vellore',
      year: 'Year 4',
      idea: 'Mental Health Tracker project',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Python'],
      lookingFor: ['Backend Dev', 'Frontend Dev'],
      hackathonsCount: 6,
      matchPct: 80,
      avatarBg: 'rgba(106,17,203,0.12)',
      avatarColor: '#6A11CB'
    }
  },
  {
    firstName: 'Neha',
    lastName: 'Patel',
    email: 'neha@example.com',
    password: 'Neha@123',
    profile: {
      role: 'Frontend Dev',
      college: 'IGIT',
      year: 'Year 2',
      idea: 'Web Design enthusiast',
      skills: ['React', 'Vue.js', 'Tailwind CSS', 'JavaScript'],
      lookingFor: ['Backend Dev', 'Full Stack'],
      hackathonsCount: 2,
      matchPct: 87,
      avatarBg: 'rgba(0,255,127,0.12)',
      avatarColor: '#00FF7F'
    }
  }
];

const initialsFromName = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const seedDatabase = async () => {
  let seededCount = 0;
  const createdUsers = {};

  // Create users and profiles (only if they don't exist)
  for (const entry of seededUsers) {
    let user = await User.findOne({ email: entry.email });
    if (!user) {
      user = await User.create({
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
        password: entry.password
      });
      seededCount++;
    }
    createdUsers[entry.firstName] = user;

    const fullName = `${entry.firstName} ${entry.lastName}`;
    const existingProfile = await UserProfile.findOne({ user: user._id });
    if (!existingProfile) {
      await UserProfile.create({
        user: user._id,
        name: fullName,
        initials: initialsFromName(fullName),
        isSeed: true,
        ...entry.profile
      });
    }
  }

  // Create seeded ideas with posterUser (only if no ideas exist at all)
  const ideaCount = await Idea.countDocuments();
  if (ideaCount === 0) {
    const ideas = [
      {
        title: 'AI Study Planner',
        domain: 'EdTech',
        problem: 'Students struggle to manage time efficiently.',
        solution: 'An AI that adapts to their learning pace and deadlines.',
        hackathon: 'CodeStorm',
        skillsNeeded: ['Frontend Dev', 'ML / AI Engineer', 'Backend Dev'],
        closesIn: 5,
        likes: 24,
        posterName: 'Karan Mehta',
        posterAvatar: 'KM',
        posterUser: createdUsers['Karan'] ? createdUsers['Karan']._id : null
      },
      {
        title: 'Smart Canteen',
        domain: 'FinTech',
        problem: 'Long queues in college canteens during breaks.',
        solution: 'Pre-order and split bills easily via a campus wallet app.',
        hackathon: 'SmartHack',
        skillsNeeded: ['UI/UX Designer', 'Frontend Dev'],
        closesIn: 2,
        likes: 45,
        posterName: 'Rahul Singh',
        posterAvatar: 'RS',
        posterUser: createdUsers['Rahul'] ? createdUsers['Rahul']._id : null
      },
      {
        title: 'Mental Health Tracker',
        domain: 'HealthTech',
        problem: 'People feel isolated without anonymous support.',
        solution: 'A safe, AI-moderated peer support network.',
        hackathon: 'BuildIt',
        skillsNeeded: ['Backend Dev', 'DevOps'],
        closesIn: 14,
        likes: 12,
        posterName: 'Aryan Modi',
        posterAvatar: 'AM',
        posterUser: createdUsers['Aryan'] ? createdUsers['Aryan']._id : null
      },
      {
        title: 'Accessibility Learning Tool',
        domain: 'EdTech',
        problem: 'Disabled students lack accessible learning platforms.',
        solution: 'A fully accessible learning management system.',
        hackathon: 'InclusiveHack',
        skillsNeeded: ['Frontend Dev', 'UI/UX Designer', 'Backend Dev'],
        closesIn: 7,
        likes: 18,
        posterName: 'Anika Kapoor',
        posterAvatar: 'AK',
        posterUser: createdUsers['Anika'] ? createdUsers['Anika']._id : null
      }
    ];

    await Idea.insertMany(ideas.filter((i) => i.posterUser));
    console.log(`  Seeded ${ideas.length} ideas`);
  }

  if (seededCount > 0) {
    console.log(`  Seeded ${seededCount} new users`);
  } else {
    console.log('  Database already has seed data, skipping...');
  }
};

module.exports = seedDatabase;
