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

const roleImageLabels = {
  prepare: 'Approved preparation assistant cat',
  taiwan: 'Approved Taiwan bank teller cat',
  kyc: 'Approved KYC officer cat',
  buy: 'Approved market analyst cat',
  metamask: 'Approved self-custody explorer cat',
  choose: 'Approved route guide cat',
  spend: 'Approved spending route shopper cat',
  dbs: 'Approved DBS off-ramp accountant cat',
  records: 'Approved records archivist cat',
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
  return (
    <span className={`cat-wrap approved-cat ${large ? 'large' : ''}`}>
      <img src={`/crypto/assets/roles/${role}.png`} alt={roleImageLabels[role] || 'Approved route cat character'} />
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
