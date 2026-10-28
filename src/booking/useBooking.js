import { useCallback, useEffect, useReducer } from 'react';
import { STATUS } from './config';
import { DEMO_MODE, DEMO_REVIEW_MS } from './driverApi';

/**
 * Booking state for /book-bike. Saved in this browser so a driver can close
 * the page and come back. Document photos are never saved here; only the
 * fact that each one was uploaded.
 */
const STORAGE_KEY = 'vf.bookBike.v1';

export const STEPS = ['phone', 'vehicle', 'plan', 'agreement', 'documents', 'fee', 'status'];

const initial = {
  step: 'phone',
  phone: '',
  name: '',
  otpVerified: false,
  driverId: null,
  vehicleType: null,
  plan: null,
  agreement: null, // { title, version, at }
  docs: {}, // { [docId]: { at } }
  feePayment: null, // { receipt, amount, at }
  depositPayment: null,
  status: STATUS.NEW,
  statusAt: 0,
  assignment: null, // { bike, reg, hub, code, at }
};

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const saved = JSON.parse(raw);
    return { ...initial, ...saved };
  } catch {
    return initial;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'go':
      return { ...state, step: action.step };
    case 'otpVerified':
      return { ...state, otpVerified: true, phone: action.phone, name: action.name, driverId: action.driverId, step: 'vehicle' };
    case 'set':
      return { ...state, ...action.patch };
    case 'registered':
      return {
        ...state,
        agreement: action.agreement,
        status: STATUS.REGISTERED,
        statusAt: Date.now(),
        step: 'documents',
      };
    case 'docUploaded':
      return { ...state, docs: { ...state.docs, [action.docId]: { at: action.at } } };
    case 'docRemoved': {
      const docs = { ...state.docs };
      delete docs[action.docId];
      return { ...state, docs };
    }
    case 'feePaid':
      return { ...state, feePayment: action.payment, status: STATUS.KYC_IN_PROGRESS, statusAt: Date.now(), step: 'status' };
    case 'status':
      return { ...state, status: action.status, statusAt: Date.now() };
    case 'depositPaid':
      return { ...state, depositPayment: action.payment, status: STATUS.READY_FOR_ASSIGNMENT, statusAt: Date.now() };
    case 'assigned':
      return { ...state, assignment: action.assignment };
    case 'reset':
      return { ...initial };
    default:
      return state;
  }
}

/** Demo bike for the assignment step (the real one comes from the Fleet Manager). */
function demoAssignment(vehicleType) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  return {
    bike: vehicleType === 'ev_scooter' ? 'Ola Electric S1 (demo)' : 'Petrol scooter (demo)',
    reg: `TS 08 ${vehicleType === 'ev_scooter' ? 'EV' : 'FL'} ${String(1000 + Math.floor(Math.random() * 9000))}`,
    hub: 'Hayathnagar hub, Hyderabad',
    code,
    at: Date.now(),
  };
}

export default function useBooking() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode: the flow still works, it just isn't remembered */
    }
  }, [state]);

  // Demo only: the staff steps (document check, field visit, assignment,
  // handover) finish on a timer so the driver's side can be seen end to end.
  useEffect(() => {
    if (!DEMO_MODE) return undefined;
    const { status, statusAt, assignment } = state;
    let delay;
    let next;
    if (status === STATUS.KYC_IN_PROGRESS || status === STATUS.KYC_VERIFIED) {
      delay = DEMO_REVIEW_MS[status] - (Date.now() - statusAt);
      next = () =>
        dispatch({
          type: 'status',
          status: status === STATUS.KYC_IN_PROGRESS ? STATUS.KYC_VERIFIED : STATUS.BACKGROUND_VERIFIED,
        });
    } else if (status === STATUS.READY_FOR_ASSIGNMENT && !assignment) {
      delay = DEMO_REVIEW_MS[status] - (Date.now() - statusAt);
      next = () => dispatch({ type: 'assigned', assignment: demoAssignment(state.vehicleType) });
    } else if (status === STATUS.READY_FOR_ASSIGNMENT && assignment) {
      delay = DEMO_REVIEW_MS.HANDOVER - (Date.now() - assignment.at);
      next = () => dispatch({ type: 'status', status: STATUS.ACTIVE });
    }
    if (!next) return undefined;
    const t = setTimeout(next, Math.max(0, delay));
    return () => clearTimeout(t);
  }, [state]);

  const go = useCallback((step) => {
    dispatch({ type: 'go', step });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { state, dispatch, go };
}
