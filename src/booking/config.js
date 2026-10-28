/**
 * Driver booking flow (/book-bike) - business rules.
 * Source: Business Requirements Document v2.0 (26 Oct 2026), sections 5,
 * 8.1-8.3 and 9.1. Change numbers here, not in the screens.
 */

export const FEES = {
  documentFee: 1000, // one constant for every plan
};

export const PLANS = {
  rent: {
    id: 'rent',
    name: 'Rent a bike',
    tagline: 'Ride on daily rent. Return it whenever you are done.',
    deposit: 5000,
    depositRefundable: true,
    rentFrom: 299, // shown on the website; the exact daily rent is fixed when a bike is assigned
    points: [
      'Daily rent, from ₹299 a day; the exact amount is set when your bike is assigned',
      '₹5,000 security deposit, refundable at exit (less unpaid dues and damage)',
      'Rent starts the day after handover; pay every day in the app by UPI',
      'Servicing, insurance and documents included',
    ],
    agreementTitle: 'Rental Agreement',
    agreementVersion: null, // the lawyer's wording is not wired in yet (BRD 8.2)
    agreement: [
      'The bike stays Vihaan Fleet’s property. You rent it for as long as you need it.',
      'You pay the daily rent on time, every day, in the app.',
      'You return the bike in the same condition, apart from normal wear.',
      'You report any accident or lost document within 24 hours.',
      'Nobody else rides the bike, and you obey traffic laws. Challans, fines and damage beyond normal wear are your responsibility and can be recovered from the deposit.',
      'Either side may end the agreement with notice. Vihaan Fleet may end it at once for unpaid rent, damage or misuse.',
      'At exit, the deposit is refunded minus any unpaid dues and damage, through the way you paid it.',
    ],
  },
  own: {
    id: 'own',
    name: 'Own the bike',
    tagline: 'Pay a fixed daily instalment for 3 years. Then the bike is yours.',
    deposit: 10000,
    depositRefundable: false,
    daily: 249,
    termDays: 1095, // 3 x 365. NOTE: the total is never shown to drivers (BRD 8.1)
    minTopUp: 100,
    points: [
      '₹249 a day for 3 years, starting the day after handover',
      '₹10,000 deposit, part of the plan and not refundable',
      'Pay ahead any time by UPI (at least ₹100); early payoff is just larger top-ups',
      'The bike is yours once every instalment is paid',
    ],
    agreementTitle: 'Own-the-bike Agreement',
    agreementVersion: '2026.10.15',
    agreement: [
      'You pay ₹249 a day for 1,095 days, starting the day after handover.',
      'The bike is with you from handover but belongs to Vihaan Fleet until every instalment is paid; then it is transferred to you.',
      'The ₹10,000 deposit is part of the plan. It is not refunded, even if you leave or the plan ends.',
      'You pay by UPI in the app, at least ₹100 at a time.',
      'After 10 unpaid days Vihaan Fleet may cancel the plan; it is never cancelled automatically. You can also ask to cancel when nothing is owed.',
      'If the plan is cancelled you return the bike, unpaid days are written off, the deposit and paid instalments stay with Vihaan Fleet, and any unused advance is refunded.',
      'Money paid after a cancellation is refunded in full.',
    ],
  },
};

/**
 * Vehicle types offered at sign-up. The BRD says the driver picks a vehicle
 * type but does not list them; the fleet is mostly Ola Electric scooters.
 * Confirm this list with the fleet team.
 */
export const VEHICLE_TYPES = [
  {
    id: 'ev_scooter',
    name: 'Electric scooter',
    note: 'Most of our fleet: Ola Electric scooters. No fuel cost; charge at home or at the hub.',
  },
  {
    id: 'petrol_scooter',
    name: 'Petrol scooter',
    note: 'Fill up anywhere. Good for long shifts across the city.',
  },
];

/** KYC photos (photos only, no PDF; camera or gallery). Aadhaar back is optional. */
export const DOCUMENTS = [
  { id: 'licence_front', label: 'Driving licence (front)', required: true },
  { id: 'licence_back', label: 'Driving licence (back)', required: true },
  { id: 'pan', label: 'PAN card', required: true },
  { id: 'aadhaar_front', label: 'Aadhaar (front)', required: true },
  { id: 'aadhaar_back', label: 'Aadhaar (back)', required: false },
  { id: 'selfie', label: 'Selfie', required: true, selfie: true },
];

export const PHOTO_RULES = {
  accept: 'image/jpeg,image/png,image/webp,image/heic,image/heif',
  maxBytes: 10 * 1024 * 1024,
};

export const OTP_RULES = {
  length: 6,
  resendAfterSeconds: 30,
};

/** Driver statuses (BRD 8.2), in journey order. */
export const STATUS = {
  NEW: 'NEW',
  REGISTERED: 'REGISTERED',
  KYC_IN_PROGRESS: 'KYC_IN_PROGRESS',
  KYC_VERIFIED: 'KYC_VERIFIED',
  BACKGROUND_VERIFIED: 'BACKGROUND_VERIFIED',
  READY_FOR_ASSIGNMENT: 'READY_FOR_ASSIGNMENT',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
};

export const STATUS_ORDER = [
  STATUS.NEW,
  STATUS.REGISTERED,
  STATUS.KYC_IN_PROGRESS,
  STATUS.KYC_VERIFIED,
  STATUS.BACKGROUND_VERIFIED,
  STATUS.READY_FOR_ASSIGNMENT,
  STATUS.ACTIVE,
];

export const atLeast = (status, target) => STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(target);

export const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
