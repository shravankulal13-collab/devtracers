"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, Edge, Node } from '@xyflow/react';
import { Search, Terminal, GitBranch, Shield, Cpu, Layers, Clock, CheckCircle2, FileCode, Folder, Code, ChevronRight, GitCommit, Settings, HelpCircle, FileText, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@xyflow/react/dist/style.css';

type SprintStages = 'initial' | 'hours12' | 'hours35' | 'hours67';

interface CodeToken { text: string; className: string }
type CodeLine = CodeToken[];

function tokenizeCode(content: string, filename: string): CodeLine[] {
  const lines = content.split('\n');
  return lines.map(lineText => {
    if (lineText.trim().startsWith('//')) {
      return [{ text: lineText, className: 'syn-comment' }];
    }
    const tokens: CodeToken[] = [];
    const words = lineText.split(/(\s+|\(|\)|\{|\}|\[|\]|\.|=|,|:|;)/);
    
    words.forEach(word => {
      if (!word) return;
      if (['export', 'const', 'async', 'return', 'if', 'throw', 'new', 'import', 'from', 'function', 'require', 'exports'].includes(word.trim())) {
        tokens.push({ text: word, className: 'syn-keyword' });
      } else if (['Payload', 'AuthError'].includes(word.trim())) {
        tokens.push({ text: word, className: 'syn-type' });
      } else if (word.trim().match(/^['"`].*['"`]$/) || word.trim().startsWith('"') || word.trim().endsWith('"')) {
        tokens.push({ text: word, className: 'syn-string' });
      } else if (word.trim().match(/^\d+$/)) {
        tokens.push({ text: word, className: 'syn-number' });
      } else if (['=', '.', ':', ';', '(', ')', '{', '}', '[', ']'].includes(word.trim())) {
        tokens.push({ text: word, className: 'syn-operator' });
      } else if (['verifyToken', 'processMutation', 'commit', 'CheckoutButton', 'UserProfile', 'createOrder', 'log', 'json'].includes(word.trim())) {
        tokens.push({ text: word, className: 'syn-function' });
      } else if (word.trim().length > 0) {
        tokens.push({ text: word, className: 'syn-variable' });
      } else {
        tokens.push({ text: word, className: '' });
      }
    });
    return tokens;
  });
}

const stageData = [
  { key: 'initial', label: 'Stage 0', subtitle: 'Scaffold Workspace', commit: 'Init project template' },
  { key: 'hours12', label: 'Hours 1-2', subtitle: 'M1: UI / M2: Base Data', commit: 'Feature/base-models' },
  { key: 'hours35', label: 'Hours 3-5', subtitle: 'M1: Topology / M2: Query', commit: 'Feature/topology-mesh' },
  { key: 'hours67', label: 'Hours 6-7', subtitle: 'Integration Complete', commit: 'Release/v1.0.0-integration' },
];

export default function DevTraceDashboard() {
  const [currentStage, setCurrentStage] = useState<SprintStages>('hours67');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // DB States
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('services/payment-gateway.ts');
  const [editingContent, setEditingContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Fetch active graph data from SQLite
  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(`/api/graph?stage=${currentStage}`);
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);
      if (data.files) {
        setWorkspaceFiles(data.files);
        // Sync editing content when files load
        const currentFile = data.files.find((f: any) => f.filename === selectedFile);
        if (currentFile) setEditingContent(currentFile.content);
      }
    } catch (err) {
      console.error("Failed to load graph:", err);
    }
  }, [currentStage, selectedFile]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Handle file switches
  const handleFileChange = (filename: string) => {
    setSelectedFile(filename);
    const targetFile = workspaceFiles.find(f => f.filename === filename);
    if (targetFile) {
      setEditingContent(targetFile.content);
    }
  };

  // Node clicks map to file select
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const cleanLabel = node.data?.label ? String(node.data.label) : '';
    let targetFile = '';
    
    if (cleanLabel.includes('payment-gateway.ts')) targetFile = 'services/payment-gateway.ts';
    else if (cleanLabel.includes('order-controller.js')) targetFile = 'controllers/order-controller.js';
    else if (cleanLabel.includes('auth-middleware.ts')) targetFile = 'middleware/auth-middleware.ts';
    else if (cleanLabel.includes('CheckoutButton.tsx')) targetFile = 'components/CheckoutButton.tsx';
    else if (cleanLabel.includes('UserProfile.jsx')) targetFile = 'components/UserProfile.jsx';

    if (targetFile && workspaceFiles.some(f => f.filename === targetFile)) {
      handleFileChange(targetFile);
    }
  }, [workspaceFiles]);

  // Save/Commit active changes back to SQLite
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile, content: editingContent })
      });
      const data = await res.json();
      setIsSaving(false);
      if (data.success) {
        setSaveStatus('✓ Committed');
        // Refresh local files pool
        fetchGraph();
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('Error saving');
      }
    } catch (err) {
      setIsSaving(false);
      setSaveStatus('Error');
    }
  };

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsAnalyzing(true);
    setAiResponse('');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setIsAnalyzing(false);
      setAiResponse(data.message || "🔍 [Ollama Audit]: Search index queried successfully.");
      
      if (data.matches && data.matches.length > 0) {
        const bestMatch = data.matches[0].filename;
        if (workspaceFiles.some(f => f.filename === bestMatch)) {
          handleFileChange(bestMatch);
        }
      }
    } catch (err) {
      setIsAnalyzing(false);
      setAiResponse("❌ [Ollama Audit]: Failed to reach local search endpoint.");
    }
  }, [searchQuery, workspaceFiles]);

  const activeFileObj = useMemo(() => {
    const file = workspaceFiles.find(f => f.filename === selectedFile);
    const contentToUse = editingContent !== undefined ? editingContent : (file?.content || '');
    return {
      filename: selectedFile,
      language: file?.language || 'TypeScript',
      tokens: tokenizeCode(contentToUse, selectedFile)
    };
  }, [selectedFile, workspaceFiles, editingContent]);

  // Dynamic security recommendations depending on the active file content
  const securityAdvisories = useMemo(() => {
    const advisories = [];
    const contentLower = editingContent.toLowerCase();

    if (selectedFile.includes('payment-gateway') && contentLower.includes('currencycode: "inr"')) {
      advisories.push({
        severity: 'Critical',
        title: 'Hardcoded Currency Constraint',
        description: 'Hardcoded "INR" restricts international transactions. Consider fetching currency code from payload or client context settings.'
      });
    }
    if (selectedFile.includes('auth-middleware') && contentLower.includes("token === 'token'")) {
      advisories.push({
        severity: 'High',
        title: 'Mock Token Bypass Verification',
        description: 'Plain equality check is vulnerable to authorization bypass. Replace standard string comparison with robust JWT signature verification.'
      });
    }
    if (contentLower.includes('verifytoken(payload.auth)') && !contentLower.includes('throw new autherror()')) {
      advisories.push({
        severity: 'Medium',
        title: 'Weak Auth Exception Handling',
        description: 'Authentication checks must explicitly throw errors to prevent silent middleware execution bypass.'
      });
    }

    return advisories;
  }, [selectedFile, editingContent]);

  const dynamicNodes = useMemo(() => {
    return nodes.map((node) => {
      const label = node.data?.label ? String(node.data.label).toLowerCase() : '';
      const isMatch = searchQuery.trim() !== '' && label.includes(searchQuery.toLowerCase());
      const isSelected = selectedFile && label.includes(selectedFile.split('/').pop() || '');
      
      return {
        ...node,
        style: {
          ...node.style,
          borderColor: isMatch ? '#ff7b72' : isSelected ? '#58a6ff' : node.style?.borderColor,
          background: isMatch ? '#21262d' : isSelected ? '#161b22' : node.style?.background,
          boxShadow: isMatch ? '0 0 10px rgba(247, 129, 102, 0.4)' : isSelected ? '0 0 10px rgba(88, 166, 255, 0.2)' : 'none',
        },
      };
    });
  }, [nodes, searchQuery, selectedFile]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      
      {/* GitHub Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] h-[60px] shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#30363d] flex items-center justify-center text-white">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 text-[14px]">
            <span className="font-semibold hover:text-[#58a6ff] cursor-pointer">shravankulal13-collab</span>
            <span className="text-[#8b949e]">/</span>
            <span className="font-bold hover:text-[#58a6ff] cursor-pointer">devtracers</span>
            <span className="text-[12px] border border-[#30363d] text-[#8b949e] px-2 py-0.5 rounded-full ml-2 bg-[#0d1117] font-medium">Public</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#238636]/15 text-[#3fa146] border border-[#238636]/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fa146]" />
            Local SQLite &amp; Embeddings Active
          </span>
          <div className="p-1.5 hover:bg-[#30363d] rounded-md cursor-pointer text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* GitHub Sub-navigation Area */}
      <div className="bg-[#161b22] px-4 border-b border-[#30363d] flex items-center h-[48px] shrink-0 select-none">
        <nav className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 py-3 border-b-2 border-[#f78166] text-[#c9d1d9]">
            <Code className="w-4 h-4 text-[#8b949e]" /> Code
          </span>
          <span className="flex items-center gap-1.5 py-3 border-b-2 border-transparent text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer">
            <GitBranch className="w-4 h-4" /> Pull requests
          </span>
          <span className="flex items-center gap-1.5 py-3 border-b-2 border-transparent text-[#8b949e] hover:text-[#c9d1d9] cursor-pointer">
            <Shield className="w-4 h-4" /> Security
          </span>
        </nav>
      </div>

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Side: Sidebar / Metadata Pane */}
        <div className="w-[300px] bg-[#0d1117] border-r border-[#30363d] flex flex-col p-4 gap-4 overflow-y-auto shrink-0 select-none">
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Semantic Query</span>
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search dependencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-3 pr-8 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder-[#484f58]"
              />
              <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#58a6ff]">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Workspace Config</span>
            <div className="border border-[#30363d] rounded-md bg-[#161b22] p-3 text-xs flex flex-col gap-2 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#8b949e]">Target:</span>
                <span className="text-[#c9d1d9]">multi-repo-mesh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8b949e]">Status:</span>
                <span className="text-[#3fa146] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fa146] animate-pulse" />
                  Air-Gapped
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8b949e]">Engine:</span>
                <span className="text-[#bc8cff]">SQLite-Llama</span>
              </div>
            </div>
          </div>

          {/* Dynamic GitHub Security Advisories insight drawer */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1 text-[#f78166]">
              <ShieldAlert className="w-3.5 h-3.5" /> Security Advisories
            </span>
            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
              {securityAdvisories.length === 0 ? (
                <div className="text-xs text-[#8b949e] italic border border-dashed border-[#30363d] p-3 rounded-md">
                  No issues detected. Code checks pass.
                </div>
              ) : (
                securityAdvisories.map((adv, idx) => (
                  <div key={idx} className="border border-[#30363d] bg-[#161b22] p-2.5 rounded-md text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        adv.severity === 'Critical' ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#d29922]/20 text-[#d29922]'
                      }`}>
                        {adv.severity}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">Local Engine</span>
                    </div>
                    <span className="font-semibold text-[#c9d1d9]">{adv.title}</span>
                    <p className="text-[11px] text-[#8b949e] leading-relaxed mt-0.5">{adv.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">Ollama Output</span>
            <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-md p-3 font-mono text-[11px] overflow-y-auto leading-relaxed relative min-h-[120px]">
              <div className="text-[#8b949e] border-b border-[#30363d] pb-1.5 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-[#d29922]" /> Local LLM logs</span>
                <span className="text-[9px] bg-[#0d1117] px-1.5 py-0.5 rounded text-[#484f58]">V1.0</span>
              </div>
              
              <AnimatePresence mode="wait">
                {isAnalyzing && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#58a6ff] animate-pulse">
                    $ ollama query --db devtracers.sqlite ...
                  </motion.div>
                )}
                {aiResponse && !isAnalyzing && (
                  <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#c9d1d9]">
                    {aiResponse}
                  </motion.div>
                )}
                {!aiResponse && !isAnalyzing && (
                  <div key="idle" className="text-[#484f58]">
                    $ Ready. Try searching for <span className="text-[#c9d1d9] underline cursor-pointer" onClick={() => setSearchQuery('payment')}>payment</span> to trace impact.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Split Screen Workbench */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 grid grid-cols-2 min-h-0 border-b border-[#30363d]">
            
            {/* Workbench Column 1: Editable Code View */}
            <div className="flex flex-col bg-[#0d1117] border-r border-[#30363d] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] select-none shrink-0 h-[36px]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#ff7b72]" />
                  <span className="text-[12px] font-mono text-[#c9d1d9]">{activeFileObj.filename}</span>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus && <span className="text-xs text-[#3fa146] font-medium">{saveStatus}</span>}
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gh-btn gh-btn-primary px-2 py-0.5 text-[11px] rounded"
                  >
                    {isSaving ? 'Saving...' : 'Commit & Index'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="absolute inset-0 w-full h-full p-4 font-mono text-[12px] leading-[1.65] bg-transparent text-[#c9d1d9] border-none focus:outline-none focus:ring-0 resize-none overflow-auto"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Workbench Column 2: Topology Visualizer */}
            <div className="flex flex-col bg-[#0d1117] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] select-none shrink-0 h-[36px]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#58a6ff]" />
                  <span className="text-[12px] font-semibold text-[#c9d1d9]">Impact Graph</span>
                </div>
                <span className="text-[10px] bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 px-2 py-0.5 rounded-full font-mono font-medium">LIVE</span>
              </div>

              <div className="flex-1 relative bg-[#090d13]">
                <div className="absolute top-2 left-2 z-10 bg-[#161b22]/90 border border-[#30363d] text-[10px] p-2 rounded text-[#8b949e] flex items-center gap-1 shadow-md">
                  <HelpCircle className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Click graph nodes to inspect code files</span>
                </div>

                <ReactFlow 
                  nodes={dynamicNodes} 
                  edges={edges} 
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <Background color="#30363d" gap={16} size={1} />
                  <Controls />
                </ReactFlow>
              </div>
            </div>

          </div>

          {/* Bottom Section: Sprint Roadmap Timeline */}
          <div className="bg-[#161b22] border-t border-[#30363d] p-4 shrink-0 select-none">
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Sprint Roadmap
                </span>
                <span className="text-xs text-[#8b949e]">
                  Current milestone: <span className="text-[#c9d1d9] font-semibold">{currentStage}</span>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {stageData.map((stage) => {
                  const isActive = currentStage === stage.key;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => setCurrentStage(stage.key as SprintStages)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-[#0d1117] border-[#f78166] ring-1 ring-[#f78166]'
                          : 'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#c9d1d9]">{stage.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#f78166]" />}
                      </div>
                      <div className="text-[11px] text-[#8b949e] font-medium truncate mb-1">{stage.subtitle}</div>
                      <div className="text-[10px] text-[#484f58] font-mono truncate flex items-center gap-1">
                        <GitCommit className="w-3 h-3 shrink-0" />
                        {stage.commit}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}