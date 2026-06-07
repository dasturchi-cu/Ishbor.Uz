import {
  Freelancer,
  Client,
  Service,
  Project,
  Order,
  Conversation,
  Message,
  Review,
  Transaction,
} from './types';

const uzbekCities = ['Toshkent', 'Samarqand', 'Buxoro', 'Xiva', 'Andijon', 'Namangan', 'Qo\'qon', 'Margilan'];

const uzbekNames = {
  freelancer: [
    { name: 'Alisher Umarov', title: 'UI/UX Designer' },
    { name: 'Dilshoda Azimova', title: 'Web Developer' },
    { name: 'Shaxzod Rasulev', title: 'Mobile Developer' },
    { name: 'Gulnoza Xalilova', title: 'Graphic Designer' },
    { name: 'Javlon Ibrohimov', title: 'Backend Developer' },
    { name: 'Zarina Karimova', title: 'Product Manager' },
    { name: 'Akmal Shodmonov', title: 'DevOps Engineer' },
    { name: 'Lola Abdullayeva', title: 'SEO Specialist' },
    { name: 'Qodir Qodirjonov', title: 'Video Editor' },
    { name: 'Mehriban Yuldasheva', title: 'Content Writer' },
  ],
  client: [
    'Startup Hub UZ',
    'Digital Agency Pro',
    'E-commerce Solutions',
    'Tech Innovations Ltd',
    'Media Group UZ',
  ],
};

const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function generateAvatar(name: string) {
  const initials = getInitials(name);
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`;
}

// MOCK FREELANCERS
export const mockFreelancers: Freelancer[] = [
  {
    id: 'f1',
    name: 'Alisher Umarov',
    email: 'alisher@example.com',
    avatar: generateAvatar('Alisher Umarov'),
    bio: 'Creative UI/UX designer with 5+ years of experience. Specialized in mobile apps and web design.',
    title: 'UI/UX Designer',
    verified: true,
    onlineStatus: 'online',
    rating: 4.9,
    totalReviews: 156,
    responseTime: '< 1 hour',
    orderCount: 487,
    completedCount: 485,
    skills: [
      { id: 's1', name: 'UI Design', verified: true, level: 'expert' },
      { id: 's2', name: 'UX Research', verified: true, level: 'advanced' },
      { id: 's3', name: 'Figma', verified: true, level: 'expert' },
      { id: 's4', name: 'Prototyping', verified: false, level: 'advanced' },
    ],
    city: 'Toshkent',
    country: 'Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    experince: '5+ years',
    portfolioImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    ],
    videos: [
      { id: 'v1', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Design Process', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    ],
    testsPassed: [
      { id: 'test1', name: 'UI Design Fundamentals', score: 98, date: '2024-01-15' },
    ],
    socialLinks: {
      telegram: '@alisher_design',
      portfolio: 'alisher-portfolio.com',
    },
  },
  {
    id: 'f2',
    name: 'Dilshoda Azimova',
    email: 'dilshoda@example.com',
    avatar: generateAvatar('Dilshoda Azimova'),
    bio: 'Full-stack web developer. React specialist with expertise in Next.js and TypeScript.',
    title: 'Web Developer',
    verified: true,
    onlineStatus: 'online',
    rating: 4.8,
    totalReviews: 203,
    responseTime: '< 2 hours',
    orderCount: 342,
    completedCount: 340,
    skills: [
      { id: 's5', name: 'React', verified: true, level: 'expert' },
      { id: 's6', name: 'Next.js', verified: true, level: 'expert' },
      { id: 's7', name: 'TypeScript', verified: true, level: 'advanced' },
      { id: 's8', name: 'Node.js', verified: false, level: 'advanced' },
    ],
    city: 'Samarqand',
    country: 'Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    experince: '4+ years',
    portfolioImages: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
    ],
    videos: [],
    testsPassed: [
      { id: 'test2', name: 'React Advanced', score: 95, date: '2024-02-10' },
      { id: 'test3', name: 'TypeScript Mastery', score: 92, date: '2024-02-05' },
    ],
    socialLinks: {},
  },
  {
    id: 'f3',
    name: 'Shaxzod Rasulev',
    email: 'shaxzod@example.com',
    avatar: generateAvatar('Shaxzod Rasulev'),
    bio: 'Mobile app developer specializing in iOS and Android. Native development expert.',
    title: 'Mobile Developer',
    verified: true,
    onlineStatus: 'away',
    rating: 4.7,
    totalReviews: 89,
    responseTime: '< 4 hours',
    orderCount: 156,
    completedCount: 154,
    skills: [
      { id: 's9', name: 'iOS Development', verified: true, level: 'expert' },
      { id: 's10', name: 'Swift', verified: true, level: 'advanced' },
      { id: 's11', name: 'Android', verified: false, level: 'intermediate' },
    ],
    city: 'Toshkent',
    country: 'Uzbekistan',
    languages: ['Uzbek', 'Russian'],
    experince: '6+ years',
    portfolioImages: [],
    videos: [],
    testsPassed: [],
    socialLinks: {
      telegram: '@shaxzod_dev',
    },
  },
  {
    id: 'f4',
    name: 'Gulnoza Xalilova',
    email: 'gulnoza@example.com',
    avatar: generateAvatar('Gulnoza Xalilova'),
    bio: 'Graphic designer with expertise in branding, illustration, and print design.',
    title: 'Graphic Designer',
    verified: true,
    onlineStatus: 'online',
    rating: 4.6,
    totalReviews: 234,
    responseTime: '< 3 hours',
    orderCount: 445,
    completedCount: 443,
    skills: [
      { id: 's12', name: 'Adobe Creative Suite', verified: true, level: 'expert' },
      { id: 's13', name: 'Branding', verified: true, level: 'advanced' },
      { id: 's14', name: 'Illustration', verified: false, level: 'advanced' },
    ],
    city: 'Buxoro',
    country: 'Uzbekistan',
    languages: ['Uzbek', 'Russian', 'English'],
    experince: '7+ years',
    portfolioImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    ],
    videos: [],
    testsPassed: [],
    socialLinks: {
      instagram: '@gulnoza_design',
    },
  },
];

// MOCK CLIENTS
export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Startup Hub UZ',
    email: 'contact@startuphub.uz',
    avatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=StartupHub',
    bio: 'Leading startup accelerator in Central Asia',
    company: 'Startup Hub',
    verified: true,
    totalSpent: 45000000, // som
    activeProjects: 8,
    completedProjects: 24,
    rating: 4.8,
    totalReviews: 48,
    city: 'Toshkent',
  },
  {
    id: 'c2',
    name: 'Digital Agency Pro',
    email: 'hello@digitalagency.uz',
    avatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=DigitalAgency',
    verified: true,
    totalSpent: 62000000,
    activeProjects: 12,
    completedProjects: 67,
    rating: 4.9,
    totalReviews: 85,
    city: 'Toshkent',
  },
];

// MOCK SERVICES
export const mockServices: Service[] = [
  {
    id: 'srv1',
    freelancerId: 'f1',
    freelancerName: 'Alisher Umarov',
    freelancerAvatar: generateAvatar('Alisher Umarov'),
    verified: true,
    title: 'Professional UI/UX Design for Mobile Apps',
    description: 'I will create stunning UI/UX designs for your mobile application. Includes wireframes, prototypes, and high-fidelity mockups.',
    category: 'Design',
    subCategory: 'UI/UX Design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop',
    images: [],
    video: {
      id: 'vid1',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Portfolio Walkthrough',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    },
    price: 2500000, // som
    deliveryDays: 5,
    rating: 4.9,
    totalReviews: 156,
    orderCount: 487,
    tags: ['UI Design', 'UX Research', 'Figma', 'Mobile'],
    hasVideoPortfolio: true,
  },
  {
    id: 'srv2',
    freelancerId: 'f2',
    freelancerName: 'Dilshoda Azimova',
    freelancerAvatar: generateAvatar('Dilshoda Azimova'),
    verified: true,
    title: 'Build Modern React & Next.js Web Application',
    description: 'Expert in creating modern, responsive web applications using React and Next.js. Full stack development with TypeScript.',
    category: 'Programming',
    subCategory: 'Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    images: [],
    price: 3500000,
    deliveryDays: 10,
    rating: 4.8,
    totalReviews: 203,
    orderCount: 342,
    tags: ['React', 'Next.js', 'TypeScript', 'Web'],
    hasVideoPortfolio: false,
  },
  {
    id: 'srv3',
    freelancerId: 'f4',
    freelancerName: 'Gulnoza Xalilova',
    freelancerAvatar: generateAvatar('Gulnoza Xalilova'),
    verified: true,
    title: 'Creative Logo & Branding Design',
    description: 'Professional logo design and complete branding package including brand guidelines and style sheets.',
    category: 'Design',
    subCategory: 'Logo Design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop',
    images: [],
    price: 1500000,
    deliveryDays: 3,
    rating: 4.6,
    totalReviews: 234,
    orderCount: 445,
    tags: ['Logo', 'Branding', 'Design', 'Adobe'],
    hasVideoPortfolio: false,
  },
];

// MOCK PROJECTS
export const mockProjects: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    title: 'Design e-commerce platform interface',
    description: 'Need modern UI/UX design for a new e-commerce platform targeting Central Asia.',
    category: 'Design',
    skills: ['UI Design', 'UX Research', 'Figma'],
    budget: 5000000,
    budgetType: 'fixed',
    deadline: '2024-06-30',
    status: 'open',
    level: 'advanced',
    city: 'Toshkent',
    bids: 24,
    createdAt: '2024-06-01',
  },
  {
    id: 'p2',
    clientId: 'c2',
    title: 'Develop React dashboard application',
    description: 'Building a comprehensive analytics dashboard with real-time data visualization.',
    category: 'Programming',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js'],
    budget: 8500000,
    budgetType: 'fixed',
    deadline: '2024-07-15',
    status: 'open',
    level: 'advanced',
    city: 'Toshkent',
    bids: 18,
    createdAt: '2024-06-02',
  },
];

// MOCK ORDERS
export const mockOrders: Order[] = [
  {
    id: 'ord1',
    serviceId: 'srv1',
    freelancerId: 'f1',
    clientId: 'c1',
    title: 'UI/UX Design for Mobile App',
    price: 2500000,
    status: 'active',
    startDate: '2024-06-01',
    deadline: '2024-06-06',
    escrowAmount: 2500000,
    freelancerName: 'Alisher Umarov',
    clientName: 'Startup Hub UZ',
    freelancerAvatar: generateAvatar('Alisher Umarov'),
    clientAvatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=StartupHub',
  },
  {
    id: 'ord2',
    serviceId: 'srv2',
    freelancerId: 'f2',
    clientId: 'c2',
    title: 'React Dashboard Development',
    price: 3500000,
    status: 'active',
    startDate: '2024-06-03',
    deadline: '2024-06-13',
    escrowAmount: 3500000,
    freelancerName: 'Dilshoda Azimova',
    clientName: 'Digital Agency Pro',
    freelancerAvatar: generateAvatar('Dilshoda Azimova'),
    clientAvatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=DigitalAgency',
  },
];

// MOCK CONVERSATIONS
export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participantIds: ['f1', 'c1'],
    participantNames: ['Alisher Umarov', 'Startup Hub UZ'],
    participantAvatars: [generateAvatar('Alisher Umarov'), 'https://api.dicebear.com/7.x/corporate/svg?seed=StartupHub'],
    lastMessage: 'Great! I will have the designs ready by tomorrow.',
    lastMessageTime: '2024-06-04 14:30',
    unreadCount: 0,
    activeOrder: mockOrders[0],
  },
  {
    id: 'conv2',
    participantIds: ['f2', 'c2'],
    participantNames: ['Dilshoda Azimova', 'Digital Agency Pro'],
    participantAvatars: [generateAvatar('Dilshoda Azimova'), 'https://api.dicebear.com/7.x/corporate/svg?seed=DigitalAgency'],
    lastMessage: 'The dashboard is almost complete. Need clarification on the export feature.',
    lastMessageTime: '2024-06-04 11:15',
    unreadCount: 1,
    activeOrder: mockOrders[1],
  },
];

// MOCK MESSAGES
export const mockMessages: Message[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderId: 'c1',
    senderName: 'Startup Hub UZ',
    senderAvatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=StartupHub',
    content: 'Hello, I need UI/UX design for our mobile app. Can you help?',
    timestamp: '2024-06-04 10:00',
    read: true,
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderId: 'f1',
    senderName: 'Alisher Umarov',
    senderAvatar: generateAvatar('Alisher Umarov'),
    content: 'Of course! I would love to work on your project. Let me check the requirements.',
    timestamp: '2024-06-04 10:05',
    read: true,
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    senderId: 'f1',
    senderName: 'Alisher Umarov',
    senderAvatar: generateAvatar('Alisher Umarov'),
    content: 'Great! I will have the designs ready by tomorrow.',
    timestamp: '2024-06-04 14:30',
    read: true,
  },
];

// MOCK REVIEWS
export const mockReviews: Review[] = [
  {
    id: 'rev1',
    serviceId: 'srv1',
    reviewerId: 'c1',
    reviewerName: 'Startup Hub UZ',
    reviewerAvatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=StartupHub',
    rating: 5,
    title: 'Exceptional Design Work',
    content: 'Alisher delivered outstanding UI/UX designs. Professional, creative, and exactly what we needed.',
    date: '2024-05-28',
    helpful: 12,
  },
  {
    id: 'rev2',
    serviceId: 'srv2',
    reviewerId: 'c2',
    reviewerName: 'Digital Agency Pro',
    reviewerAvatar: 'https://api.dicebear.com/7.x/corporate/svg?seed=DigitalAgency',
    rating: 5,
    title: 'Excellent Developer',
    content: 'Dilshoda is highly skilled and professional. Great communication and fast delivery.',
    date: '2024-05-20',
    helpful: 8,
  },
];

// MOCK TRANSACTIONS
export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    userId: 'f1',
    type: 'income',
    amount: 2500000,
    description: 'Payment for UI/UX Design Service',
    date: '2024-06-04',
    status: 'completed',
    orderId: 'ord1',
  },
  {
    id: 'tx2',
    userId: 'f1',
    type: 'withdraw',
    amount: 1500000,
    description: 'Withdrawal to bank account',
    date: '2024-06-03',
    status: 'completed',
  },
  {
    id: 'tx3',
    userId: 'f1',
    type: 'income',
    amount: 1800000,
    description: 'Payment for Logo Design',
    date: '2024-06-01',
    status: 'completed',
  },
];
