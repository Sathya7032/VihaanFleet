/**
 * /book-bike: driver onboarding, from phone sign-up to bike handover.
 * Follows the driver journey in the BRD (sections 8.2, 8.3, 9.1). Only the
 * driver's side is here; staff steps show as status updates.
 */
import { useEffect } from 'react';
import { FEES, PLANS, STATUS, VEHICLE_TYPES, atLeast, formatINR } from '../booking/config';
import { DEMO_MODE } from '../booking/driverApi';
import useBooking from '../booking/useBooking';
import Icon from '../booking/icons';
import {
  AgreementStep,
  DocumentsStep,
  FeeStep,
  PhoneStep,
  PlanStep,
  StatusStep,
  VehicleStep,
} from '../booking/steps';

const SCREENS = {
  phone: PhoneStep,
  vehicle: VehicleStep,
  plan: PlanStep,
  agreement: AgreementStep,
  documents: DocumentsStep,
  fee: FeeStep,
  status: StatusStep,
};

/** Never show a step the driver hasn't unlocked (e.g. a stale saved step). */
function allowedStep(s) {
  if (!s.otpVerified) return 'phone';
  if (s.feePayment) return 'status';
  if (s.status === STATUS.REGISTERED) return s.step === 'fee' ? 'fee' : 'documents';
  if (s.step === 'plan' && !s.vehicleType) return 'vehicle';
  if (s.step === 'agreement' && !s.plan) return s.vehicleType ? 'plan' : 'vehicle';
  if (['vehicle', 'plan', 'agreement'].includes(s.step)) return s.step;
  return 'vehicle';
}

function milestones(s) {
  const signedUp = atLeast(s.status, STATUS.REGISTERED);
  const docsDone = !!s.feePayment;
  const verified = atLeast(s.status, STATUS.BACKGROUND_VERIFIED);
  const deposit = !!s.depositPayment;
  const active = s.status === STATUS.ACTIVE;
  const pick = (done, now) => (done ? 'done' : now ? 'now' : 'next');
  return [
    { label: 'Sign up', sub: 'Phone, vehicle, plan, agreement', state: pick(signedUp, !signedUp) },
    { label: 'Documents', sub: 'KYC photos and document fee', state: pick(docsDone, signedUp && !docsDone) },
    { label: 'Verification', sub: 'Document check and home visit', state: pick(verified, docsDone && !verified) },
    { label: 'Deposit', sub: 'Paid by UPI after verification', state: pick(deposit, verified && !deposit) },
    { label: 'Handover', sub: 'Collect your bike with a code', state: pick(active, deposit && !active) },
  ];
}

function Rail({ state }) {
  const plan = PLANS[state.plan];
  const vehicle = VEHICLE_TYPES.find((v) => v.id === state.vehicleType);
  const steps = milestones(state);
  return (
    <aside className="bk-rail" aria-label="Your booking">
      <ol className="bk-miles">
        {steps.map((m, i) => (
          <li key={m.label} className={`is-${m.state}`} aria-current={m.state === 'now' ? 'step' : undefined}>
            <span className="bk-mile-dot" aria-hidden="true">
              {m.state === 'done' ? Icon.check : i + 1}
            </span>
            <span>
              <strong>{m.label}</strong>
              <small>{m.sub}</small>
            </span>
          </li>
        ))}
      </ol>

      {(vehicle || plan) && (
        <div className="bk-summary">
          <p className="bk-label">Your booking</p>
          <dl>
            {state.name && (
              <div>
                <dt>Name</dt>
                <dd>{state.name}</dd>
              </div>
            )}
            {vehicle && (
              <div>
                <dt>Vehicle</dt>
                <dd>{vehicle.name}</dd>
              </div>
            )}
            {plan && (
              <>
                <div>
                  <dt>Plan</dt>
                  <dd>{plan.name}</dd>
                </div>
                <div>
                  <dt>{plan.id === 'own' ? 'Instalment' : 'Rent'}</dt>
                  <dd>{plan.id === 'own' ? `${formatINR(plan.daily)}/day` : `from ${formatINR(plan.rentFrom)}/day`}</dd>
                </div>
                <div>
                  <dt>Document fee</dt>
                  <dd>
                    {formatINR(FEES.documentFee)} {state.feePayment && <span className="bk-paid">Paid</span>}
                  </dd>
                </div>
                <div>
                  <dt>Deposit</dt>
                  <dd>
                    {formatINR(plan.deposit)} {state.depositPayment && <span className="bk-paid">Paid</span>}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      )}
    </aside>
  );
}

export default function BookBikePage() {
  const { state, dispatch, go } = useBooking();
  const step = allowedStep(state);
  const Screen = SCREENS[step];
  const progress = milestones(state);
  const doneCount = progress.filter((m) => m.state === 'done').length;

  useEffect(() => {
    document.title = 'Book a bike — Vihaan Fleet';
  }, []);

  return (
    <main id="main" className="subpage bk-page">
      <div className="page-head bk-head">
        <div className="bk-wrap">
          <p className="breadcrumb">
            <a href="/">Home</a> / Book a bike
          </p>
          <h1>
            Book your <span className="gold-text">bike</span>
          </h1>
          <p className="page-sub">
            Sign up, upload your documents and get verified. Once your deposit is in, we assign a bike and hand it over.
          </p>
          <div className="bk-mobile-progress" aria-hidden="true">
            <span>
              Step {Math.min(doneCount + 1, 5)} of 5 · {progress[Math.min(doneCount, 4)].label}
            </span>
            <i>
              <b style={{ width: `${(doneCount / 5) * 100}%` }} />
            </i>
          </div>
        </div>
      </div>

      <div className="bk-wrap">
        {DEMO_MODE && (
          <div className="bk-demo" role="note">
            <strong>Demo mode</strong>
            <span>
              Online booking isn&rsquo;t connected to our systems yet. No SMS is sent, no money is charged and your photos
              aren&rsquo;t uploaded. Staff checks complete automatically after a few seconds.
            </span>
            <button
              className="bk-link"
              type="button"
              onClick={() => {
                dispatch({ type: 'reset' });
                window.scrollTo({ top: 0 });
              }}
            >
              Start over
            </button>
          </div>
        )}

        <div className="bk-layout">
          <Rail state={state} />
          <div className="bk-main">
            <Screen key={step} state={state} dispatch={dispatch} go={go} />
          </div>
        </div>
      </div>
    </main>
  );
}
