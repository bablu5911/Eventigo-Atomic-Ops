const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Event = require('./models/Event');
const TicketType = require('./models/TicketType');
const PromoCode = require('./models/PromoCode');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const ChatMessage = require('./models/ChatMessage');
const StaffAssignment = require('./models/StaffAssignment');
const { generateQRCode } = require('./utils/qrCode');

const seedData = async (skipConnect = false) => {
  try {
    if (!skipConnect) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atomic-ops';
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log('[Seed] Connected to MongoDB database...');
      } catch (err) {
        console.warn(`[Seed] MongoDB connection failed (${err.message}). Activating In-Memory Store...`);
        const { enableInMemoryMode } = require('./config/inMemoryStore');
        enableInMemoryMode();
      }
    }

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Event.deleteMany();
    await TicketType.deleteMany();
    await PromoCode.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await ChatMessage.deleteMany();
    await StaffAssignment.deleteMany();
    console.log('[Seed] Cleared existing collections.');

    // 1. Create Users
    console.log('[Seed] Creating demo users...');
    const superadminUser = await User.create({
      name: 'Apex Arena Owner & CFO',
      email: 'superadmin@atomicops.com',
      password: 'Password123!',
      role: 'superadmin',
      status: 'active'
    });

    const adminUser = await User.create({
      name: 'System Admin (Ops & Staff Mgr)',
      email: 'admin@atomicops.com',
      password: 'Password123!',
      role: 'admin',
      status: 'active'
    });

    const organizerUser = await User.create({
      name: 'Tech Events Inc',
      email: 'organizer@atomicops.com',
      password: 'Password123!',
      role: 'organizer',
      status: 'active'
    });

    const staffUser = await User.create({
      name: 'Door Gate Supervisor',
      email: 'staff@atomicops.com',
      password: 'Password123!',
      role: 'staff',
      status: 'active'
    });

    const staffUser2 = await User.create({
      name: 'Sarah Gate Specialist',
      email: 'gate2@atomicops.com',
      password: 'Password123!',
      role: 'staff',
      status: 'active'
    });

    const attendeeUser = await User.create({
      name: 'Alex Attendee',
      email: 'attendee@atomicops.com',
      password: 'Password123!',
      role: 'attendee',
      status: 'active'
    });

    console.log(`[Seed] Created Users: SuperAdmin (${superadminUser.email}), Admin (${adminUser.email}), Organizer (${organizerUser.email}), Staff (${staffUser.email}), Attendee (${attendeeUser.email})`);

    // 2. Create Categories
    console.log('[Seed] Creating categories...');
    const categories = await Category.create([
      { name: 'Technology & AI', slug: 'technology-ai', description: 'Cutting-edge tech, AI, webdev and engineering conferences.' },
      { name: 'Music & Concerts', slug: 'music-concerts', description: 'Live concerts, festivals and acoustic performances.' },
      { name: 'Business & Startup', slug: 'business-startup', description: 'Networking, pitch competitions, and leadership summits.' },
      { name: 'Gaming & Esports', slug: 'gaming-esports', description: 'Tournaments, indie showcases, and VR experiences.' }
    ]);

    // 3. Create Sample Events
    console.log('[Seed] Creating sample events...');
    const now = new Date();
    const event1Start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const event1End = new Date(event1Start.getTime() + 8 * 60 * 60 * 1000);

    const event1 = await Event.create({
      organizer: organizerUser._id,
      title: 'Global AI & Monorepo Summit 2026',
      slug: 'global-ai-monorepo-summit-2026',
      eventId: 'EVT-2026-AITEC',
      category: categories[0]._id,
      description: 'Join world-leading software architects to explore high-performance atomic backend engines, multi-tenant databases, and enterprise full-stack monorepo designs. Features live keynotes, hands-on masterclasses, and executive networking sessions.',
      banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      venue: {
        name: 'Silicon Valley Convention Center',
        address: '500 Innovation Way',
        city: 'San Francisco'
      },
      startDateTime: event1Start,
      endDateTime: event1End,
      isOnline: false,
      meetingLink: '',
      status: 'published',
      totalCapacity: 500,
      isApproved: true
    });

    const event2Start = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const event2End = new Date(event2Start.getTime() + 4 * 60 * 60 * 1000);

    const event2 = await Event.create({
      organizer: organizerUser._id,
      title: 'Neon Pulse Electronic Music & Laser Festival',
      slug: 'neon-pulse-electronic-music-festival-2026',
      eventId: 'EVT-2026-NEON',
      category: categories[1]._id,
      description: 'An immersive 3-day outdoor electronic music experience featuring top international electronic producers, multi-dimensional laser stages, spatial audio, and gourmet food truck alleys.',
      banner: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
      venue: {
        name: 'Zilker Park Outdoor Amphitheater',
        address: '2100 Barton Springs Rd',
        city: 'Austin'
      },
      startDateTime: event2Start,
      endDateTime: event2End,
      isOnline: false,
      meetingLink: '',
      status: 'published',
      totalCapacity: 2500,
      isApproved: true
    });

    const event3Start = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const event3End = new Date(event3Start.getTime() + 6 * 60 * 60 * 1000);

    const event3 = await Event.create({
      organizer: organizerUser._id,
      title: 'Full-Stack DevFest Online 2026',
      slug: 'full-stack-devfest-online-2026',
      eventId: 'EVT-2026-DEV48',
      category: categories[0]._id,
      description: 'Virtual developer summit featuring deep-dives into React 18, Vite concurrency, Joi schema validation, micro-frontends, and zero-downtime database migrations.',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
      venue: {
        name: 'Virtual Broadcast Platform',
        address: 'Online',
        city: 'Online'
      },
      startDateTime: event3Start,
      endDateTime: event3End,
      isOnline: true,
      meetingLink: 'https://meet.atomicops.com/devfest-2026',
      status: 'published',
      totalCapacity: 1500,
      isApproved: true
    });

    const event4Start = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const event4End = new Date(event4Start.getTime() + 5 * 60 * 60 * 1000);

    const event4 = await Event.create({
      organizer: organizerUser._id,
      title: 'Silicon Valley Venture & Angel Pitch Arena',
      slug: 'silicon-valley-venture-pitch-arena-2026',
      eventId: 'EVT-2026-VENTURE',
      category: categories[2]._id,
      description: 'Over 50 curated Seed and Series A technology founders pitch live in front of Tier-1 venture capital firms and angel syndicates. Includes private investor deal rooms and VIP networking lounge.',
      banner: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200',
      venue: {
        name: 'Sand Hill Grand Ballroom',
        address: '2800 Sand Hill Rd',
        city: 'Palo Alto'
      },
      startDateTime: event4Start,
      endDateTime: event4End,
      isOnline: false,
      meetingLink: '',
      status: 'published',
      totalCapacity: 350,
      isApproved: true
    });

    const event5Start = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const event5End = new Date(event5Start.getTime() + 8 * 60 * 60 * 1000);

    const event5 = await Event.create({
      organizer: organizerUser._id,
      title: 'Apex Global Esports Arena Championship',
      slug: 'apex-global-esports-championship-2026',
      eventId: 'EVT-2026-SPORTS',
      category: categories[3]._id,
      description: 'The premier international esports tournament showcasing 32 top global squads battling in high-stakes elimination brackets. High-refresh stadium displays, live caster booths, and fan meet & greets.',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
      venue: {
        name: 'Climate Pledge Arena',
        address: '334 1st Ave N',
        city: 'Seattle'
      },
      startDateTime: event5Start,
      endDateTime: event5End,
      isOnline: false,
      meetingLink: '',
      status: 'published',
      totalCapacity: 5000,
      isApproved: true
    });

    // 4. Create Ticket Tiers
    console.log('[Seed] Creating ticket tiers...');
    const tt1 = await TicketType.create({
      event: event1._id,
      name: 'Early Bird Pass',
      price: 99,
      totalQuantity: 150,
      soldQuantity: 12,
      maxPerUser: 4,
      saleStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      saleEndDate: event1Start,
      description: 'Includes full keynotes, buffet lunch, and conference swag kit.'
    });

    const tt2 = await TicketType.create({
      event: event1._id,
      name: 'VIP Executive Pass',
      price: 249,
      totalQuantity: 50,
      soldQuantity: 6,
      maxPerUser: 2,
      saleStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      saleEndDate: event1Start,
      description: 'Includes front-row seating, VIP lounge access, and private speaker dinner.'
    });

    const tt3 = await TicketType.create({
      event: event2._id,
      name: 'Weekend General Admission',
      price: 79,
      totalQuantity: 1200,
      soldQuantity: 45,
      maxPerUser: 6,
      saleStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      saleEndDate: event2Start,
      description: 'All-stage festival access for Saturday and Sunday with laser shows.'
    });

    const tt4 = await TicketType.create({
      event: event2._id,
      name: 'VIP Backstage Access',
      price: 199,
      totalQuantity: 100,
      soldQuantity: 8,
      maxPerUser: 2,
      saleStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      saleEndDate: event2Start,
      description: 'Elevated viewing platform, dedicated air-conditioned lounge, and express bar.'
    });

    await TicketType.create([
      {
        event: event3._id,
        name: 'General Developer Stream',
        price: 29,
        totalQuantity: 800,
        soldQuantity: 30,
        maxPerUser: 5,
        saleStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        saleEndDate: event3Start,
        description: 'Access to live HD streams, interactive Q&A, and session video archives.'
      },
      {
        event: event4._id,
        name: 'Accredited Investor Pass',
        price: 349,
        totalQuantity: 120,
        soldQuantity: 14,
        maxPerUser: 2,
        saleStartDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        saleEndDate: event4Start,
        description: 'Complete startup pitch booklet, private room booking, and networking lunch.'
      },
      {
        event: event5._id,
        name: 'Championship Arena Bowl',
        price: 49,
        totalQuantity: 3000,
        soldQuantity: 150,
        maxPerUser: 6,
        saleStartDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        saleEndDate: event5Start,
        description: 'Lower bowl arena seating with direct view of massive LED jumbotron.'
      }
    ]);

    // 5. Create Promo Codes (Demonstrating Global vs Event-Specific, single-use per user)
    console.log('[Seed] Creating promo codes...');
    await PromoCode.create([
      {
        event: null,
        scope: 'all',
        code: 'ATOMIC20',
        discountType: 'percentage',
        value: 20,
        usageLimit: 100,
        usedCount: 0,
        perUserLimit: 1,
        createdBy: adminUser._id,
        createdByRole: 'admin',
        isActive: true,
        usedByUsers: []
      },
      {
        event: null,
        scope: 'all',
        code: 'WELCOME30',
        discountType: 'percentage',
        value: 30,
        usageLimit: 100,
        usedCount: 0,
        perUserLimit: 1,
        isNewUserOnly: true,
        createdBy: adminUser._id,
        createdByRole: 'admin',
        isActive: true,
        usedByUsers: []
      },
      {
        event: null,
        scope: 'all',
        code: 'DIWALI50',
        discountType: 'percentage',
        value: 50,
        usageLimit: 100,
        usedCount: 0,
        perUserLimit: 1,
        validUntil: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Expired 2 days ago
        createdBy: adminUser._id,
        createdByRole: 'admin',
        isActive: true,
        usedByUsers: []
      },
      {
        event: event1._id,
        scope: 'event',
        code: 'SUMMIT50',
        discountType: 'flat',
        value: 50,
        usageLimit: 50,
        usedCount: 0,
        perUserLimit: 1,
        createdBy: adminUser._id,
        createdByRole: 'admin',
        isActive: true,
        usedByUsers: []
      },
      {
        event: event2._id,
        scope: 'event',
        code: 'NEON15',
        discountType: 'percentage',
        value: 15,
        usageLimit: 200,
        usedCount: 0,
        perUserLimit: 1,
        createdBy: organizerUser._id,
        createdByRole: 'organizer',
        isActive: true,
        usedByUsers: []
      }
    ]);

    // 6. Create Initial Active Bookings for Attendee
    console.log('[Seed] Creating demo ticket passes with verified QR codes...');
    const passCode1 = 'ATOM-2026-AITEC-W4P8';
    const securityHash1 = '7E3B19A4F82CD091B3E5';
    const qr1 = await generateQRCode({
      passCode: passCode1,
      securityDigest: securityHash1,
      eventId: String(event1._id),
      gate: 'Gate A • VIP Rapid Access Lane'
    });

    await Booking.create({
      bookingCode: passCode1,
      user: attendeeUser._id,
      event: event1._id,
      tickets: [
        {
          ticketType: tt2._id,
          nameSnapshot: tt2.name,
          priceSnapshot: tt2.price,
          quantity: 1
        }
      ],
      totalAmount: 249,
      totalTicketsCount: 1,
      checkedInCount: 0,
      individualTickets: [
        {
          ticketCode: `${passCode1}-1`,
          ticketIndex: 1,
          ticketTypeName: tt2.name,
          status: 'valid',
          admittedAt: null
        }
      ],
      checkInLogs: [],
      status: 'confirmed',
      qrCodeUrl: qr1,
      securityHash: securityHash1,
      gateEntry: 'Gate A • VIP Rapid Access Lane',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      transactionId: 'TXN-ATOM-98214482',
      paidAt: new Date(Date.now() - 3600000)
    });

    const passCode2 = 'ATOM-2026-NEON-K992';
    const securityHash2 = '9A1C4F2B88DE710E54C2';
    const qr2 = await generateQRCode({
      passCode: passCode2,
      securityDigest: securityHash2,
      eventId: String(event2._id),
      gate: 'Gate B • Express Turnstile 04'
    });

    await Booking.create({
      bookingCode: passCode2,
      user: attendeeUser._id,
      event: event2._id,
      tickets: [
        {
          ticketType: tt3._id,
          nameSnapshot: tt3.name,
          priceSnapshot: tt3.price,
          quantity: 2
        }
      ],
      totalAmount: 158,
      totalTicketsCount: 2,
      checkedInCount: 0,
      individualTickets: [
        {
          ticketCode: `${passCode2}-1`,
          ticketIndex: 1,
          ticketTypeName: tt3.name,
          status: 'valid',
          admittedAt: null
        },
        {
          ticketCode: `${passCode2}-2`,
          ticketIndex: 2,
          ticketTypeName: tt3.name,
          status: 'valid',
          admittedAt: null
        }
      ],
      checkInLogs: [],
      status: 'confirmed',
      qrCodeUrl: qr2,
      securityHash: securityHash2,
      gateEntry: 'Gate B • Express Turnstile 04',
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      transactionId: 'TXN-ATOM-55418920',
      paidAt: new Date(Date.now() - 7200000)
    });

    // 6. Create Initial Team Messages
    console.log('[Seed] Creating initial team chat messages...');
    await ChatMessage.create([
      {
        sender: adminUser._id,
        senderName: adminUser.name,
        senderRole: adminUser.role,
        recipientName: 'All Team Members',
        message: 'Welcome to the Atomic Ops Operations Control Console. Please verify your door scanner devices before event start.',
        isBroadcast: true,
        type: 'general'
      },
      {
        sender: organizerUser._id,
        senderName: organizerUser.name,
        senderRole: organizerUser.role,
        recipientName: 'System Admin',
        message: 'Global AI Summit early bird pass inventory is at 90%. Requesting additional promo code approval.',
        isBroadcast: false,
        type: 'urgent'
      }
    ]);

    // 7. Create Staff Duty Assignments
    console.log('[Seed] Assigning staff duties to events...');
    await StaffAssignment.create([
      {
        staff: staffUser._id,
        event: event1._id,
        duty: 'North Gate Primary QR Scanner & Ticket Check-in',
        gate: 'Main North Gate Turnstile',
        shiftStart: new Date(),
        shiftEnd: new Date(Date.now() + 8 * 3600000),
        status: 'active',
        assignedBy: adminUser._id
      },
      {
        staff: staffUser2._id,
        event: event1._id,
        duty: 'VIP Lounge & Early Exit Crowd Monitor',
        gate: 'VIP Portal B / South Exit',
        shiftStart: new Date(),
        shiftEnd: new Date(Date.now() + 8 * 3600000),
        status: 'assigned',
        assignedBy: adminUser._id
      },
      {
        staff: staffUser._id,
        event: event2._id,
        duty: 'Laser Stage Access & Security Patrol',
        gate: 'Laser Dome Gate 4',
        shiftStart: new Date(Date.now() + 24 * 3600000),
        shiftEnd: new Date(Date.now() + 32 * 3600000),
        status: 'assigned',
        assignedBy: adminUser._id
      }
    ]);

    console.log('\n========================================');
    console.log(' [SEED COMPLETED SUCCESSFULLY]');
    console.log(' Credentials & Roles:');
    console.log(' Super Admin:   superadmin@atomicops.com / Password123! (Venue Owner & CFO)');
    console.log(' Admin:         admin@atomicops.com / Password123! (Events, Ticket & Staff Mgr)');
    console.log(' Organizer:     organizer@atomicops.com / Password123! (Assigned Event Coordinator)');
    console.log(' Door Checker:  staff@atomicops.com / Password123! (Gate & Check-in Staff)');
    console.log(' Attendee:      attendee@atomicops.com / Password123! (Pass Buyer & Attendee)');
    console.log(' 2FA Test OTP:  123456');
    console.log('========================================\n');

    if (!skipConnect) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (!skipConnect) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData(false);
}

module.exports = seedData;
