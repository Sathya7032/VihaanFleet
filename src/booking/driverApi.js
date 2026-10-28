/**
 * Driver onboarding API used by /book-bike.
 *
 * The production backend (Supabase + MSG91 OTP + Cashfree UPI, BRD section 7)
 * is not reachable from this website yet, so by default the page runs in
 * DEMO MODE: no SMS is sent, no money is charged and document photos never
 * leave the browser. Staff steps (document check, field visit, bike
 * assignment) complete on a short timer so the whole journey can be seen.
 *
 * To go live, set VITE_DRIVER_API_URL and implement `liveApi` below against
 * the real endpoints; the screens only talk to the functions exported here.
 */
import { FEES, PLANS, STATUS, OTP_RULES } from './config';

const API_URL = import.meta.env?.VITE_DRIVER_API_URL || '';
export const DEMO_MODE = !API_URL;

/** In demo mode any 6 digits work; this one is shown on screen as a hint. */
export const DEMO_OTP = '123456';

/** How long each staff step takes in demo mode (ms). */
export const DEMO_REVIEW_MS = {
  [STATUS.KYC_IN_PROGRESS]: 6000, // admin verifies documents -> KYC_VERIFIED
  [STATUS.KYC_VERIFIED]: 6000, // field officer visit -> BACKGROUND_VERIFIED
  [STATUS.READY_FOR_ASSIGNMENT]: 6000, // fleet manager assigns a bike
  HANDOVER: 10000, // officer hands over the bike with the phone code -> ACTIVE
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const demoApi = {
  async sendOtp(phone) {
    await wait(700);
    if (!/^[6-9]\d{9}$/.test(phone)) throw new ApiError('BAD_PHONE', 'Enter a valid 10-digit mobile number.');
    return { resendAfter: OTP_RULES.resendAfterSeconds };
  },

  async verifyOtp(phone, code) {
    await wait(700);
    if (!new RegExp(`^\\d{${OTP_RULES.length}}$`).test(code)) {
      throw new ApiError('BAD_OTP', 'That code is not right. Check the SMS and try again.');
    }
    return { driverId: `DEMO-${phone.slice(-4)}`, status: STATUS.NEW };
  },

  /** Sign-up is complete once vehicle type, plan and agreement are saved. */
  async register({ vehicleType, plan, agreementVersion }) {
    await wait(600);
    if (!PLANS[plan]) throw new ApiError('BAD_PLAN', 'Choose a plan.');
    return { status: STATUS.REGISTERED, vehicleType, plan, agreementVersion, acceptedAt: new Date().toISOString() };
  },

  /** Demo: photos are checked for type/size here and then dropped. */
  async uploadDocument(docId, file) {
    await wait(500 + Math.random() * 500);
    if (!file.type.startsWith('image/')) throw new ApiError('NOT_IMAGE', 'Photos only (JPG or PNG), not PDF.');
    return { docId, uploadedAt: new Date().toISOString() };
  },

  async submitDocuments() {
    await wait(500);
    return { status: STATUS.KYC_IN_PROGRESS };
  },

  /**
   * One UPI order per tap; the server computes the amount (BRD 8.2).
   * kind: 'document_fee' | 'deposit'
   */
  async createPaymentOrder(kind, { plan, status }) {
    await wait(600);
    if (kind === 'deposit' && status !== STATUS.BACKGROUND_VERIFIED) {
      throw new ApiError('DEPOSIT_NOT_YET', 'The deposit opens after your verification is complete.');
    }
    const amount = kind === 'document_fee' ? FEES.documentFee : PLANS[plan].deposit;
    return { orderId: `DEMO-${kind.toUpperCase()}-${Date.now().toString(36)}`, amount };
  },

  /** Real flow: Cashfree checkout + webhook + server order check. */
  async confirmPayment(orderId) {
    await wait(1400);
    return { orderId, paid: true, paidAt: new Date().toISOString(), receipt: `RCPT-${orderId.slice(-6).toUpperCase()}` };
  },
};

/* eslint-disable no-unused-vars */
const notWired = () => {
  throw new ApiError('NOT_WIRED', 'Online booking is not connected yet. Please call us to book a bike.');
};
const liveApi = {
  sendOtp: (phone) => notWired(),
  verifyOtp: (phone, code) => notWired(),
  register: (data) => notWired(),
  uploadDocument: (docId, file) => notWired(),
  submitDocuments: () => notWired(),
  createPaymentOrder: (kind, ctx) => notWired(),
  confirmPayment: (orderId) => notWired(),
};
/* eslint-enable no-unused-vars */

export const driverApi = DEMO_MODE ? demoApi : liveApi;
