import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Database, Cpu, Settings as SettingsIcon, ExternalLink,
  RefreshCw, Mic, BarChart2, Shield, ShoppingBag,
  GitBranch, CheckSquare, Fingerprint, AlertTriangle, Bot, Calculator as CalculatorIcon,
  Layers, Wand2, Swords, Zap, Activity, Rocket, Headphones, Network, Webhook, Trophy, BookOpen, Users, Eye, Brain, Terminal, Hammer
} from 'lucide-react'
import DataMiner from './pages/DataMiner'
import FineTuneStudio from './pages/FineTuneStudio'
import Flywheel from './pages/Flywheel'
import ExpertElicitor from './pages/ExpertElicitor'
import Evaluation from './pages/Evaluation'
import RedTeam from './pages/RedTeam'
import AnnotationStudio from './pages/AnnotationStudio'
import VersionControl from './pages/VersionControl'
import Marketplace from './pages/Marketplace'
import Settings from './pages/Settings'
import AIChat from './pages/AIChat'
import Dashboard from './pages/Dashboard'
import CostCalculator from './pages/CostCalculator'
import DatasetConverter from './pages/DatasetConverter'
import DatasetInspector from './pages/DatasetInspector'
import AIWizard from './pages/AIWizard'
import SynthFactory from './pages/SynthFactory'
import ModelArena from './pages/ModelArena'
import Deployment from './pages/Deployment'
import AudioMiner from './pages/AudioMiner'
import DNAScanner from './pages/DNAScanner'
import PromptStudio from './pages/PromptStudio'
import Webhooks from './pages/Webhooks'
import Leaderboard from './pages/Leaderboard'
import Logbook from './pages/Logbook'
import TeamWorkspace from './pages/TeamWorkspace'
import SelfHealing from './pages/SelfHealing'
import IPWasher from './pages/IPWasher'
import RLHFTinder from './pages/RLHFTinder'
import PromptCompiler from './pages/PromptCompiler'
import VLAMiner from './pages/VLAMiner'
import PersonaMatrix from './pages/PersonaMatrix'
import ExplainabilityLens from './pages/ExplainabilityLens'
import Evaluator from './pages/Evaluator'
import DeepThink from './pages/DeepThink'
import AgentSandbox from './pages/AgentSandbox'
import SkillForge from './pages/SkillForge'
import KnowledgeGraph from './pages/KnowledgeGraph'
import SwarmStudio from './pages/SwarmStudio'
import FeaturesDirectory from './pages/FeaturesDirectory'
import './index.css'

const RoleContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useRole = () => useContext(RoleContext);

const nav = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`

const SidebarSection = ({ label, children }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>{label}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{children}</div>
  </div>
)

function App() {
  const { t } = useTranslation();
  const [currentRole, setRole] = useState('admin'); // 'admin', 'annotator', 'viewer'

  return (
    <RoleContext.Provider value={{ currentRole, setRole }}>
      <Router>
        <div className="app-container">
        <aside className="sidebar">
          <div className="logo mb-4">
            <NavLink to="/" style={{textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Cpu size={26} color="#ea2804" />
              Hypasia AI
            </NavLink>
          </div>

          <SidebarSection label={t('nav.sources')}>
            <NavLink to="/mine" className={nav}><Database size={18} />{t('nav.miner')}</NavLink>
            <NavLink to="/synth" className={nav}><Zap size={18} />{t('nav.synth')}</NavLink>
            <NavLink to="/audio" className={nav}><Headphones size={18} />Voice & Audio</NavLink>
            <NavLink to="/graph" className={nav}><Network size={18} />Knowledge Graph</NavLink>
            <NavLink to="/convert" className={nav}><Database size={18} />{t('nav.convert')}</NavLink>
            <NavLink to="/matrix" className={nav}><Users size={18} />{t('nav.matrix')}</NavLink>
            <NavLink to="/vlam" className={nav}><Eye size={18} />{t('nav.vlam')}</NavLink>
            <NavLink to="/elicit" className={nav}><Bot size={18} />{t('nav.elicit')}</NavLink>
          </SidebarSection>

          <SidebarSection label={t('nav.training')}>
            <NavLink to="/finetune" className={nav}><SettingsIcon size={18} />{t('nav.finetune')}</NavLink>
            <NavLink to="/prompt" className={nav}><Network size={18} />{t('nav.prompt')}</NavLink>
            <NavLink to="/deepthink" className={nav}><Brain size={18} />DeepThink</NavLink>
            <NavLink to="/arena" className={nav}><Swords size={18} />{t('nav.arena')}</NavLink>
            <NavLink to="/sandbox" className={nav}><Terminal size={18} />Agent Sandbox</NavLink>
            <NavLink to="/evaluator" className={nav}><BarChart2 size={18} />Automated Evaluator</NavLink>
            <NavLink to="/skillforge" className={nav}><Hammer size={18} />Skill Forge</NavLink>
            <NavLink to="/logbook" className={nav}><BookOpen size={18} />{t('nav.logbook')}</NavLink>
            <NavLink to="/calculator" className={nav}><CalculatorIcon size={18} />{t('nav.calculator')}</NavLink>
            <NavLink to="/swarm" className={nav}><Users size={18} />Swarm Studio</NavLink>
            <NavLink to="/wizard" className={nav}><Wand2 size={18} />{t('nav.wizard')}</NavLink>
            <NavLink to="/compiler" className={nav}><Cpu size={18} />{t('nav.compiler')}</NavLink>
            <NavLink to="/eval" className={nav}><BarChart2 size={18} />{t('nav.eval')}</NavLink>
            <NavLink to="/lens" className={nav}><Eye size={18} />{t('nav.lens')}</NavLink>
          </SidebarSection>

          <SidebarSection label={t('nav.management')}>
            <NavLink to="/inspector" className={nav}><AlertTriangle size={18} />{t('nav.inspector')}</NavLink>
            <NavLink to="/versions" className={nav}><GitBranch size={18} />{t('nav.versions')}</NavLink>
            <NavLink to="/annotate" className={nav}><CheckSquare size={18} />{t('nav.annotate')}</NavLink>
            <NavLink to="/washer" className={nav}><Shield size={18} />{t('nav.washer')}</NavLink>
            <NavLink to="/redteam" className={nav}><Shield size={18} />{t('nav.redteam')}</NavLink>
            <NavLink to="/dna" className={nav}><Fingerprint size={18} />{t('nav.dna')}</NavLink>
          </SidebarSection>

          <SidebarSection label={t('nav.production')}>
            <NavLink to="/deploy" className={nav}><Rocket size={18} />{t('nav.deploy')}</NavLink>
            <NavLink to="/rlhf" className={nav}><Activity size={18} />{t('nav.rlhf')}</NavLink>
            <NavLink to="/flywheel" className={nav}><Activity size={18} />{t('nav.flywheel')}</NavLink>
            <NavLink to="/healing" className={nav}><RefreshCw size={18} />{t('nav.healing')}</NavLink>
          </SidebarSection>

          <SidebarSection label={t('nav.platform')}>
            <NavLink to="/team" className={nav}><Users size={18} />{t('nav.team')}</NavLink>
            <NavLink to="/marketplace" className={nav}><ShoppingBag size={18} />{t('nav.marketplace')}</NavLink>
            <NavLink to="/leaderboard" className={nav}><Trophy size={18} />{t('nav.leaderboard')}</NavLink>
            <NavLink to="/features" className={nav}><BookOpen size={18} />Features Overview</NavLink>
          </SidebarSection>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavLink to="/webhooks" className={nav}><Webhook size={18} />{t('nav.webhooks')}</NavLink>
            <NavLink to="/settings" className={nav}><SettingsIcon size={18} />{t('nav.settings')}</NavLink>
            <a href="http://localhost:8000/docs" className="nav-item" target="_blank" rel="noreferrer">
              <ExternalLink size={18} />API Docs
            </a>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mine" element={<DataMiner />} />
            <Route path="/finetune" element={<FineTuneStudio />} />
            <Route path="/calculator" element={<CostCalculator />} />
            <Route path="/flywheel" element={<Flywheel />} />
            <Route path="/elicit" element={<ExpertElicitor />} />
            <Route path="/eval" element={<Evaluation />} />
            <Route path="/redteam" element={<RedTeam />} />
            <Route path="/annotate" element={<AnnotationStudio />} />
            <Route path="/versions" element={<VersionControl />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/convert" element={<DatasetConverter />} />
            <Route path="/inspector" element={<DatasetInspector />} />
            <Route path="/dna" element={<DNAScanner />} />
            <Route path="/washer" element={<IPWasher />} />
            <Route path="/rlhf" element={<RLHFTinder />} />
            <Route path="/deploy" element={<Deployment />} />
            <Route path="/healing" element={<SelfHealing />} />
            <Route path="/audio" element={<AudioMiner />} />
            <Route path="/vlam" element={<VLAMiner />} />
            <Route path="/wizard" element={<AIWizard />} />
            <Route path="/prompt" element={<PromptStudio />} />
            <Route path="/compiler" element={<PromptCompiler />} />
            <Route path="/logbook" element={<Logbook />} />
            <Route path="/synth" element={<SynthFactory />} />
            <Route path="/arena" element={<ModelArena />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/team" element={<TeamWorkspace />} />
            <Route path="/safety" element={<Evaluation />} />
            <Route path="/eval" element={<Evaluation />} />
            <Route path="/lens" element={<ExplainabilityLens />} />
            <Route path="/evaluator" element={<Evaluator />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/matrix" element={<PersonaMatrix />} />
            <Route path="/deepthink" element={<DeepThink />} />
            <Route path="/sandbox" element={<AgentSandbox />} />
            <Route path="/skillforge" element={<SkillForge />} />
            <Route path="/graph" element={<KnowledgeGraph />} />
            <Route path="/swarm" element={<SwarmStudio />} />
            <Route path="/features" element={<FeaturesDirectory />} />
          </Routes>
        </main>
      </div>
    </Router>
    </RoleContext.Provider>
  )
}

export default App
