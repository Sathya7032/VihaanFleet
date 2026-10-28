/**
 * Screens of the driver booking flow (/book-bike). Each step only talks to
 * driverApi and the booking reducer.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DOCUMENTS, FEES, OTP_RULES, PHOTO_RULES, PLANS, STATUS, VEHICLE_TYPES, atLeast, formatINR } from './config';
import { DEMO_MODE, DEMO_OTP, driverApi } from './driverApi';
import { CONTACT } from '../content/sitePages';
import Icon from './icons';


function Spinner() {
  return <span className="bk-spin" aria-hidden="true" />;
}

function ErrorLine({ children }) {
  if (!children) return null;
  return (
    <p className="bk-error" role="alert">
      {children}
    </p>
  );
}

export function StepCard({ eyebrow, title, sub, children, footer }) {
  const headRef = useRef(null);
  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="bk-card" aria-labelledby="bk-step-title">
      <header className="bk-card-head">
        {eyebrow && <p className="bk-eyebrow">{eyebrow}</p>}
        <h2 id="bk-step-title" ref={headRef} tabIndex={-1}>
          {title}
        </h2>
        {sub && <p className="bk-sub">{sub}</p>}
      </header>
      <div className="bk-card-body">{children}</div>
      {footer && <footer className="bk-card-foot">{footer}</footer>}
    </section>
  );
}

/* ------------------------------------------------- 1. phone number + OTP */
export function PhoneStep({ state, dispatch }) {
  const [phone, setPhone] = useState(state.phone);
  const [name, setName] = useState(state.name);
  const [consent, setConsent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phoneOk = /^[6-9]\d{9}$/.test(phone);
  const nameOk = name.trim().length >= 3;

  async function sendOtp(e) {
    e?.preventDefault();
    setError('');
    if (!nameOk) return setError('Enter your full name as it appears on your driving licence.');
    if (!phoneOk) return setError('Enter a valid 10-digit Indian mobile number.');
    if (!consent) return setError('Please accept the Terms and Privacy Policy to continue.');
    setBusy(true);
    try {
      const res = await driverApi.sendOtp(phone);
      setOtpSent(true);
      setOtp('');
      setResendIn(res.resendAfter);
      setTimeout(() => otpRef.current?.focus(), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== OTP_RULES.length) return setError(`Enter the ${OTP_RULES.length}-digit code.`);
    setBusy(true);
    try {
      const res = await driverApi.verifyOtp(phone, otp);
      dispatch({ type: 'otpVerified', phone, name: name.trim(), driverId: res.driverId });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (otpSent) {
    return (
      <StepCard
        eyebrow="Step 1 · Sign up"
        title="Enter the code"
        sub={
          <>
            We sent a {OTP_RULES.length}-digit code by SMS to <strong>+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</strong>.
          </>
        }
      >
        <form onSubmit={verify} noValidate>
          <label className="bk-label" htmlFor="bk-otp">
            One-time code
          </label>
          <input
            id="bk-otp"
            ref={otpRef}
            className="bk-input bk-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_RULES.length}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_RULES.length))}
            placeholder={'•'.repeat(OTP_RULES.length)}
            aria-describedby={DEMO_MODE ? 'bk-otp-hint' : undefined}
          />
          {DEMO_MODE && (
            <p className="bk-hint" id="bk-otp-hint">
              Demo mode: no SMS is sent. Use <strong>{DEMO_OTP}</strong> (any 6 digits work).
            </p>
          )}
          <ErrorLine>{error}</ErrorLine>
          <div className="bk-actions">
            <button className="btn btn-gold" type="submit" disabled={busy}>
              {busy ? <Spinner /> : null} Verify and continue
            </button>
            <button
              className="bk-link"
              type="button"
              onClick={() => {
                setOtpSent(false);
                setError('');
              }}
            >
              Change number
            </button>
            <button className="bk-link" type="button" disabled={resendIn > 0 || busy} onClick={sendOtp}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      </StepCard>
    );
  }

  return (
    <StepCard
      eyebrow="Step 1 · Sign up"
      title="Let's get you on a bike"
      sub="Sign up with your mobile number. It takes about 10 minutes to finish with your documents ready."
    >
      <form onSubmit={sendOtp} noValidate>
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-name">
            Full name
          </label>
          <input
            id="bk-name"
            className="bk-input"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="As on your driving licence"
          />
        </div>
        <div className="bk-field">
          <label className="bk-label" htmlFor="bk-phone">
            Mobile number
          </label>
          <div className="bk-phone">
            <span aria-hidden="true">+91</span>
            <input
              id="bk-phone"
              className="bk-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
            />
          </div>
          <p className="bk-hint">Use the number you will keep. Your handover code is sent to it.</p>
        </div>
        <label className="bk-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noreferrer">
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            , and to receive SMS about my booking.
          </span>
        </label>
        <ErrorLine>{error}</ErrorLine>
        <div className="bk-actions">
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy ? <Spinner /> : null} Send OTP
          </button>
        </div>
      </form>
    </StepCard>
  );
}

/* ---------------------------------------------------------- 2. vehicle */
function OptionCard({ checked, onSelect, name, value, icon, title, children, badge }) {
  return (
    <label className={`bk-option${checked ? ' is-on' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} />
      <span className="bk-option-top">
        {icon && <span className="bk-option-icon">{icon}</span>}
        <span className="bk-option-title">{title}</span>
        {badge && <span className="bk-badge">{badge}</span>}
        <span className="bk-radio" aria-hidden="true">
          {Icon.check}
        </span>
      </span>
      {children}
    </label>
  );
}

export function VehicleStep({ state, dispatch, go }) {
  const [choice, setChoice] = useState(state.vehicleType);
  return (
    <StepCard eyebrow="Step 1 · Sign up" title="Which vehicle do you want?" sub="Pick the type of bike you want to ride.">
      <fieldset className="bk-options">
        <legend className="sr-only">Vehicle type</legend>
        {VEHICLE_TYPES.map((v) => (
          <OptionCard
            key={v.id}
            name="vehicle"
            value={v.id}
            checked={choice === v.id}
            onSelect={() => setChoice(v.id)}
            icon={v.id === 'ev_scooter' ? Icon.bolt : Icon.fuel}
            title={v.name}
            badge={v.id === 'ev_scooter' ? 'Most available' : null}
          >
            <span className="bk-option-text">{v.note}</span>
          </OptionCard>
        ))}
      </fieldset>
      <div className="bk-actions">
        <button
          className="btn btn-gold"
          type="button"
          disabled={!choice}
          onClick={() => {
            dispatch({ type: 'set', patch: { vehicleType: choice } });
            go('plan');
          }}
        >
          Continue
        </button>
      </div>
    </StepCard>
  );
}

/* ------------------------------------------------------------ 3. plan */
export function PlanStep({ state, dispatch, go }) {
  const [choice, setChoice] = useState(state.plan);
  return (
    <StepCard
      eyebrow="Step 1 · Sign up"
      title="Choose your plan"
      sub={`Both plans have the same one-time ${formatINR(FEES.documentFee)} document fee. Your deposit is paid only after you are verified.`}
    >
      <fieldset className="bk-options bk-plans">
        <legend className="sr-only">Plan</legend>
        {Object.values(PLANS).map((p) => (
          <OptionCard
            key={p.id}
            name="plan"
            value={p.id}
            checked={choice === p.id}
            onSelect={() => setChoice(p.id)}
            title={p.name}
            badge={p.id === 'own' ? 'Own it in 3 years' : 'Most flexible'}
          >
            <span className="bk-plan-price">
              {p.id === 'own' ? (
                <>
                  <strong className="gold-text">{formatINR(p.daily)}</strong>
                  <small>/day for 3 years</small>
                </>
              ) : (
                <>
                  <small>from</small> <strong className="gold-text">{formatINR(p.rentFrom)}</strong>
                  <small>/day</small>
                </>
              )}
            </span>
            <span className="bk-option-text">{p.tagline}</span>
            <span className="bk-plan-deposit">
              Deposit {formatINR(p.deposit)} · {p.depositRefundable ? 'refundable' : 'not refundable'}
            </span>
            <ul className="bk-ticks">
              {p.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </OptionCard>
        ))}
      </fieldset>
      <div className="bk-actions">
        <button
          className="btn btn-gold"
          type="button"
          disabled={!choice}
          onClick={() => {
            dispatch({ type: 'set', patch: { plan: choice } });
            go('agreement');
          }}
        >
          Continue
        </button>
        <button className="bk-link" type="button" onClick={() => go('vehicle')}>
          Back
        </button>
      </div>
    </StepCard>
  );
}

/* ------------------------------------------------------- 4. agreement */
export function AgreementStep({ state, dispatch, go }) {
  const plan = PLANS[state.plan];
  const [read, setRead] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) setRead(true);
  }, []);

  async function accept() {
    setBusy(true);
    setError('');
    try {
      const res = await driverApi.register({
        vehicleType: state.vehicleType,
        plan: plan.id,
        agreementVersion: plan.agreementVersion,
      });
      dispatch({
        type: 'registered',
        agreement: { title: plan.agreementTitle, version: plan.agreementVersion, at: res.acceptedAt },
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepCard
      eyebrow="Step 1 · Sign up"
      title={plan.agreementTitle}
      sub="Read the key terms of your plan. You accept them once, here; they apply from the day your bike is handed over."
    >
      <div
        className="bk-agreement"
        ref={boxRef}
        tabIndex={0}
        aria-label={`${plan.agreementTitle} terms`}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setRead(true);
        }}
      >
        <p className="bk-agreement-meta">
          Between Vihaan Fleet Private Limited and {state.name || 'the driver'}
          {plan.agreementVersion ? ` · Version ${plan.agreementVersion}` : ''}
        </p>
        <ol>
          {plan.agreement.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <p className="bk-agreement-meta">
          The full contract with your bike&rsquo;s details is generated when a bike is assigned to you. Our{' '}
          <a href="/terms" target="_blank" rel="noreferrer">
            Terms
          </a>{' '}
          and{' '}
          <a href="/refund" target="_blank" rel="noreferrer">
            Refund Policy
          </a>{' '}
          also apply.
        </p>
      </div>
      {!read && <p className="bk-hint">Scroll to the end of the terms to continue.</p>}
      <label className={`bk-check${read ? '' : ' is-disabled'}`}>
        <input type="checkbox" disabled={!read} checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>
          I, {state.name || 'the driver'}, have read and accept the {plan.agreementTitle}.
        </span>
      </label>
      <ErrorLine>{error}</ErrorLine>
      <div className="bk-actions">
        <button className="btn btn-gold" type="button" disabled={!accepted || busy} onClick={accept}>
          {busy ? <Spinner /> : null} Accept and continue
        </button>
        <button className="bk-link" type="button" onClick={() => go('plan')}>
          Back
        </button>
      </div>
    </StepCard>
  );
}

/* ------------------------------------------------------- 5. documents */
function DocTile({ doc, uploaded, onUploaded, onRemove }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const camRef = useRef(null);
  const galRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  async function handle(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) return setError('Photos only (JPG or PNG). PDFs are not accepted.');
    if (file.size > PHOTO_RULES.maxBytes) return setError('This photo is over 10 MB. Try again with a smaller one.');
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      const res = await driverApi.uploadDocument(doc.id, file);
      onUploaded(doc.id, res.uploadedAt);
    } catch (err) {
      setPreview(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const state = busy ? 'busy' : uploaded ? 'done' : 'empty';
  return (
    <li className={`bk-doc is-${state}${doc.selfie ? ' is-selfie' : ''}`}>
      <div className="bk-doc-thumb">
        {preview ? (
          <img src={preview} alt={`${doc.label} preview`} />
        ) : uploaded ? (
          <span className="bk-doc-ok">{Icon.check}</span>
        ) : (
          <span className="bk-doc-ph">{doc.selfie ? Icon.camera : Icon.image}</span>
        )}
        {busy && (
          <span className="bk-doc-busy">
            <Spinner />
          </span>
        )}
      </div>
      <div className="bk-doc-info">
        <p className="bk-doc-name">
          {doc.label}
          {!doc.required && <span className="bk-optional">Optional</span>}
        </p>
        <p className="bk-doc-state">{busy ? 'Uploading…' : uploaded ? 'Uploaded' : doc.selfie ? 'Face clearly visible, no cap or glasses' : 'All four corners visible, no glare'}</p>
        <ErrorLine>{error}</ErrorLine>
        <div className="bk-doc-btns">
          <button className="bk-mini" type="button" disabled={busy} onClick={() => camRef.current?.click()}>
            {Icon.camera} {uploaded ? 'Retake' : 'Camera'}
          </button>
          <button className="bk-mini" type="button" disabled={busy} onClick={() => galRef.current?.click()}>
            {Icon.image} Gallery
          </button>
          {uploaded && !doc.required && (
            <button
              className="bk-mini bk-mini-quiet"
              type="button"
              onClick={() => {
                setPreview(null);
                onRemove(doc.id);
              }}
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={camRef}
          type="file"
          accept={PHOTO_RULES.accept}
          capture={doc.selfie ? 'user' : 'environment'}
          hidden
          onChange={handle}
          data-doc={doc.id}
          data-src="camera"
        />
        <input ref={galRef} type="file" accept={PHOTO_RULES.accept} hidden onChange={handle} data-doc={doc.id} data-src="gallery" />
      </div>
    </li>
  );
}

export function DocumentsStep({ state, dispatch, go }) {
  const required = DOCUMENTS.filter((d) => d.required);
  const done = required.filter((d) => state.docs[d.id]).length;
  const ready = done === required.length;
  return (
    <StepCard
      eyebrow="Step 2 · Documents"
      title="Upload your documents"
      sub="Take a photo with your camera or choose one from your gallery. Photos only, no PDFs."
    >
      <div className="bk-progress" aria-label={`${done} of ${required.length} required documents uploaded`}>
        <span style={{ width: `${(done / required.length) * 100}%` }} />
      </div>
      <p className="bk-hint">
        {done} of {required.length} required photos uploaded
      </p>
      <ul className="bk-docs">
        {DOCUMENTS.map((d) => (
          <DocTile
            key={d.id}
            doc={d}
            uploaded={!!state.docs[d.id]}
            onUploaded={(docId, at) => dispatch({ type: 'docUploaded', docId, at })}
            onRemove={(docId) => dispatch({ type: 'docRemoved', docId })}
          />
        ))}
      </ul>
      <p className="bk-note">
        {Icon.shield}
        <span>
          Your documents are used only to verify you and are checked by our team.
          {DEMO_MODE && ' Demo mode: photos stay on this device and are not uploaded or saved anywhere.'}
        </span>
      </p>
      <div className="bk-actions">
        <button className="btn btn-gold" type="button" disabled={!ready} onClick={() => go('fee')}>
          Continue to document fee
        </button>
      </div>
    </StepCard>
  );
}

/* ---------------------------------------------------- UPI payment sheet */
export function UpiSheet({ amount, title, onClose, onPaid }) {
  const [busy, setBusy] = useState(false);
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);
  // portalled: the card's backdrop-filter would otherwise trap position:fixed
  return createPortal(
    <div className="bk-sheet-wrap" role="presentation" onClick={() => !busy && onClose()}>
      <div
        className="bk-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bk-sheet-head">
          <p className="bk-eyebrow">Pay by UPI</p>
          <button ref={closeRef} className="bk-sheet-x" type="button" onClick={onClose} disabled={busy} aria-label="Close">
            ×
          </button>
        </div>
        <h3 id="bk-sheet-title">{title}</h3>
        <p className="bk-sheet-amount gold-text">{formatINR(amount)}</p>
        <p className="bk-sheet-to">Paying Vihaan Fleet Private Limited</p>
        {DEMO_MODE ? (
          <p className="bk-demo-inline">Demo checkout: no UPI app opens and no money is charged.</p>
        ) : (
          <p className="bk-hint">Your UPI app opens to approve the payment.</p>
        )}
        <button
          className="btn btn-gold bk-sheet-pay"
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onPaid();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <>
              <Spinner /> Waiting for confirmation…
            </>
          ) : (
            `Pay ${formatINR(amount)}`
          )}
        </button>
        <p className="bk-sheet-small">Secured by Cashfree Payments. Refunds only go back to the account you paid from.</p>
      </div>
    </div>,
    document.body
  );
}

/* --------------------------------------------------- 6. document fee */
export function FeeStep({ state, dispatch, go }) {
  const plan = PLANS[state.plan];
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    setBusy(true);
    setError('');
    try {
      setOrder(await driverApi.createPaymentOrder('document_fee', state));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    try {
      const res = await driverApi.confirmPayment(order.orderId);
      await driverApi.submitDocuments();
      setOrder(null);
      dispatch({ type: 'feePaid', payment: { receipt: res.receipt, amount: order.amount, at: res.paidAt } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setOrder(null);
      setError(err.message);
    }
  }

  return (
    <StepCard
      eyebrow="Step 2 · Documents"
      title="Pay the document fee"
      sub="A one-time fee that covers checking your documents and the home visit."
    >
      <dl className="bk-bill">
        <div>
          <dt>Document fee</dt>
          <dd>{formatINR(FEES.documentFee)}</dd>
        </div>
        <div className="bk-bill-total">
          <dt>Pay now</dt>
          <dd className="gold-text">{formatINR(FEES.documentFee)}</dd>
        </div>
      </dl>
      <div className="bk-later">
        <p className="bk-label">Later, after you are verified</p>
        <p>
          {plan.name} deposit: <strong>{formatINR(plan.deposit)}</strong>{' '}
          {plan.depositRefundable ? '(refundable at exit)' : '(part of the plan, not refundable)'}
        </p>
      </div>
      <ErrorLine>{error}</ErrorLine>
      <div className="bk-actions">
        <button className="btn btn-gold" type="button" disabled={busy} onClick={start}>
          {busy ? <Spinner /> : null} Pay {formatINR(FEES.documentFee)} by UPI
        </button>
        <button className="bk-link" type="button" onClick={() => go('documents')}>
          Back to documents
        </button>
      </div>
      {order && <UpiSheet amount={order.amount} title="Document fee" onClose={() => setOrder(null)} onPaid={pay} />}
    </StepCard>
  );
}

/* ------------------------------------------------ 7. status / tracking */
const dateFmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export function StatusStep({ state, dispatch }) {
  const plan = PLANS[state.plan];
  const { status, assignment } = state;
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function startDeposit() {
    setBusy(true);
    setError('');
    try {
      setOrder(await driverApi.createPaymentOrder('deposit', state));
    } catch (err) {
      setError(err.message); // e.g. DEPOSIT_NOT_YET before verification
    } finally {
      setBusy(false);
    }
  }
  async function payDeposit() {
    try {
      const res = await driverApi.confirmPayment(order.orderId);
      setOrder(null);
      dispatch({ type: 'depositPaid', payment: { receipt: res.receipt, amount: order.amount, at: res.paidAt } });
    } catch (err) {
      setOrder(null);
      setError(err.message);
    }
  }

  const verified = atLeast(status, STATUS.BACKGROUND_VERIFIED);
  const handedOver = status === STATUS.ACTIVE;
  // first payment day = the day after handover (statusAt is when ACTIVE was set)
  const tomorrow = new Date((state.statusAt || 0) + 86400000);

  const items = [
    {
      key: 'signup',
      title: 'Signed up',
      text: `${plan.name} · ${state.agreement?.title || ''} accepted`,
      state: 'done',
    },
    {
      key: 'docs',
      title: 'Documents and fee',
      text: state.feePayment ? `Document fee paid · Receipt ${state.feePayment.receipt}` : 'Waiting',
      state: state.feePayment ? 'done' : 'now',
    },
    {
      key: 'kyc',
      title: 'Document check',
      text: atLeast(status, STATUS.KYC_VERIFIED)
        ? 'Your documents are verified.'
        : 'Our team is checking each document. You will get an SMS if a photo needs to be retaken.',
      state: atLeast(status, STATUS.KYC_VERIFIED) ? 'done' : 'now',
    },
    {
      key: 'visit',
      title: 'Home verification',
      text: verified
        ? 'Field verification complete.'
        : 'A field officer visits your address to verify it. Keep your original licence, PAN and Aadhaar ready.',
      state: verified ? 'done' : status === STATUS.KYC_VERIFIED ? 'now' : 'next',
    },
    {
      key: 'deposit',
      title: `${plan.depositRefundable ? 'Security deposit' : 'Plan deposit'} · ${formatINR(plan.deposit)}`,
      text: state.depositPayment
        ? `Paid · Receipt ${state.depositPayment.receipt}`
        : verified
          ? 'You are verified. Pay your deposit to get a bike assigned.'
          : 'Opens once your verification is complete.',
      state: state.depositPayment ? 'done' : verified ? 'now' : 'locked',
      action: !state.depositPayment && verified,
    },
    {
      key: 'handover',
      title: 'Bike assignment and handover',
      text: handedOver
        ? `${assignment?.bike} · ${assignment?.reg}`
        : assignment
          ? 'Your bike is ready. Show the handover code to the field officer when you collect it.'
          : state.depositPayment
            ? 'We are assigning a bike to you. You will get an SMS with the time and place.'
            : 'After your deposit.',
      state: handedOver ? 'done' : state.depositPayment ? 'now' : 'next',
    },
    {
      key: 'active',
      title: 'On the road',
      text: handedOver
        ? plan.id === 'own'
          ? `Your first ${formatINR(plan.daily)} instalment is due ${dateFmt(tomorrow)}.`
          : `Your daily rent starts ${dateFmt(tomorrow)}.`
        : plan.id === 'own'
          ? `${formatINR(plan.daily)} a day starts the day after handover.`
          : 'Daily rent starts the day after handover.',
      state: handedOver ? 'done' : 'next',
    },
  ];

  const headline = handedOver
    ? { title: "You're on the road", sub: `Your bike is handed over. Ride safe, ${state.name.split(' ')[0]}.` }
    : assignment
      ? { title: 'Your bike is ready', sub: 'Collect it with your handover code.' }
      : state.depositPayment
        ? { title: 'Deposit received', sub: 'We are assigning a bike to you.' }
        : verified
          ? { title: "You're verified", sub: 'One step left: pay your deposit.' }
          : { title: 'Application submitted', sub: 'We are verifying your details. This page updates as each step is done.' };

  return (
    <StepCard eyebrow={`Booking status · ${status.replace(/_/g, ' ')}`} title={headline.title} sub={headline.sub}>
      {assignment && !handedOver && (
        <div className="bk-handover">
          <div>
            <p className="bk-label">Handover code</p>
            <p className="bk-code" aria-label={`Handover code ${assignment.code.split('').join(' ')}`}>
              {assignment.code}
            </p>
            <p className="bk-hint">Also sent by SMS to +91 {state.phone}. Share it only with the field officer, in person.</p>
          </div>
          <dl className="bk-bike">
            <div>
              <dt>Bike</dt>
              <dd>{assignment.bike}</dd>
            </div>
            <div>
              <dt>Number</dt>
              <dd>{assignment.reg}</dd>
            </div>
            <div>
              <dt>Collect at</dt>
              <dd>{assignment.hub}</dd>
            </div>
          </dl>
        </div>
      )}

      <ol className="bk-timeline">
        {items.map((it) => (
          <li key={it.key} className={`is-${it.state}`}>
            <span className="bk-dot" aria-hidden="true">
              {it.state === 'done' ? Icon.check : it.state === 'locked' ? Icon.lock : null}
            </span>
            <div>
              <p className="bk-tl-title">
                {it.title}
                <span className="sr-only">
                  {' '}
                  ({it.state === 'done' ? 'done' : it.state === 'now' ? 'in progress' : it.state === 'locked' ? 'locked' : 'upcoming'})
                </span>
              </p>
              <p className="bk-tl-text">{it.text}</p>
              {it.action && (
                <>
                  <p className="bk-tl-note">
                    {plan.depositRefundable
                      ? 'Refundable when you return the bike, minus any unpaid dues or damage.'
                      : 'Part of your Own-the-bike plan. It is not refunded.'}
                  </p>
                  <button className="btn btn-gold bk-tl-btn" type="button" disabled={busy} onClick={startDeposit}>
                    {busy ? <Spinner /> : null} Pay {formatINR(plan.deposit)} by UPI
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
      <ErrorLine>{error}</ErrorLine>

      {handedOver && (
        <div className="bk-next">
          <p>
            Pay your {plan.id === 'own' ? 'daily instalments' : 'daily rent'}, see receipts and get support in the Vihaan Fleet
            driver app.
          </p>
          <a className="btn btn-ghost" href={CONTACT.phoneHref}>
            Call {CONTACT.phone}
          </a>
        </div>
      )}
      {!handedOver && (
        <p className="bk-hint bk-help">
          Questions? Call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> ({CONTACT.hours}).
        </p>
      )}
      {order && (
        <UpiSheet
          amount={order.amount}
          title={plan.depositRefundable ? 'Security deposit' : 'Own-the-bike deposit'}
          onClose={() => setOrder(null)}
          onPaid={payDeposit}
        />
      )}
    </StepCard>
  );
}
