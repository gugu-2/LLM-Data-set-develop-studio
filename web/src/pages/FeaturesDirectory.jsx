import React from 'react';
import { 
  Cloud, Database, Users, Settings, Shield, Activity, 
  Terminal, Search, Fingerprint, Zap, MessageSquare, Cpu, 
  CheckCircle, Globe, BrainCircuit, Bot
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const FEATURES = [
  {
    category: "1. Enterprise Orchestration & Ecosystem",
    icon: <Cloud size={24} color="#3b82f6" />,
    color: "#eff6ff",
    items: [
      {
        title: "Cloud Orchestrator (1-Click Launch)",
        description: "Operates as a true Control Plane bridging local development and cloud infrastructure.",
        points: [
          "Universal API Key Manager: Securely stores cloud credentials locally.",
          "Cloud Dispatcher: Bypasses manual terminal execution for 1-Click AWS/GCP launches.",
          "Live Telemetry: Streams real-time NDJSON logs back to the Hypasia UI."
        ],
        link: "/deploy"
      },
      {
        title: "The Hypasia Python SDK",
        description: "Hypasia is not just a UI; it is a programmatic ecosystem. `pip install hypasia`",
        points: [
          "Headless Execution: Integrate directly into CI/CD pipelines.",
          "Programmatic Mining & Tuning: Auto-dispatch jobs via python scripts."
        ]
      }
    ]
  },
  {
    category: "2. Intelligent Data Acquisition & Mining",
    icon: <Database size={24} color="#f59e0b" />,
    color: "#fef3c7",
    items: [
      {
        title: "Universal Data Miner",
        description: "The core extraction engine transforming chaos into perfectly structured pairs.",
        points: [
          "Web Crawling: High-precision extraction with Trafilatura and Headless Chromium.",
          "Document Parsing: PDF, DOCX, CSV/Parquet, and plain text routing.",
          "Scoring & Deduplication: LLM-graded quality filtering and Cosine Similarity deduplication."
        ],
        link: "/mine"
      },
      {
        title: "Voice & Audio Miner",
        description: "Designed for extracting high-quality datasets from spoken knowledge.",
        points: [
          "YouTube Integration: Extracts precise transcripts via API.",
          "Audio Chunking: Groups text and generates corresponding instructions dynamically."
        ],
        link: "/audio"
      },
      {
        title: "VLAM Action Miner",
        description: "Futuristic miner for robotics, GUI automation, and computer vision models.",
        points: [
          "Multimodal Capture: Encodes screen states in Base64.",
          "Action Mapping: Maps clicks and keypresses to image states."
        ],
        link: "/vlam"
      }
    ]
  },
  {
    category: "3. Synthetic Data & Multi-Agent Generation",
    icon: <Users size={24} color="#10b981" />,
    color: "#ecfdf5",
    items: [
      {
        title: "Persona Matrix (Multi-Agent Simulation)",
        description: "Generates synthetic data by orchestrating conversations between diverse agents.",
        points: [
          "Agent Avatars: Custom System Prompts for defined personalities.",
          "Turn-Based Ledger: Autonomously manages multi-agent debates for training data."
        ],
        link: "/matrix"
      },
      {
        title: "Synth Factory & Expert Elicitor",
        description: "Data amplification and expert extraction.",
        points: [
          "Data Amplification: Expands a small seed dataset into thousands of diverse variations.",
          "Expert Elicitor: Conducts automated interviews with human domain experts."
        ],
        link: "/synth"
      },
      {
        title: "Zero-to-Model Skill Forge",
        description: "The ultimate game changer: Compile a SKILL.md file directly into a fine-tuned model.",
        points: [
          "Intent Definition: Write a simple SKILL.md defining system prompt, APIs, and examples.",
          "Auto-Simulation: Simulates 5,000 synthetic adversarial conversations.",
          "1-Click Deploy: Automatically triggers a LoRA Fine-Tune and deploys the agent model."
        ],
        link: "/skillforge"
      }
    ]
  },
  {
    category: "4. Model Tuning, Compiling & Engineering",
    icon: <Cpu size={24} color="#8b5cf6" />,
    color: "#f5f3ff",
    items: [
      {
        title: "Fine-Tune Studio & Sweeps",
        description: "The command center for initiating hyper-efficient training runs.",
        points: [
          "Hyperparameter Sweeps: Trains parallel models to test different Learning Rates automatically.",
          "Code Generation: Wraps Unsloth/HuggingFace PEFT scripts for seamless execution."
        ],
        link: "/finetune"
      },
      {
        title: "Universal Prompt Compiler",
        description: "A highly advanced AST-based compilation engine for prompts.",
        points: [
          "AST Generation: Parses prompts into logic trees.",
          "Token Compression: Strips redundant phrasing and whitespace."
        ],
        link: "/compiler"
      }
    ]
  },
  {
    category: "5. Data Curation, Safety & Compliance",
    icon: <Shield size={24} color="#ef4444" />,
    color: "#fef2f2",
    items: [
      {
        title: "IP Washer & Ledger",
        description: "Ensures no copyrighted or sensitive data enters your model.",
        points: [
          "Regex & NLP Scrubbing: Removes PII like Emails, Phones, and SSNs.",
          "Cryptographic Ledger: SHA-256 hashed proof of dataset cleanliness."
        ],
        link: "/washer"
      },
      {
        title: "DNA Scanner (Bias & Toxicity)",
        description: "Profiles the sociological footprint of your training data.",
        points: [
          "Toxicity Radar: Scans for hate speech and NSFW content.",
          "Bias Detection: Analyzes demographic and political distributions."
        ],
        link: "/dna"
      }
    ]
  },
  {
    category: "6. Evaluation & Deployment",
    icon: <Activity size={24} color="#06b6d4" />,
    color: "#ecfeff",
    items: [
      {
        title: "Automated Evaluator",
        description: "Pits Fine-Tuned models against Base models autonomously.",
        points: [
          "Synthetic Prompt Generation: Creates highly rigorous edge-case prompts.",
          "3D & Radar Visualization: Maps complexity, score, and domain mastery."
        ],
        link: "/evaluator"
      },
      {
        title: "RLHF Tinder Swipe",
        description: "Human-in-the-loop alignment made fun and fast.",
        points: [
          "Side-by-Side: Presents dual model responses.",
          "Swipe Mechanics: Swipe Right (Preferred) or Left (Rejected) for DPO datasets."
        ],
        link: "/rlhf"
      },
      {
        title: "Self-Healing Loop",
        description: "Autonomous maintenance for production models.",
        points: [
          "Monitor & Mine: Targets hallucination failures via user 'thumbs down'.",
          "Auto-Branches: Creates new targeted datasets to patch the gaps overnight."
        ],
        link: "/healing"
      }
    ]
  }
];

export default function FeaturesDirectory() {
  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="display-font" style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>Features Overview</h1>
        <p style={{ color: 'var(--charcoal)', fontSize: '1.1rem', maxWidth: '800px' }}>
          Hypasia AI is an enterprise-grade, end-to-end AI infrastructure platform. 
          Below is a comprehensive breakdown of every feature, module, and system integrated into the ecosystem.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {FEATURES.map((section, idx) => (
          <div key={idx} className="surface-card fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ background: section.color, padding: '0.75rem', borderRadius: '12px' }}>
                {section.icon}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ink)' }}>{section.category}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ background: 'var(--surface-bone)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.title}
                    {item.link && (
                      <NavLink to={item.link} style={{ color: 'var(--primary)', background: 'rgba(234, 40, 4, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Go to Feature
                      </NavLink>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--charcoal)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                  <ul style={{ margin: 'auto 0 0 0', paddingLeft: '1.25rem', color: 'var(--mute)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {item.points.map((point, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: '0.25rem' }}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
