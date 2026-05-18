import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Archive,
  ArrowRight,
  Banknote,
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Coins,
  CreditCard,
  FileText,
  IdCard,
  LockKeyhole,
  Menu,
  Plane,
  ReceiptText,
  RefreshCcw,
  Route,
  ShieldAlert,
  Sparkles,
  Timer,
  WalletCards,
} from 'lucide-react';
import './styles.css';
import { routeSteps, routeSummary, providerRows, recordItems } from './routeData';

const STORAGE_KEY = 'cryptoRouteTracker:v1';

const iconMap = {
  prepare: ClipboardCheck,
  taiwan: Banknote,
  kyc: IdCard,
  buy: Coins,
  metamask: WalletCards,
  choose: Route,
  spend: CreditCard,
  dbs: ReceiptText,
  records: Archive,
};

const branchLabels = {
  spend: 'Spend route',
  dbs: 'DBS off-ramp',
};

const roleColors = {
  prepare: ['#7ec8e3', '#ffffff', '#ffb86b'],
  taiwan: ['#8ed7be', '#fff6d8', '#496a55'],
  kyc: ['#9ab6ff', '#eef4ff', '#334a87'],
  buy: ['#ffd166', '#fff4c2', '#755f22'],
  metamask: ['#f7a072', '#fbe1d2', '#7a3d2d'],
  choose: ['#c9a7ff', '#f4eaff', '#5a4180'],
  spend: ['#ff8fab', '#ffe8ef', '#8b3651'],
  dbs: ['#8dd7ff', '#e7f7ff', '#245a73'],
  records: ['#b6df8c', '#f0ffe3', '#41631e'],
};

function getInitialState() {
  if (typeof window === 'undefined') {
    return { completed: [], activeStep: 'metamask', branch: 'dbs', checklist: {} };
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { completed: ['prepare', 'taiwan'], activeStep: 'metamask', branch: 'dbs', checklist: {} };
    }
    const parsed = JSON.parse(saved);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      activeStep: parsed.activeStep || 'metamask',
      branch: parsed.branch === 'spend' ? 'spend' : 'dbs',
      checklist: parsed.checklist && typeof parsed.checklist === 'object' ? parsed.checklist : {},
    };
  } catch {
    return { completed: ['prepare', 'taiwan'], activeStep: 'metamask', branch: 'dbs', checklist: {} };
  }
}

function App() {
  const [state, setState] = useState(getInitialState);
  const [celebration, setCelebration] = useState(null);

  const visibleSteps = useMemo(
    () => routeSteps.filter((step) => !step.branch || step.branch === state.branch),
    [state.branch],
  );
  const activeStep = routeSteps.find((step) => step.id === state.activeStep) || routeSteps[0];
  const completedSet = useMemo(() => new Set(state.completed), [state.completed]);
  const progress = Math.round((visibleSteps.filter((step) => completedSet.has(step.id)).length / visibleSteps.length) * 100);
  const totalTime = state.branch === 'spend' ? '3-7 days first setup' : '3-7 days first time';
  const repeatTime = state.branch === 'spend' ? 'minutes after setup' : '1-2 hours repeat';

  function persist(next) {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function setActiveStep(id) {
    persist({ ...state, activeStep: id });
  }

  function setBranch(branch) {
    const nextActive = branch === 'spend' ? 'spend' : 'dbs';
    persist({ ...state, branch, activeStep: nextActive });
  }

  function toggleStep(id) {
    const isDone = completedSet.has(id);
    const completed = isDone ? state.completed.filter((item) => item !== id) : [...state.completed, id];
    persist({ ...state, completed, activeStep: id });
    if (!isDone) {
      setCelebration(id);
      window.setTimeout(() => setCelebration(null), 900);
    }
  }

  function toggleChecklist(stepId, itemIndex) {
    const key = `${stepId}:${itemIndex}`;
    const checklist = { ...state.checklist, [key]: !state.checklist[key] };
    persist({ ...state, checklist });
  }

  function resetProgress() {
    persist({ completed: [], activeStep: 'prepare', branch: 'dbs', checklist: {} });
  }

  return (
    <main className="app-shell">
      <AmbientBackdrop />
      <Header progress={progress} onReset={resetProgress} />

      <section className="mobile-route-strip" aria-label="Current route">
        <span>Taiwan</span>
        <ArrowRight size={15} />
        <span>MetaMask</span>
        <ArrowRight size={15} />
        <span>{state.branch === 'spend' ? 'Spend' : 'DBS'}</span>
      </section>

      <section className="hero-panel" aria-labelledby="tracker-title">
        <img className="hero-map-art" src="/crypto/assets/route-map-cats.png" alt="" aria-hidden="true" />
        <div>
          <p className="small-label">Personal crypto route progress</p>
          <h1 id="tracker-title">Crypto Route Tracker</h1>
          <p className="hero-copy">
            Follow the Taiwan bank to MetaMask route, choose a spending or DBS off-ramp path, and keep your records tidy.
          </p>
        </div>
        <div className="hero-actions">
          <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}>
            <span>{progress}%</span>
          </div>
          <button className="primary-button" onClick={() => toggleStep(activeStep.id)}>
            <Check size={17} />
            Mark active step
          </button>
        </div>
      </section>

      <section className="tracker-layout" id="route">
        <div className="timeline-card">
          <div className="section-heading">
            <div>
              <p className="small-label">Animated route</p>
              <h2>Your timeline</h2>
            </div>
            <BranchToggle value={state.branch} onChange={setBranch} />
          </div>

          <div className="timeline-stage" aria-label="Crypto route timeline">
            <div className="motion-rail" aria-hidden="true" />
            {visibleSteps.map((step, index) => (
              <TimelineStep
                key={step.id}
                step={step}
                index={index}
                isActive={activeStep.id === step.id}
                isComplete={completedSet.has(step.id)}
                isCelebrating={celebration === step.id}
                checklist={state.checklist}
                onSelect={setActiveStep}
                onToggle={toggleStep}
              />
            ))}
          </div>
        </div>

        <DetailPanel
          step={activeStep}
          branch={state.branch}
          isComplete={completedSet.has(activeStep.id)}
          checklist={state.checklist}
          onToggleStep={toggleStep}
          onToggleChecklist={toggleChecklist}
        />
      </section>

      <section className="summary-grid" id="fees">
        <SummaryTile icon={Timer} label="First-time estimate" value={totalTime} detail="KYC creates most of the waiting time." />
        <SummaryTile icon={Plane} label="Repeat route" value={repeatTime} detail="Once accounts are ready, transfers become much faster." />
        <SummaryTile icon={Coins} label="Expected total cost" value="~1.0%-1.2%" detail="MAX + OKX route, plus low network fee." />
        <SummaryTile icon={ShieldAlert} label="Safety rule" value="Network must match" detail="Wrong chain transfers can be hard or impossible to recover." />
      </section>

      <section className="info-panels" id="checklist">
        <div className="info-card">
          <div className="section-heading">
            <div>
              <p className="small-label">Provider comparison</p>
              <h2>Choose calm infrastructure</h2>
            </div>
            <BookOpenCheck size={24} />
          </div>
          <div className="provider-table">
            {providerRows.map((row) => (
              <div className="provider-row" key={row.name}>
                <strong>{row.name}</strong>
                <span>{row.bestFor}</span>
                <span>{row.fee}</span>
                <span>{row.timing}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="info-card records-card" id="records">
          <div className="section-heading">
            <div>
              <p className="small-label">Records to keep</p>
              <h2>Build your paper trail</h2>
            </div>
            <FileText size={24} />
          </div>
          <div className="record-list">
            {recordItems.map((item) => (
              <span key={item}>
                <ReceiptText size={15} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="disclaimer">
        <strong>Informational use only.</strong> This tracker is not financial, legal, or tax advice. Crypto rules, fees, exchange support,
        and tax treatment can change. Verify providers, network support, and local obligations before sending funds.
      </footer>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <a href="#route"><Route size={18} />Route</a>
        <a href="#checklist"><ClipboardCheck size={18} />Checklist</a>
        <a href="#fees"><Coins size={18} />Fees</a>
        <a href="#records"><Archive size={18} />Records</a>
      </nav>
    </main>
  );
}

function Header({ progress, onReset }) {
  return (
    <header className="topbar">
      <a className="brand" href="#route" aria-label="Crypto Route Tracker home">
        <span className="brand-mark"><Sparkles size={18} /></span>
        <span>Crypto Route Tracker</span>
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <a href="#route">Route</a>
        <a href="#checklist">Checklist</a>
        <a href="#fees">Fees</a>
        <a href="#records">Records</a>
      </nav>
      <div className="topbar-actions">
        <span className="mini-progress">{progress}% done</span>
        <button className="ghost-button" onClick={onReset}>
          <RefreshCcw size={16} />
          Reset
        </button>
        <button className="menu-button" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

function BranchToggle({ value, onChange }) {
  return (
    <div className="branch-toggle" aria-label="Choose route branch">
      {Object.entries(branchLabels).map(([key, label]) => (
        <button key={key} className={value === key ? 'selected' : ''} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function TimelineStep({ step, index, isActive, isComplete, isCelebrating, checklist, onSelect, onToggle }) {
  const Icon = iconMap[step.id] || Route;
  const doneItems = step.checklist.filter((_, itemIndex) => checklist[`${step.id}:${itemIndex}`]).length;

  return (
    <article
      className={`timeline-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
      style={{ '--delay': `${index * 70}ms` }}
    >
      <button className="step-node" onClick={() => onToggle(step.id)} aria-label={`Toggle ${step.title}`}>
        {isComplete ? <Check size={18} /> : <Icon size={18} />}
      </button>
      <button className="step-content" onClick={() => onSelect(step.id)}>
        <CatMascot role={step.id} />
        <span className="step-copy">
          <span className="step-kicker">{step.phase}</span>
          <strong>{step.title}</strong>
          <span>{step.summary}</span>
          <span className="step-meta">
            <span><Timer size={13} />{step.time}</span>
            <span><Coins size={13} />{step.fee}</span>
            <span>{doneItems}/{step.checklist.length} tasks</span>
          </span>
        </span>
        <ChevronRight className="step-arrow" size={19} />
      </button>
      {isCelebrating && <span className="spark-burst" aria-hidden="true">✦</span>}
    </article>
  );
}

function DetailPanel({ step, branch, isComplete, checklist, onToggleStep, onToggleChecklist }) {
  const Icon = iconMap[step.id] || Route;

  return (
    <aside className="detail-panel" aria-label="Selected step details">
      <div className="detail-hero">
        <CatMascot role={step.id} large />
        <div>
          <p className="small-label">{step.phase}</p>
          <h2>{step.title}</h2>
          <p>{step.detail}</p>
        </div>
      </div>

      <div className="detail-stats">
        <span><Timer size={15} />{step.time}</span>
        <span><Coins size={15} />{step.fee}</span>
        <span><LockKeyhole size={15} />{step.riskLevel}</span>
      </div>

      <div className="checklist-group">
        <h3>Checklist</h3>
        {step.checklist.map((item, index) => {
          const key = `${step.id}:${index}`;
          return (
            <button
              className={`check-row ${checklist[key] ? 'checked' : ''}`}
              key={item}
              onClick={() => onToggleChecklist(step.id, index)}
            >
              <span>{checklist[key] ? <Check size={15} /> : index + 1}</span>
              {item}
            </button>
          );
        })}
      </div>

      <div className="risk-note">
        <ShieldAlert size={18} />
        <span>{step.warning}</span>
      </div>

      <button className="primary-button wide" onClick={() => onToggleStep(step.id)}>
        <Check size={18} />
        {isComplete ? 'Mark not complete' : 'Mark complete'}
      </button>

      <div className="route-summary">
        <strong>{branchLabels[branch]}</strong>
        <p>{routeSummary[branch]}</p>
      </div>
    </aside>
  );
}

function SummaryTile({ icon: Icon, label, value, detail }) {
  return (
    <article className="summary-tile">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function CatMascot({ role, large = false }) {
  const [coat, outfit, accent] = roleColors[role] || roleColors.prepare;
  const accessory = {
    prepare: 'clipboard',
    taiwan: 'tag',
    kyc: 'card',
    buy: 'chart',
    metamask: 'key',
    choose: 'sign',
    spend: 'phone',
    dbs: 'receipt',
    records: 'folder',
  }[role];

  return (
    <span className={`cat-wrap ${large ? 'large' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="cat-svg">
        <circle cx="60" cy="66" r="47" fill={outfit} />
        <path d="M31 44 40 18 54 36M89 44 80 18 66 36" fill={coat} stroke="#34251f" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="60" cy="53" r="34" fill={coat} stroke="#34251f" strokeWidth="4" />
        <path d="M32 71c4 23 19 34 28 34s24-11 28-34" fill={outfit} stroke="#34251f" strokeWidth="4" />
        <path d="M42 78h36" stroke={accent} strokeWidth="8" strokeLinecap="round" />
        <circle cx="48" cy="52" r="4" fill="#34251f" />
        <circle cx="72" cy="52" r="4" fill="#34251f" />
        <path d="M58 60h4l-2 4z" fill="#34251f" />
        <path d="M52 68c4 5 12 5 16 0" fill="none" stroke="#34251f" strokeWidth="3" strokeLinecap="round" />
        <path d="M22 58h17M20 68h18M81 58h17M82 68h18" stroke="#34251f" strokeWidth="2.5" strokeLinecap="round" />
        {accessory === 'clipboard' && <rect x="76" y="74" width="20" height="26" rx="4" fill="#fff" stroke="#34251f" strokeWidth="3" />}
        {accessory === 'tag' && <rect x="39" y="77" width="42" height="14" rx="4" fill="#fff" stroke="#34251f" strokeWidth="3" />}
        {accessory === 'card' && <rect x="73" y="73" width="28" height="18" rx="4" fill="#fff" stroke="#34251f" strokeWidth="3" />}
        {accessory === 'chart' && <path d="M78 91h20V72H78zM82 86l4-5 4 3 5-8" fill="#fff" stroke="#34251f" strokeWidth="3" strokeLinejoin="round" />}
        {accessory === 'key' && <path d="M83 80a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm8 8h15m-5 0v7" fill="none" stroke="#34251f" strokeWidth="4" strokeLinecap="round" />}
        {accessory === 'sign' && <path d="M82 74h24l-6 8 6 8H82zM88 90v15" fill="#fff" stroke="#34251f" strokeWidth="3" strokeLinejoin="round" />}
        {accessory === 'phone' && <rect x="80" y="70" width="18" height="32" rx="5" fill="#fff" stroke="#34251f" strokeWidth="3" />}
        {accessory === 'receipt' && <path d="M77 71h23v31l-5-3-5 3-5-3-5 3-3-2z" fill="#fff" stroke="#34251f" strokeWidth="3" strokeLinejoin="round" />}
        {accessory === 'folder' && <path d="M74 79h12l4 5h17v18H74z" fill="#fff2a8" stroke="#34251f" strokeWidth="3" strokeLinejoin="round" />}
      </svg>
    </span>
  );
}

function AmbientBackdrop() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="cloud cloud-a" />
      <span className="cloud cloud-b" />
      <span className="coin coin-a">$</span>
      <span className="coin coin-b">₿</span>
      <span className="route-dot dot-a" />
      <span className="route-dot dot-b" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
