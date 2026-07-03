"use client";

import React, { useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, Edge, Node } from '@xyflow/react';
import { Search, Terminal, GitBranch, Shield, Cpu, Layers, Clock, CheckCircle2, FileCode, Folder, Code, TerminalSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@xyflow/react/dist/style.css';

type SprintStages = 'initial' | 'hours12' | 'hours35' | 'hours67';

const timelineData: Record<SprintStages, { nodes: Node[]; edges: Edge[] }> = {
  initial: {
    nodes: [
      { id: '1', position: { x: 180, y: 150 }, data: { label: '📂 Workspace Initialized' }, style: { background: '#1e1e2f', color: '#93c5fd', border: '1px solid #3b82f6', borderRadius: '6px', padding: '10px', fontSize: '11px' } }
    ],
    edges: []
  },
  hours12: {
    nodes: [
      { id: '1', position: { x: 80, y: 120 }, data: { label: '⚙️ backend-api (Repo)' }, style: { background: '#1e1e2f', color: '#f472b6', border: '1px solid #f472b6', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
      { id: '2', position: { x: 260, y: 120 }, data: { label: '⚛️ frontend-ui (Repo)' }, style: { background: '#1e1e2f', color: '#34d399', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', fontSize: '11px' } }
    ],
    edges: []
  },
  hours35: {
    nodes: [
      { id: '1', position: { x: 180, y: 40 }, data: { label: '💳 payment-gateway.ts' }, style: { background: '#1e1e2f', color: '#f472b6', border: '1px solid #f472b6', borderRadius: '6px', padding: '10px', fontSize: '11px', fontWeight: 'bold' } },
      { id: '2', position: { x: 40, y: 150 }, data: { label: '📦 order-controller.js' }, style: { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
      { id: '3', position: { x: 300, y: 150 }, data: { label: '🎛️ auth-middleware.ts' }, style: { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
      { id: '4', position: { x: 180, y: 260 }, data: { label: '⚛️ CheckoutButton.tsx' }, style: { background: '#1e1e2f', color: '#34d399', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', fontSize: '11px', fontWeight: 'bold' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#f472b6' } },
      { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: '#34d399', strokeWidth: 1.5 } },
    ]
  },
  hours67: {
    nodes: [
      { id: '1', position: { x: 180, y: 40 }, data: { label: '💳 payment-gateway.ts' }, style: { background: '#1e1e2f', color: '#f472b6', border: '1px solid #f472b6', borderRadius: '6px', padding: '10px', fontSize: '11px', fontWeight: 'bold' } },
      { id: '2', position: { x: 40, y: 140 }, data: { label: '📦 order-controller.js' }, style: { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
      { id: '3', position: { x: 320, y: 140 }, data: { label: '🎛️ auth-middleware.ts' }, style: { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
      { id: '4', position: { x: 180, y: 250 }, data: { label: '⚛️ CheckoutButton.tsx' }, style: { background: '#1e1e2f', color: '#34d399', border: '1px solid #34d399', borderRadius: '6px', padding: '10px', fontSize: '11px', fontWeight: 'bold' } },
      { id: '5', position: { x: 40, y: 250 }, data: { label: '📝 UserProfile.jsx' }, style: { background: '#1e1e2f', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', padding: '10px', fontSize: '11px' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#f472b6' } },
      { id: 'e1-4', source: '1', target: '4', animated: true, style: { stroke: '#34d399', strokeWidth: 1.5 } },
      { id: 'e3-5', source: '3', target: '5', style: { stroke: '#475569' } },
      { id: 'e2-4', source: '2', target: '4', style: { stroke: '#475569' } },
    ]
  }
};

const mockCodeString = `// Location: services/payment-gateway.ts\nexport const processMutation = async (payload: Payload) => {\n  const securityContext = verifyToken(payload.auth);\n  if (!securityContext.valid) throw new AuthError();\n  \n  // CRITICAL STRUCTURAL TRANSFORMATION\n  return database.payments.commit({\n    transactionId: payload.id,\n    amountInCents: payload.total * 100,\n    currencyCode: "INR"\n  });\n};`;

export default function DevTraceDashboard() {
  const [currentStage, setCurrentStage] = useState<SprintStages>('hours67');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsAnalyzing(true);
    setAiResponse('');
    
    setTimeout(() => {
      setIsAnalyzing(false);
      if (searchQuery.toLowerCase().includes('payment')) {
        setAiResponse("⚠️ [Local LLM Audit]: Modifying 'payment-gateway.ts' directly impacts 'CheckoutButton.tsx' via implicit structural dependency. Ensure front-end models map correctly to the updated 'currencyCode' payload keys.");
      } else {
        setAiResponse("🔍 [Local LLM Audit]: System context indexed successfully. No active anomalies discovered inside this repository workspace branch.");
      }
    }, 900);
  };

  const dynamicNodes = useMemo(() => {
    return timelineData[currentStage].nodes.map(node => {
      const label = node.data?.label ? String(node.data.label).toLowerCase() : '';
      const isMatch = searchQuery.trim() !== '' && label.includes(searchQuery.toLowerCase());
      return {
        ...node,
        style: {
          ...node.style,
          boxShadow: isMatch ? '0 0 15px #f472b6' : 'none',
          transform: isMatch ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      };
    });
  }, [currentStage, searchQuery]);

  const edges = timelineData[currentStage].edges;

  return (
    <div className="flex h-screen w-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden text-sm">
      
      {/* SIDEBAR: VS CODE ACTIVITY BAR EXTENSION */}
      <div className="w-16 bg-[#161b22] border-r border-[#30363d] flex flex-col items-center py-4 gap-6 text-[#8b949e]">
        <div className="p-2 text-[#58a6ff] bg-[#1f242c] rounded-lg border border-[#30363d]">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-5 mt-4 items-center w-full">
          <Folder className="w-5 h-5 cursor-pointer text-[#8b949e] hover:text-[#c9d1d9]" />
          <Code className="w-5 h-5 cursor-pointer text-[#58a6ff]" />
          <GitBranch className="w-5 h-5 cursor-pointer hover:text-[#c9d1d9]" />
          <Shield className="w-5 h-5 cursor-pointer text-[#238636]" />
        </div>
      </div>

      {/* VS CODE EXTENSION SIDEBAR PANE */}
      <div className="w-72 bg-[#161b22] border-r border-[#30363d] flex flex-col p-4 gap-4 overflow-hidden select-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8b949e]">Extension Panel</span>
          <h2 className="text-xs font-semibold text-[#f0f6fc] tracking-wide flex items-center gap-1.5">
            DEVTRACE INSTANCE
          </h2>
        </div>

        {/* WORKSPACE STATUS METADATA */}
        <div className="border border-[#30363d] rounded-lg bg-[#0d1117] p-2.5 font-mono text-[11px] flex flex-col gap-1.5 text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]"></span>
            <span>Target: <span className="text-[#f0f6fc]">multi-repo-mesh</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#238636]"></span>
            <span>Status: <span className="text-[#238636] font-medium">AIR-GAPPED RUNNING</span></span>
          </div>
        </div>

        {/* SEMANTIC INPUT CONTAINER */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#8b949e]">Semantic Query Search</label>
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              type="text" 
              placeholder="Query file cross-dependencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-2 pr-8 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] transition-colors placeholder-[#484f58]"
            />
            <button type="submit" className="absolute right-2 top-2 text-[#8b949e] hover:text-[#58a6ff]">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* LOCAL OLLAMA DIAGNOSTIC CONSOLE LOG */}
        <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 font-mono text-[11px] flex flex-col gap-2 overflow-y-auto min-h-0">
          <div className="flex items-center gap-1.5 text-[#8b949e] border-b border-[#30363d] pb-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#d29922]" />
            <span>Ollama AI Logs</span>
          </div>
          
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#58a6ff] animate-pulse">
                &gt; Indexing local Abstract Syntax Tree variables...
              </motion.div>
            )}
            {aiResponse && !isAnalyzing && (
              <motion.div key="output" initial={{ y: 3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[#c9d1d9] leading-relaxed">
                {aiResponse}
              </motion.div>
            )}
            {!aiResponse && !isAnalyzing && (
              <div key="idle" className="text-[#484f58] italic leading-relaxed">
                &gt; Standing by. Type <span className="text-[#34d399] not-italic font-semibold">payment</span> into the search container above to trace graph dependencies.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RE-ARCHITECTED SPLIT-SCREEN WORKBENCH CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* TOP SPLIT INTERACTIVE SHELF PANES */}
        <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0 border-b border-[#30363d]">
          
          {/* LEFT PANEL: SIMULATED SOURCE CODE EDITOR */}
          <div className="bg-[#0d1117] flex flex-col overflow-hidden border-r border-[#30363d]">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2 text-[#f0f6fc]">
                <FileCode className="w-4 h-4 text-[#f472b6]" />
                <span className="font-mono">services/payment-gateway.ts</span>
              </div>
              <span className="text-[10px] text-[#8b949e] font-mono">TypeScript</span>
            </div>
            
            <div className="p-4 font-mono text-xs leading-relaxed text-[#79c0ff] overflow-y-auto whitespace-pre-wrap flex-1 bg-[#090d13]">
              {mockCodeString}
            </div>
          </div>

          {/* RIGHT PANEL: DEVTRACE TOPOLOGY INTERACTIVE MAP */}
          <div className="bg-[#090d13] flex flex-col overflow-hidden relative">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2 text-[#34d399]">
                <Layers className="w-4 h-4" />
                <span className="font-mono font-medium tracking-wide">Topology Canvas Integration</span>
              </div>
              <span className="text-[10px] bg-[#238636]/20 text-[#238636] border border-[#238636]/30 px-1.5 py-0.5 rounded font-mono">LIVE GRAPH</span>
            </div>

            <div className="flex-1 w-full h-full relative">
              <ReactFlow nodes={dynamicNodes} edges={edges} fitView>
                <Background color="#30363d" gap={14} size={1} />
                <Controls className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] fill-[#c9d1d9]" />
              </ReactFlow>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: SPRINT ROADMAP CONTROLLER PANEL */}
        <div className="bg-[#161b22] p-4 border-t border-[#30363d] z-20 select-none">
          <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8b949e] uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#58a6ff]" />
              <span>Sprint Roadmap Panel (Simulated Evaluator Flow Process Control)</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <button 
                type="button"
                onClick={() => setCurrentStage('initial')}
                className={`p-2.5 rounded-md border font-mono text-left transition-all ${currentStage === 'initial' ? 'bg-[#0d1117] border-[#58a6ff] text-[#58a6ff]' : 'bg-[#0d1117]/50 border-[#30363d] text-[#8b949e] hover:border-[#484f58]'}`}
              >
                <div className="text-xs font-semibold">Stage 0</div>
                <div className="text-[10px] mt-0.5 truncate text-[#484f58]">Scaffold Workspace</div>
              </button>

              <button 
                type="button"
                onClick={() => setCurrentStage('hours12')}
                className={`p-2.5 rounded-md border font-mono text-left transition-all ${currentStage === 'hours12' ? 'bg-[#0d1117] border-[#58a6ff] text-[#58a6ff]' : 'bg-[#0d1117]/50 border-[#30363d] text-[#8b949e] hover:border-[#484f58]'}`}
              >
                <div className="text-xs font-semibold">Hours 1-2</div>
                <div className="text-[10px] mt-0.5 truncate text-[#484f58]">M1: UI / M2: Base Data Schema</div>
              </button>

              <button 
                type="button"
                onClick={() => setCurrentStage('hours35')}
                className={`p-2.5 rounded-md border font-mono text-left transition-all ${currentStage === 'hours35' ? 'bg-[#0d1117] border-[#58a6ff] text-[#58a6ff]' : 'bg-[#0d1117]/50 border-[#30363d] text-[#8b949e] hover:border-[#484f58]'}`}
              >
                <div className="text-xs font-semibold">Hours 3-5</div>
                <div className="text-[10px] mt-0.5 truncate text-[#484f58]">M1: Topology Mesh / M2: Query Check</div>
              </button>

              <button 
                type="button"
                onClick={() => setCurrentStage('hours67')}
                className={`p-2.5 rounded-md border font-mono text-left transition-all ${currentStage === 'hours67' ? 'bg-[#0d1117] border-[#238636] text-[#34d399]' : 'bg-[#0d1117]/50 border-[#30363d] text-[#8b949e] hover:border-[#484f58]'}`}
              >
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Hours 6-7</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#238636]" />
                </div>
                <div className="text-[10px] mt-0.5 truncate text-[#238636]/80 font-medium">Build Integration Complete</div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}