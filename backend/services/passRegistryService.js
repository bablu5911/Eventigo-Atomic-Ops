const Booking = require('../models/Booking');

class PassRegistryService {
  constructor() {
    // Recycled ID Pool for IDs released 48 hours post gate check-in
    this.recycledIDPool = [];
    this.initRecyclerWorker();
  }

  initRecyclerWorker() {
    // Run garbage collection and ID recycling check every 30 seconds
    const interval = setInterval(() => {
      this.recycleExpiredPassIDs().catch((err) => {
        console.error('[Pass Recycler Error]:', err.message);
      });
    }, 30 * 1000);
    if (interval && interval.unref) interval.unref();
  }

  generateSecurityHash(passCode, eventId, userId) {
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'atomic_ops_jwt_secret_key_2026_super_secure_spec';
    return crypto
      .createHmac('sha256', secret)
      .update(`${passCode}:${eventId}:${userId}:${Date.now()}`)
      .digest('hex')
      .slice(0, 24)
      .toUpperCase();
  }

  determineGateAllocation(tickets = [], isOnline = false) {
    if (isOnline) return 'Virtual Gate - Secure CDN Entry';
    const hasVip = tickets.some((t) => /vip|executive|backstage/i.test(t.nameSnapshot || ''));
    if (hasVip) return 'Gate A • VIP Rapid Access Lane';
    return 'Gate B • Express Turnstile 04';
  }

  async generateUniquePassCode(event = null) {
    // 1) First check if there is an available recycled ID from 48h ago
    if (this.recycledIDPool.length > 0) {
      const recycledCode = this.recycledIDPool.shift();
      console.log(`[Pass Registry]: Re-issuing recycled Pass ID '${recycledCode}' (48h post scan release)`);
      return recycledCode;
    }

    // 2) Extract Event Identifier Token from event (if provided)
    let eventToken = '';
    if (event) {
      if (event.eventId) {
        // e.g. EVT-2026-NEON -> NEON, EVT-2026-AITEC -> AITEC, EVT-8A3F -> 8A3F
        const parts = String(event.eventId).split('-');
        eventToken = parts[parts.length - 1].toUpperCase();
      } else if (event._id) {
        eventToken = String(event._id).slice(-4).toUpperCase();
      }
    }

    // 3) Generate high-security alphanumeric Pass ID embedding event token
    const crypto = require('crypto');
    const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const getRandomSegment = (len) => {
      let res = '';
      const bytes = crypto.randomBytes(len);
      for (let i = 0; i < len; i++) {
        res += charset[bytes[i] % charset.length];
      }
      return res;
    };

    let attempts = 0;
    while (attempts < 100) {
      const seg1 = eventToken ? eventToken.slice(0, 5) : getRandomSegment(4);
      const seg2 = getRandomSegment(4);
      const passCode = `ATOM-2026-${seg1}-${seg2}`;

      // Check collision against active bookings
      const existing = await Booking.findOne({ bookingCode: passCode });
      if (!existing) {
        return passCode;
      }
      attempts++;
    }

    // Fallback code if high concurrency collision occurs
    const fallbackToken = eventToken ? eventToken.slice(0, 5) : Date.now().toString(36).toUpperCase();
    return `ATOM-2026-${fallbackToken}-${getRandomSegment(4)}`;
  }

  async recycleExpiredPassIDs() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find all bookings checked in at the gate over 48 hours ago
    const expiredCheckIns = await Booking.find({
      status: { $in: ['confirmed', 'scanned_invalid'] },
      attendedAt: { $lte: fortyEightHoursAgo },
      isRecycled: { $ne: true }
    });

    if (expiredCheckIns.length === 0) return;

    for (const b of expiredCheckIns) {
      if (b.bookingCode && !this.recycledIDPool.includes(b.bookingCode)) {
        this.recycledIDPool.push(b.bookingCode);
        b.isRecycled = true;
        b.status = 'archived';
        await b.save();
        console.log(`[Pass Recycler]: Pass ID '${b.bookingCode}' returned to pool 48h post gate check-in.`);
      }
    }
  }
}

module.exports = new PassRegistryService();
