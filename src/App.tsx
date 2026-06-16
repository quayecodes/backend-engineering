/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import {
  Folder,
  File,
  Terminal,
  Database,
  Lock,
  Cpu,
  RefreshCw,
  Send,
  Zap,
  Play,
  Github,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Info,
  Layers,
  Sparkles,
  Server,
  Code2,
  Users,
  Search,
  BookOpen
} from "lucide-react";
import { BACKEND_REPO_DATA, RepoModule, RepoFile } from "./data/backendRepoData";

// Advanced high-contrast syntax highlighting helper
function highlightCode(code: string, language: string): string {
  // Simple HTML entities escape to prevent parsing issues
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const commentTokens: string[] = [];
  const stringTokens: string[] = [];

  // 1. Extract Strings to preserve them intact without syntax contamination
  // Double quotes
  escaped = escaped.replace(/(?:"(?:\\.|[^"\\])*")/g, (match) => {
    const placeholder = `___STR_TOKEN_${stringTokens.length}___`;
    stringTokens.push(`<span class="text-emerald-400 font-semibold">${match}</span>`);
    return placeholder;
  });
  // Single quotes
  escaped = escaped.replace(/(?:'(?:\\.|[^'\\])*')/g, (match) => {
    const placeholder = `___STR_TOKEN_${stringTokens.length}___`;
    stringTokens.push(`<span class="text-emerald-400 font-semibold">${match}</span>`);
    return placeholder;
  });

  // 2. Extract Comments and design them in clean, readable italic text
  escaped = escaped.replace(/(#.*)$/gm, (match) => {
    const placeholder = `___COMMENT_TOKEN_${commentTokens.length}___`;
    commentTokens.push(`<span class="text-slate-450 italic font-mono opacity-80">${match}</span>`);
    return placeholder;
  });

  const lang = (language || "").toLowerCase();

  // 3. Apply custom syntax color keys based on file language
  if (lang === "python" || lang === "py") {
    // Python decorators (@router.get etc)
    escaped = escaped.replace(/(@\w+(?:\.\w+)?)/g, '<span class="text-teal-300 font-semibold">$1</span>');

    // Functions definitions (def my_function)
    escaped = escaped.replace(/\b(def\s+)(\w+)\b/g, '$1<span class="text-yellow-300 font-bold">$2</span>');

    // Class declarations (class MyClass)
    escaped = escaped.replace(/\b(class\s+)(\w+)\b/g, '$1<span class="text-cyan-300 font-extrabold">$2</span>');

    // Standard structural keywords
    escaped = escaped.replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|await|async|assert|pass|lambda|yield|not|and|or|in|is|None|True|False)\b/g, '<span class="text-indigo-300 font-bold">$1</span>');

    // Essential self references & core built-ins
    escaped = escaped.replace(/\b(self|print|len|range|int|str|dict|list|set|tuple|float|bool|type|isinstance|any|all)\b/g, '<span class="text-amber-300 font-medium">$1</span>');

    // Special enterprise classes and module terms
    escaped = escaped.replace(/\b(FastAPI|APIRouter|Depends|HTTPException|status|BackgroundTasks|UploadFile|File|Query|Path|Body|SQLAlchemy|Session|Base|declarative_base|Column|Integer|String|Boolean|DateTime|ForeignKey|relationship|redis|Redis|Celery|RabbitMQ)\b/g, '<span class="text-sky-300 font-bold">$1</span>');
  } else if (lang === "yaml" || lang === "yml") {
    // Config property names followed by colon
    escaped = escaped.replace(/^(\s*)([\w_-]+)(\s*:)/gm, '$1<span class="text-sky-300 font-bold">$2</span>$3');
    // Boolean constants
    escaped = escaped.replace(/\b(true|false|yes|no|on|off)\b/gi, '<span class="text-teal-300 font-extrabold">$1</span>');
  } else if (lang === "markdown" || lang === "md") {
    // Bold with ** - render bold text and strip raw ** asterisks
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-indigo-300">$1</strong>');
    // Italic with * - render italic text and strip raw * asterisks
    escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');
    // Header hash sizes
    escaped = escaped.replace(/^(#+\s+.*)$/gm, '<span class="text-indigo-300 font-extrabold">$1</span>');
    // Inline monospaced backticks - strip backticks and style monospaced
    escaped = escaped.replace(/`([^`\n]+)`/g, '<span class="text-amber-200 font-mono bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/60">$1</span>');
    // List signs
    escaped = escaped.replace(/^(\s*[-*+]\s+)/gm, '<span class="text-teal-400 font-bold">$1</span>');
  } else if (lang === "json") {
    // JSON keys
    escaped = escaped.replace(/("[\w_-]+")(\s*:)/g, '<span class="text-sky-300 font-bold">$1</span>$2');
  }

  // Formatting Numbers with a safe bypass for any embedded placeholder IDs
  escaped = escaped.replace(/\b\d+\b/g, (num, offset, fullText) => {
    const before = fullText.slice(Math.max(0, offset - 20), offset);
    if (before.includes("___STR_TOKEN_") || before.includes("___COMMENT_TOKEN_")) {
      return num;
    }
    return `<span class="text-amber-400 font-mono font-semibold">${num}</span>`;
  });

  // 4. Safely reinstate comments and strings back to their coordinates
  for (let i = 0; i < stringTokens.length; i++) {
    escaped = escaped.replace(`___STR_TOKEN_${i}___`, stringTokens[i]);
  }
  for (let i = 0; i < commentTokens.length; i++) {
    escaped = escaped.replace(`___COMMENT_TOKEN_${i}___`, commentTokens[i]);
  }

  return escaped;
}

// Simple simple syntax highlighting support
function renderCodeWithSelection(code: string, language: string) {
  const html = highlightCode(code, language);
  const lines = html.split("\n");

  return (
    <div className="font-mono text-xs select-all py-4 min-w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="hover:bg-slate-800/50 transition-colors group">
              {/* Line Number Column */}
              <td className="w-12 text-right pr-4 pl-3 select-none text-slate-500 font-mono text-[10px] border-r border-slate-800/80 align-top leading-relaxed selection:bg-transparent">
                {index + 1}
              </td>
              {/* Code Content Column */}
              <td 
                className="pl-5 pr-4 font-mono text-[11.5px] text-slate-100 leading-relaxed whitespace-pre font-medium align-top selection:bg-indigo-500/30"
                dangerouslySetInnerHTML={{ __html: line || " " }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  // General State Tracking
  const [viewMode, setViewMode] = useState<"workspace" | "architecture">("workspace");
  const [activeModuleId, setActiveModuleId] = useState<string>("01-rest-api");
  const [selectedFile, setSelectedFile] = useState<RepoFile>(
    BACKEND_REPO_DATA[0].files[0]
  );
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [zipExporting, setZipExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get current active module references
  const activeModule = BACKEND_REPO_DATA.find((m) => m.id === activeModuleId) || BACKEND_REPO_DATA[0];

  // Force sync the file browser selection on module change
  useEffect(() => {
    if (activeModule) {
      setSelectedFile(activeModule.files[0]);
    }
  }, [activeModuleId]);

  // Handle Clipboard copies
  const triggerCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(path);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Trigger JSZip build-and-download of the whole repository
  const handleZipDownload = async () => {
    setZipExporting(true);
    try {
      const zip = new JSZip();
      
      // Inject all folders and file arrays recursively matching real paths
      BACKEND_REPO_DATA.forEach((mod) => {
        mod.files.forEach((file) => {
          zip.file(file.path, file.content);
        });
      });

      const blobContent = await zip.generateAsync({ type: "blob" });
      const dlUrl = URL.createObjectURL(blobContent);
      const tempLink = document.createElement("a");
      tempLink.href = dlUrl;
      tempLink.download = "quayecodes-backend-engineering.zip";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error("ZIP packaging failed:", err);
    } finally {
      setZipExporting(false);
    }
  };

  // Filter modules based on search criteria
  const filteredModules = BACKEND_REPO_DATA.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(query) ||
      m.topic.toLowerCase().includes(query) ||
      m.files.some((f) => f.name.toLowerCase().includes(query) || f.content.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      
      {/* ─────────────────────────────────────────────────────────────────
          HEADER / HEADER ACTIONS
          ───────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-6 shrink-0 sticky top-0 z-50 shadow-sm py-3 md:py-0">
        {/* Brand & Small Status Badge */}
        <div className="flex items-center justify-between w-full md:w-auto h-10 md:h-16">
          <div className="flex items-center space-x-2.5">
            <div className="bg-slate-900 text-white p-2 rounded-lg shrink-0 shadow-sm">
              <Cpu className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-800 whitespace-nowrap">
              quayecodes <span className="text-slate-300 mx-1">/</span> <span className="text-indigo-650 font-extrabold hidden sm:inline">backend-engineering</span><span className="text-indigo-650 font-extrabold inline sm:hidden">backend</span>
            </h1>
          </div>

          {/* Quick Stats / Compact Export for Mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-150 font-mono">
              v1.2.0
            </span>
            <button
              onClick={handleZipDownload}
              disabled={zipExporting}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {zipExporting ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>ZIP</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher and Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto md:h-16 py-1 md:py-0">
          
          {/* View Mode Segmented Controls */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shadow-inner items-center w-full sm:w-auto shrink-0">
            <button
              onClick={() => setViewMode("workspace")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold leading-normal rounded-lg cursor-pointer transition-all text-center whitespace-nowrap ${
                viewMode === "workspace"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-250/50"
                  : "text-slate-500 hover:text-slate-700 font-semibold"
              }`}
            >
              🛠️ Lab Workspace
            </button>
            <button
              onClick={() => setViewMode("architecture")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold leading-normal rounded-lg cursor-pointer transition-all text-center whitespace-nowrap ${
                viewMode === "architecture"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-250/50"
                  : "text-slate-500 hover:text-slate-700 font-semibold"
              }`}
            >
              🏛️ Architecture & Global Docs
            </button>
          </div>

          <div className="hidden lg:block h-8 w-px bg-slate-200 mx-1"></div>

          {/* Search bar & Desktop Download */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-40 md:w-48 lg:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
            </div>

            {/* Status badges only visible on modern desks */}
            <span className="hidden xl:inline-flex px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg border border-green-200 whitespace-nowrap">
              CI Passing
            </span>

            {/* Desktop Only ZIP Download button */}
            <button
              onClick={handleZipDownload}
              disabled={zipExporting}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all duration-200 active:scale-95 cursor-pointer shadow-sm disabled:opacity-50 whitespace-nowrap"
              id="download-master-zip"
            >
              {zipExporting ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  <span>Export Master ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────
          DYNAMIC MODE LAYOUT ROUTING
          ───────────────────────────────────────────────────────────────── */}
      {viewMode === "workspace" ? (
        <>
          {/* CURRICULUM TOPICS TRACK SELECTION */}
          <nav className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 overflow-x-auto flex gap-2 scrollbar-none shrink-0 shadow-sm items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2 border-r border-slate-200 pr-3 my-1">Modules</span>
            {nestedCategoryPills(activeModuleId, setActiveModuleId)}
          </nav>

          {/* MAIN CONTENT CONTAINER (SPLIT SCREEN LAYOUT) */}
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* LEFT COMPONENT (GRID 5 COLS) - METADATA, WORKSPACE EXPLORER, CODE EDITOR */}
        <section className="lg:col-span-5 flex flex-col gap-6 h-[calc(100vh-14rem)] lg:h-[calc(100vh-12.5rem)] overflow-y-auto pr-1">
          
          {/* Card 1: Directory Explorer */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <Folder className="h-4 w-4 text-indigo-600" />
                <span>File Explorer: /{activeModule.folder}</span>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                {activeModule.files.length} physical nodes
              </span>
            </div>

            {/* Folder / File layout */}
            <div className="p-3 bg-slate-50/30 max-h-56 overflow-y-auto text-xs space-y-1">
              {activeModule.files.map((file) => {
                const isActive = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-155 group cursor-pointer border ${
                      isActive
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm"
                        : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File
                        className={`h-3.5 w-3.5 shrink-0 ${
                          file.name.endsWith(".md")
                            ? "text-indigo-500"
                            : file.name.endsWith(".py")
                            ? "text-indigo-600"
                            : file.name.endsWith("requirements.txt")
                            ? "text-indigo-450"
                            : "text-slate-400"
                        }`}
                      />
                      <span className="truncate text-[11px] font-mono">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic shrink-0 font-sans group-hover:text-slate-500">
                      {file.name === "README.md" ? "Read Doc" : file.language}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Code Editor & Copy Broker */}
          <div className="bg-white border border-slate-200 rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-[350px]">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="text-xs font-bold text-slate-800 font-mono tracking-tight shrink-0 truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] text-slate-500 italic truncate">
                  {selectedFile.description}
                </span>
              </div>
              <button
                onClick={() => triggerCopy(selectedFile.content, selectedFile.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm shrink-0 ml-2 border border-indigo-750/50"
                title="Copy full source code to clipboard"
                id="copy-file-code-btn"
              >
                {copySuccess === selectedFile.path ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Core code block box */}
            <div className="flex-1 bg-slate-900 overflow-y-auto block relative">
              {renderCodeWithSelection(selectedFile.content, selectedFile.language)}
            </div>

            {/* PEP8 and architectural design comments */}
            <div className="border-t p-4 block text-xs" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1.5">
                <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-900">Production Architecture Standard:</span>
              </div>
              <p className="leading-relaxed text-slate-700 font-sans text-[11px] font-medium">
                {selectedFile.name.endsWith(".py") &&
                  "Type-annotated functions conforming strictly to PEP 8 limits. Promotes clear typing boundaries and asynchronous database drivers."}
                {selectedFile.name.endsWith(".md") &&
                  "Structured installation guides detailing setup parameters, system requirements and architectural blueprints."}
                {selectedFile.name.endsWith(".yml") &&
                  "State-of-the-art configuration orchestration. Bridges application nodes securely inside closed testing rings."}
                {selectedFile.name === "requirements.txt" &&
                  "Pegged packages listing minimum compatible system dependencies to avoid runtime module deprecations."}
                {!selectedFile.name.endsWith(".py") &&
                  !selectedFile.name.endsWith(".md") &&
                  !selectedFile.name.endsWith(".yml") &&
                  selectedFile.name !== "requirements.txt" &&
                  "Strictly formulated system resource config file, ensuring clean cross-environment environment parameters."}
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT COMPONENT (GRID 7 COLS) - INTERACTIVE CONCEPT RUNTIME SANDBOX */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col h-[calc(100vh-14rem)] lg:h-[calc(100vh-12.5rem)] shadow-sm overflow-hidden">
          
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wide">INTERACTIVE SIMULATION FACILITY</h3>
                <p className="text-[10px] text-slate-500">Sandbox playground representing live concept execution</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-550"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full font-mono tracking-wider">SANDBOX LIVE</span>
            </div>
          </div>

          {/* Interactive core components mapping */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModuleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeModuleId === "01-rest-api" && <RestApiSimulator />}
                {activeModuleId === "02-auth" && <JwtAuthSimulator />}
                {activeModuleId === "03-caching" && <RedisCachingSimulator />}
                {activeModuleId === "04-message-queues" && <CeleryTaskSimulator />}
                {activeModuleId === "05-websockets" && <WebSocketsChatSimulator />}
                {activeModuleId === "06-graphql" && <GraphQLPlaygroundSimulator />}
                {activeModuleId === "docker" && <DockerNetworksSimulator />}
                {activeModuleId === "pipelines" && <GithubActionsWorkflowSimulator />}
                {activeModuleId === "repo-root" && <RepoRootOverviewSimulator />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>
        </>
      ) : (
        <ArchitectureDocsHub />
      )}

      {/* FOOTER */}
      <footer className="h-8 bg-slate-900 text-slate-400 flex items-center justify-between px-4 text-[10px] shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>System Live</span>
          </div>
          <span className="opacity-50">|</span>
          <span>Master Branch</span>
          <span className="opacity-50">|</span>
          <span>CI/CD Passing</span>
          <span className="opacity-50">|</span>
          <span>7 Active Consumers</span>
        </div>
        <div className="font-mono text-slate-400 opacity-90">UTC: 2026-06-10 15:31:20</div>
      </footer>
    </div>
  );
}

// Rendering modular category buttons
function nestedCategoryPills(activeId: string, setActiveId: (id: string) => void) {
  return BACKEND_REPO_DATA.map((module) => {
    const isSelected = activeId === module.id;
    return (
      <button
        key={module.id}
        onClick={() => setActiveId(module.id)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 shrink-0 select-none border ${
          isSelected
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-indigo-600" : "bg-slate-300"}`}></span>
          <span>{module.title}</span>
        </div>
      </button>
    );
  });
}

// ==============================================================================
// 01. REST API SIMULATOR ENGINE (CRUD + POSTGRES MOCKING)
// ==============================================================================
function RestApiSimulator() {
  const [users, setUsers] = useState<Array<{ id: number; email: string; username: string; items: any[] }>>([
    { id: 1, email: "developer@quayecodes.com", username: "sys_admin", items: [{ id: 101, title: "Database Master Key" }] },
    { id: 2, email: "curriculum.viewer@gmail.com", username: "johndoe", items: [] }
  ]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [targetUserId, setTargetUserId] = useState("1");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [apiLogs, setApiLogs] = useState<string[]>([
    "INFO:  [FastAPI] Application core started successfully.",
    "INFO:  [Database] Async pool generated - 10 active connections established."
  ]);

  const appendLog = (msg: string) => {
    const now = new Date().toLocaleTimeString();
    setApiLogs((prev) => [`[${now}] ${msg}`, ...prev]);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserUsername) return;

    const emailTaken = users.some((u) => u.email === newUserEmail);
    if (emailTaken) {
      appendLog("HTTP 400: POST /users - Error: Email already registered.");
      return;
    }

    const brandNew = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      email: newUserEmail,
      username: newUserUsername.toLowerCase().replace(/\s+/g, ""),
      items: []
    };

    setUsers([...users, brandNew]);
    setNewUserEmail("");
    setNewUserUsername("");
    appendLog(`HTTP 201: POST /users - Username: @${brandNew.username}`);
    appendLog(`SQL COMMITTED: INSERT INTO users (email, username, is_active) VALUES ('${brandNew.email}', '${brandNew.username}', true);`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle) return;

    const uId = parseInt(targetUserId, 10);
    const userIndex = users.findIndex((u) => u.id === uId);
    if (userIndex === -1) {
      appendLog("HTTP 404: POST /users/{id}/items - Error: Selected User ID not found.");
      return;
    }

    const updated = [...users];
    const newItem = {
      id: Math.floor(Math.random() * 900) + 100,
      title: newItemTitle
    };

    updated[userIndex].items.push(newItem);
    setUsers(updated);
    setNewItemTitle("");
    appendLog(`HTTP 201: POST /users/${uId}/items - Title: "${newItem.title}"`);
    appendLog(`SQL COMMITTED: INSERT INTO items (title, owner_id) VALUES ('${newItem.title}', ${uId});`);
  };

  const handleDeleteItem = (userId: number, itemId: number) => {
    const updated = [...users];
    const userIdx = updated.findIndex((u) => u.id === userId);
    if (userIdx !== -1) {
      updated[userIdx].items = updated[userIdx].items.filter((item) => item.id !== itemId);
      setUsers(updated);
      appendLog(`HTTP 204: DELETE /items/${itemId} - Item deleted.`);
      appendLog(`SQL COMMITTED: DELETE FROM items WHERE id = ${itemId};`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Info className="h-4 w-4 text-indigo-600 shrink-0" />
        <p className="text-xs text-slate-650 leading-relaxed font-sans">
          <strong className="text-indigo-800 font-semibold font-sans">REST API Playground:</strong> Build and append SQLAlchemy entities in our client database simulator. Track Pydantic validation logs and SQL queries instantly on database mutations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Forms layout */}
        <div className="space-y-4">
          
          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Zap className="h-3.5 w-3.5 text-indigo-650 shrink-0" />
              <span>POST /users (Pydantic validated)</span>
            </h4>
            <form onSubmit={handleCreateUser} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="sys_user"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  className="bg-white text-slate-800 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 shadow-sm"
                />
                <input
                  type="email"
                  placeholder="user@host.com"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="bg-white text-slate-800 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Execute POST /users
              </button>
            </form>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Zap className="h-3.5 w-3.5 text-indigo-650 shrink-0" />
              <span>POST /users/{"{id}"}/items</span>
            </h4>
            <form onSubmit={handleCreateItem} className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="col-span-1 bg-white text-slate-805 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm text-slate-700"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      ID {u.id} (@{u.username})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Core asset title"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="col-span-2 bg-white text-slate-800 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 text-slate-800 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Execute POST /items
              </button>
            </form>
          </div>

        </div>

        {/* Database visualization state */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[300px] shadow-sm">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider leading-none font-sans">
            <Database className="h-3.5 w-3.5 text-indigo-600" />
            <span>MOCK POSTGRESQL DB STATE ("users" Table)</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-3 flex-1 text-xs select-none">
            {users.length === 0 ? (
              <p className="text-slate-400 text-center italic py-12 bg-slate-50/50">Database cleared. Re-seed via REST API.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-150 space-y-2 shadow-sm">
                  <div className="flex justify-between items-center bg-indigo-50/60 p-1.5 rounded border border-indigo-100">
                    <span className="font-semibold text-indigo-750 font-mono text-xs">ID {user.id} — @{user.username}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                  <div className="space-y-1.5 pl-3 border-l border-slate-200">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-sans">Associated items:</span>
                    {user.items.length === 0 ? (
                      <p className="text-[10px] text-slate-450 italic font-sans animate-fade">No assigned items</p>
                    ) : (
                      user.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[11px] text-slate-700 font-sans">
                          <span>📦 {item.title} <span className="text-[9px] text-slate-400 font-mono">(ID: {item.id})</span></span>
                          <button
                            onClick={() => handleDeleteItem(user.id, item.id)}
                            className="text-[10px] text-rose-600 hover:text-rose-500 font-semibold cursor-pointer p-0.5 hover:underline"
                          >
                            delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Database engine stdout logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-36 shadow-md shadow-slate-900/10">
        <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          UVICORN / ENGINE SERVER CONSOLE STDOUT
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {apiLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("Error")
                  ? "text-rose-400 bg-rose-950/20"
                  : log.includes("SQL")
                  ? "text-indigo-300 bg-indigo-950/10"
                  : "text-emerald-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 02. JWT AUTH SIMULATOR ENGINE (JWT CRYPTO DECODER & RBAC CHECKS)
// ==============================================================================
function JwtAuthSimulator() {
  const [sessionUser, setSessionUser] = useState("alice");
  const [sessionPassword, setSessionPassword] = useState("adminpwd");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeRefresh, setActiveRefresh] = useState<string | null>(null);
  const [decodedClaims, setDecodedClaims] = useState<any | null>(null);
  const [authLogs, setAuthLogs] = useState<string[]>([
    "Ready. Standard usernames available: admin is 'alice' (adminpwd), editor is 'bob' (editorpwd), view user is 'viewer' (viewerpwd)."
  ]);
  const [selectedJwtTab, setSelectedJwtTab] = useState<"header" | "payload" | "signature">("payload");
  const [ttlSeconds, setTtlSeconds] = useState<number>(0);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);

  const appendLog = (msg: string) => {
    setAuthLogs((prev) => [`[SECURE] ${msg}`, ...prev]);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    appendLog(`POST /auth/login - authenticating user '${sessionUser}'...`);

    // Mock lookups
    const matchUser = sessionUser.toLowerCase();
    let verified = false;
    let targetRole = "viewer";
    let targetEmail = "viewer@corp.com";

    if (matchUser === "alice" && sessionPassword === "adminpwd") {
      verified = true;
      targetRole = "admin";
      targetEmail = "alice@company.com";
    } else if (matchUser === "bob" && sessionPassword === "editorpwd") {
      verified = true;
      targetRole = "editor";
      targetEmail = "bob@company.com";
    } else if (matchUser === "viewer" && sessionPassword === "viewerpwd") {
      verified = true;
      targetRole = "viewer";
      targetEmail = "viewer@company.com";
    }

    if (!verified) {
      appendLog("HTTP 401: Login Rejected - BCrypt hash signature check failed.");
      setActiveToken(null);
      setActiveRefresh(null);
      setDecodedClaims(null);
      setTtlSeconds(0);
      return;
    }

    // Generate simulated tokens
    const claims = {
      sub: matchUser,
      email: targetEmail,
      role: targetRole,
      type: "access",
      iat: Math.floor(Date.now() / 1000)
    };

    // Serialized header/signature components
    const mockHeader = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const mockPayload = btoa(JSON.stringify(claims)).replace(/=/g, "");
    const mockSignature = "bS_gG4_m8_k21mP_s7q_9a3jCgW3b_D39s";

    const token = `${mockHeader}.${mockPayload}.${mockSignature}`;
    const rToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikrefresh...${btoa(JSON.stringify({ sub: matchUser, type: "refresh" })).substring(0, 20)}`;

    setActiveToken(token);
    setActiveRefresh(rToken);
    setDecodedClaims(claims);
    setTtlSeconds(60); // 60 seconds sandbox session expires
    appendLog(`HTTP 200: Authorization successful. Tokens spawned. User assigned role: [${targetRole}].`);

    // Restart ticker
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(tickerRef.current!);
          appendLog("SESSION NOTICE: Access token expired. Trigger POST /auth/refresh to rotate.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeRefreshAction = () => {
    if (!activeRefresh) {
      appendLog("HTTP 401: Refresh Rejected - No refresh_token currently present.");
      return;
    }
    appendLog("POST /auth/refresh - decoding refresh credentials...");
    if (decodedClaims) {
      // Re-sign access claims
      const newExp = { ...decodedClaims, iat: Math.floor(Date.now() / 1000) };
      const mockHeader = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const mockPayload = btoa(JSON.stringify(newExp)).replace(/=/g, "");
      const mockSignature = "Re_RotatedSignature_HS256_kX8y";
      setActiveToken(`${mockHeader}.${mockPayload}.${mockSignature}`);
      setDecodedClaims(newExp);
      setTtlSeconds(60);
      appendLog("HTTP 200: Reissued fresh Access Token successfully via refresh token rotation cycle.");

      // Restart timer
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = setInterval(() => {
        setTtlSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(tickerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const accessEndpointGd = (endpoint: string, allowed: string[]) => {
    if (!activeToken || ttlSeconds <= 0) {
      appendLog(`HTTP 401 Unauthorized: Attempted accessing '${endpoint}' without valid session.`);
      return;
    }

    const matched = allowed.includes(decodedClaims.role);
    if (!matched) {
      appendLog(`HTTP 403 Forbidden: Privilege escalation blocked. Role '${decodedClaims.role}' is not allowed in '${endpoint}' (Requires: [${allowed.join(", ")}])`);
    } else {
      appendLog(`HTTP 200 OK: Granted access to '${endpoint}' for user @${decodedClaims.sub} holding role: [${decodedClaims.role}]`);
    }
  };

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
        <p className="text-xs text-slate-650 leading-relaxed font-sans">
          <strong className="text-indigo-800 font-semibold font-sans">Dual-Token Auth Lab:</strong> Test token authorization constraints. Secure endpoints against customized user roles, inspect and decode actual JWT blocks, and rotate keys securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Authorizer form */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Zap className="h-3.5 w-3.5 text-indigo-650 shrink-0" />
              <span>POST /auth/login</span>
            </h4>
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-450 uppercase block mb-1 font-bold font-sans">Username</label>
                  <select
                    value={sessionUser}
                    onChange={(e) => {
                      setSessionUser(e.target.value);
                      if (e.target.value === "alice") setSessionPassword("adminpwd");
                      if (e.target.value === "bob") setSessionPassword("editorpwd");
                      if (e.target.value === "viewer") setSessionPassword("viewerpwd");
                    }}
                    className="w-full bg-white text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm text-slate-700"
                  >
                    <option value="alice">alice (Admin)</option>
                    <option value="bob">bob (Editor)</option>
                    <option value="viewer">viewer (Viewer)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-450 uppercase block mb-1 font-bold font-sans">Raw password</label>
                  <input
                    type="password"
                    value={sessionPassword}
                    onChange={(e) => setSessionPassword(e.target.value)}
                    className="w-full bg-white text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm text-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer transition-colors shadow-sm"
              >
                Sign with Bcrypt & Authorize
              </button>
            </form>
          </div>

          {/* Middleware and guards */}
          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider font-sans">
              ENDPOINT SECURITY GUARDS (RBAC)
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => accessEndpointGd("/users/me", ["admin", "editor", "viewer"])}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left px-3 text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-colors duration-150"
              >
                <span className="font-mono text-indigo-650 font-bold">GET /users/me</span>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-700 font-sans font-medium">ALL ROLES</span>
              </button>
              <button
                onClick={() => accessEndpointGd("/editor/content", ["admin", "editor"])}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left px-3 text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-colors duration-150"
              >
                <span className="font-mono text-emerald-650 font-bold">GET /editor/content</span>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-700 font-sans font-medium font-semibold">ADMIN, EDITOR</span>
              </button>
              <button
                onClick={() => accessEndpointGd("/admin/dashboard", ["admin"])}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left px-3 text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-colors duration-150"
              >
                <span className="font-mono text-rose-650 font-bold">GET /admin/dashboard</span>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-700 font-sans font-medium font-bold">ADMIN ONLY</span>
              </button>
            </div>
          </div>
        </div>

        {/* Decoder interface */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[350px] shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider font-sans2">
                JWT DECODER TOOL
              </h4>
              {ttlSeconds > 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-[10px] font-mono font-semibold">
                  <span>TTL: {ttlSeconds}s</span>
                </div>
              ) : (
                <span className="text-[10px] text-rose-600 font-mono font-bold">TOKEN EXPIRED</span>
              )}
            </div>

            {activeToken ? (
              <div className="space-y-4">
                {/* Visual token splitting */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] break-all leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                  <span className="text-rose-400 font-semibold">{activeToken.split(".")[0]}</span>.
                  <span className="text-indigo-300 font-semibold">{activeToken.split(".")[1]}</span>.
                  <span className="text-emerald-400 font-semibold">{activeToken.split(".")[2]}</span>
                </div>

                {/* Decode inspector tabs */}
                <div className="space-y-2">
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                    {["header", "payload", "signature"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedJwtTab(tab as any)}
                        className={`flex-1 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all duration-150 ${
                          selectedJwtTab === tab
                            ? "bg-white text-slate-850 shadow-sm"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] h-28 overflow-y-auto">
                    {selectedJwtTab === "header" && (
                      <div className="text-rose-300">
                        {`{
  "alg": "HS256",
  "typ": "JWT"
}`}
                      </div>
                    )}
                    {selectedJwtTab === "payload" && decodedClaims && (
                      <div className="text-indigo-300">
                        {JSON.stringify(decodedClaims, null, 2)}
                      </div>
                    )}
                    {selectedJwtTab === "signature" && (
                      <div className="text-emerald-300 space-y-1">
                        <p>{`HMACSHA256(`}</p>
                        <p className="pl-3">{`base64UrlEncode(header) + "." +`}</p>
                        <p className="pl-3">{`base64UrlEncode(payload),`}</p>
                        <p className="pl-3 text-emerald-400 font-sans italic">{`"system-cryptographic-signing-key..."`}</p>
                        <p>{`)`}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <Lock className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 italic">No active session token. Complete POST /login authorization first.</p>
              </div>
            )}
          </div>

          {activeRefresh && (
            <div className="pt-3 border-t border-slate-150 flex items-center justify-between mt-2 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[50%]">Refresh: {activeRefresh.substring(0, 18)}...</span>
              <button
                onClick={executeRefreshAction}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 font-semibold rounded text-[10px] flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Trigger Tokens Rotation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth visual stdout console logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-32 shadow-md shadow-slate-900/10">
        <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          SECURITY GUARDIAN PROTOCOL AUDIT LOGS
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {authLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("Forbidden") || log.includes("Rejected")
                  ? "text-rose-400 bg-rose-950/20 animate-pulse"
                  : log.includes("successful") || log.includes("reissued")
                  ? "text-emerald-400 bg-emerald-950/10"
                  : "text-slate-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 03. REDIS CACHING SIMULATOR ENGINE (HIT/MISS CLOCKS & WRITE THROUGH LOGIC)
// ==============================================================================
function RedisCachingSimulator() {
  const [cacheStrategy, setCacheStrategy] = useState<"cache-aside" | "write-through">("cache-aside");
  const [redisStorage, setRedisStorage] = useState<dict<string, { val: any; ttl: number }>>({
    "product:101": { val: { id: "101", name: "Cloud Compute Instance", price: 49.99 }, ttl: 45 }
  });
  const [runningLog, setRunningLog] = useState<string[]>([
    "Redis Cache backend connected at redis://localhost:6379/0."
  ]);
  const [latencyIndicator, setLatencyIndicator] = useState<string | null>(null);
  const [activeBenchmarkTime, setActiveBenchmarkTime] = useState<number | null>(null);

  const appendLog = (msg: string) => {
    setRunningLog((prev) => [`[REDIS] ${msg}`, ...prev]);
  };

  // Tick down TTLs
  useEffect(() => {
    const timer = setInterval(() => {
      setRedisStorage((curr) => {
        const copy = { ...curr };
        let altered = false;
        Object.keys(copy).forEach((k) => {
          if (copy[k].ttl <= 1) {
            delete copy[k];
            altered = true;
          } else {
            copy[k] = { ...copy[k], ttl: copy[k].ttl - 1 };
          }
        });
        if (altered) {
          appendLog("CACHE INFRA: Evicted expired keys (TTL reached 0s).");
        }
        return copy;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerGetProduct = async (prodId: string) => {
    const keyName = `product:${prodId}`;
    appendLog(`GET /products/${prodId} - looking up cache...`);
    setLatencyIndicator("Pinging cache...");
    
    // Simulate cache lookup delay
    await new Promise((r) => setTimeout(r, 200));

    const checkCache = redisStorage[keyName];
    if (checkCache) {
      setLatencyIndicator(null);
      setActiveBenchmarkTime(4); // 4ms
      appendLog(`CACHE HIT: Found key '${keyName}' instantly. Response speed: 4ms. Payload: ${JSON.stringify(checkCache.val)}`);
    } else {
      setLatencyIndicator("Cache Miss! Fetching database...");
      appendLog(`CACHE MISS: Key '${keyName}' not present. Loading from PostgreSQL with 1.5s lag...`);
      
      // Simulate Database load delay (1.5 seconds)
      await new Promise((r) => setTimeout(r, 1500));
      
      const valMock =
        prodId === "101"
          ? { id: "101", name: "Cloud Compute Instance", price: 49.99 }
          : { id: "102", name: "Dedicated DB Storage", price: 199.99 };
      
      setRedisStorage((curr) => ({
        ...curr,
        [keyName]: { val: valMock, ttl: 60 } // Store inside cache
      }));

      setLatencyIndicator(null);
      setActiveBenchmarkTime(1512); // 1512ms
      appendLog(`DATABASE RESPONSE OK: Retrieved item. Generated Redis key '${keyName}' with 60s TTL. Response speed: 1512ms.`);
    }
  };

  const triggerUpdateStrategy = (prodId: string, customPrice: number) => {
    const keyName = `product:${prodId}`;
    const payload =
      prodId === "101"
        ? { id: "101", name: "Cloud Compute Instance", price: customPrice }
        : { id: "102", name: "Dedicated DB Storage", price: customPrice };

    appendLog(`PUT /products/${prodId} [Price: $${customPrice}] - Selected Strategy: [${cacheStrategy.toUpperCase()}]`);
    appendLog(`DATABASE COMMITTED: Updated SQL table record products_id='${prodId}' to price $${customPrice}.`);

    if (cacheStrategy === "write-through") {
      // Update cache immediately
      setRedisStorage((curr) => ({
        ...curr,
        [keyName]: { val: payload, ttl: 60 }
      }));
      appendLog(`WRITE-THROUGH AUTO-UPDATE: Refreshed key '${keyName}' inside Redis context to keep databases identical.`);
    } else {
      // Cache-aside: invalidate existing cache key so future gets will lazily load updated data
      setRedisStorage((curr) => {
        const copy = { ...curr };
        delete copy[keyName];
        return copy;
      });
      appendLog(`CACHE-ASIDE INVALIDATION: Purged key '${keyName}' from cache space proactively to prevent returning stale data.`);
    }
  };

  const clearRedisNodes = () => {
    setRedisStorage({});
    appendLog("FLUSHALL: Cleared all key registers from Redis memory space.");
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Cpu className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">Redis Sandbox:</strong> Contrast latency differences between Cache hits (4ms) and Cache misses (1.5s). Toggle Write-Through and Cache-Aside invalidations live on data modifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Operations controllers */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex justify-between items-center font-sans">
              <span>CACHE STRATEGY CHOOSER</span>
              <span className="text-[10px] text-indigo-600 font-mono font-bold">write config</span>
            </h4>
            <div className="flex bg-slate-105 p-0.5 rounded-lg border border-slate-200 gap-1">
              <button
                onClick={() => setCacheStrategy("cache-aside")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase cursor-pointer transition-all ${
                  cacheStrategy === "cache-aside"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-450 hover:text-slate-700"
                }`}
              >
                Cache-Aside (Lazy)
              </button>
              <button
                onClick={() => setCacheStrategy("write-through")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase cursor-pointer transition-all ${
                  cacheStrategy === "write-through"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-450 hover:text-slate-700"
                }`}
              >
                Write-Through (Eager)
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">READ OPERATIONS CLIENT</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerGetProduct("101")}
                disabled={latencyIndicator !== null}
                className="py-2 px-3 text-xs bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-center font-bold text-slate-700 cursor-pointer disabled:opacity-50 shadow-sm transition-colors"
              >
                GET /products/101
              </button>
              <button
                onClick={() => triggerGetProduct("102")}
                disabled={latencyIndicator !== null}
                className="py-2 px-3 text-xs bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-center font-bold text-slate-700 cursor-pointer disabled:opacity-50 shadow-sm transition-colors"
              >
                GET /products/102
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">WRITE OPERATIONS MUTATIONS</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerUpdateStrategy("101", parseFloat((Math.random() * 80 + 20).toFixed(2)))}
                className="py-2 px-3 text-xs bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-center font-bold text-rose-700 cursor-pointer shadow-sm transition-colors"
              >
                PUT /products/101
              </button>
              <button
                onClick={() => triggerUpdateStrategy("102", parseFloat((Math.random() * 150 + 100).toFixed(2)))}
                className="py-2 px-3 text-xs bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-center font-bold text-rose-700 cursor-pointer shadow-sm transition-colors"
              >
                PUT /products/102
              </button>
            </div>
          </div>
        </div>

        {/* Caching visualization structure */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[350px] shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider font-sans">
                ACTIVE REDIS RAM CACHE REGISTER
              </h4>
              <button
                onClick={clearRedisNodes}
                className="text-[10px] text-indigo-650 hover:text-indigo-800 font-bold underline bg-transparent border-none cursor-pointer"
              >
                Flush Redis
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {Object.keys(redisStorage).length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-250 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-450 italic font-sans">Redis RAM registers empty (100% cache misses).</p>
                </div>
              ) : (
                Object.keys(redisStorage).map((key) => {
                  const data = redisStorage[key];
                  return (
                    <div key={key} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg flex justify-between items-center text-xs shadow-sm">
                      <div>
                        <span className="font-mono text-indigo-700 font-bold">{key}</span>
                        <div className="text-[10px] text-slate-500 mt-1 font-sans">
                          Name: {data.val.name} | Price: ${data.val.price}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] px-2.5 py-0.5 bg-indigo-55 border border-indigo-200 rounded-full text-indigo-700 font-mono font-bold">
                          TTL: {data.ttl}s
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-time speed stats */}
          <div className="pt-3 border-t border-slate-150 shrink-0">
            {latencyIndicator && (
              <div className="flex items-center gap-2 text-xs text-amber-600 font-bold py-1 animate-pulse font-sans">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                <span>{latencyIndicator}</span>
              </div>
            )}
            {activeBenchmarkTime !== null && !latencyIndicator && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] text-indigo-750 uppercase tracking-widest font-bold font-sans">Query speed output:</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    activeBenchmarkTime < 100 ? "text-emerald-700 animate-fade" : "text-rose-600 animate-pulse"
                  }`}
                >
                  ⏱️ {activeBenchmarkTime} ms {activeBenchmarkTime < 100 ? "(CACHE HIT!)" : "(SLOW DB DELAY)"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Redis stdout console logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-32 shadow-md shadow-slate-900/10">
        <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          REDIS CACHE ENGINE CONSOLE STDOUT
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {runningLog.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("HIT")
                  ? "text-emerald-400 bg-emerald-950/20"
                  : log.includes("MISS")
                  ? "text-rose-400 bg-rose-950/10"
                  : "text-slate-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 04. CELERY BACKGROUND WORKERS SIMULATOR USING RABBITMQ QUEUES
// ==============================================================================
function CeleryTaskSimulator() {
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [queueLogs, setQueueLogs] = useState<string[]>([
    "AMQP Connection established on guest:guest@localhost:5672/.",
    "Celery worker pool matching task queues started successfully with 4 concurrency threads."
  ]);

  const appendLog = (msg: string) => {
    setQueueLogs((prev) => [`[CELERY] ${msg}`, ...prev]);
  };

  const triggerPostTask = (taskType: "report" | "email" | "assets") => {
    const tId = `task-uuid-${Math.random().toString(36).substring(2, 10)}`;
    let details = "";
    let dur = 3; // default seconds

    if (taskType === "report") {
      details = "Generate PDF Report (Heavy)";
      dur = 8;
    } else if (taskType === "email") {
      details = "Send Welcome Mail (Medium)";
      dur = 3;
    } else {
      details = "Compress Asset Media (Medium)";
      dur = 5;
    }

    const taskObj = {
      id: tId,
      name: details,
      progress: 0,
      status: "QUEUED",
      duration: dur,
      startedAt: Date.now()
    };

    setActiveTasks((prev) => [...prev, taskObj]);
    appendLog(`HTTP 202: POST /tasks/${taskType} accepted. Assigned operational token (task_id: ${tId}).`);
    appendLog(`AMQP BROKER: Enqueued message properties into RabbitMQ containing Celery routing attributes.`);

    // Progress animation loop
    const increment = 100 / (dur * 10); // tick every 100ms
    let currProg = 0;
    
    // Simulate celery status shift
    setTimeout(() => {
      setActiveTasks((curr) =>
        curr.map((t) => (t.id === tId ? { ...t, status: "PROCESSING" } : t))
      );
      appendLog(`WORKER POOL: Celery worker thread popped task id '${tId}' from queue and began processing.`);
    }, 800);

    const intRef = setInterval(() => {
      currProg += increment;
      if (currProg >= 100) {
        clearInterval(intRef);
        setActiveTasks((curr) =>
          curr.map((t) => (t.id === tId ? { ...t, progress: 100, status: "SUCCESS" } : t))
        );
        appendLog(`WORKER ACKNACK: Task id '${tId}' processed successfully. Results returned over Redis Result Backend channel.`);
      } else {
        setActiveTasks((curr) =>
          curr.map((t) => (t.id === tId ? { ...t, progress: Math.min(Math.floor(currProg), 99) } : t))
        );
      }
    }, 100);
  };

  const removeFinishedTask = (id: string) => {
    setActiveTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Server className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">Celery Pipeline:</strong> Dispatch demanding computations off the web thread. Check progress tracking meters and watch RabbitMQ brokers delegate events to concurrent workers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Task triggers */}
        <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans2">DISPATCH HEAVY PROCESSES</h4>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => triggerPostTask("email")}
              className="py-2.5 px-3.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-left text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-all duration-150"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">Send Welcome Email</span>
                <span className="text-[10px] text-slate-450 italic mt-0.5">Transactional communication cycle</span>
              </div>
              <span className="text-[10px] bg-indigo-50 px-2.5 py-1 rounded text-indigo-700 border border-indigo-200 font-mono font-bold group-hover:bg-indigo-100 transition-colors">
                Duration: 3s
              </span>
            </button>
            <button
              onClick={() => triggerPostTask("assets")}
              className="py-2.5 px-3.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-left text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-all duration-150"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">Optimize Asset Media</span>
                <span className="text-[10px] text-slate-450 italic mt-0.5">Lossless compression algorithm execution</span>
              </div>
              <span className="text-[10px] bg-indigo-50 px-2.5 py-1 rounded text-indigo-700 border border-indigo-200 font-mono font-bold group-hover:bg-indigo-100 transition-colors">
                Duration: 5s
              </span>
            </button>
            <button
              onClick={() => triggerPostTask("report")}
              className="py-2.5 px-3.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-left text-xs flex justify-between items-center group cursor-pointer shadow-sm transition-all duration-150"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">PDF Report Generation</span>
                <span className="text-[10px] text-slate-450 italic mt-0.5">Heavy compilation compiling and saving files</span>
              </div>
              <span className="text-[10px] bg-indigo-50 px-2.5 py-1 rounded text-indigo-700 border border-indigo-200 font-mono font-bold group-hover:bg-indigo-100 transition-colors">
                Duration: 8s
              </span>
            </button>
          </div>
        </div>

        {/* Task Progress trackers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[350px] shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 font-sans">
              CELERY WORKER PROCESS MONITORING (Redis Backend)
            </h4>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {activeTasks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-250 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-450 italic font-sans">No tasks currently queued. Submit above.</p>
                </div>
              ) : (
                activeTasks.map((task) => (
                  <div key={task.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs space-y-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 truncate pr-2">{task.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          task.status === "QUEUED"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : task.status === "PROCESSING"
                            ? "bg-orange-50 text-orange-700 border-orange-200 animate-pulse"
                            : "bg-emerald-50 text-emerald-700 border-emerald-250"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>ID: {task.id}</span>
                        <span className="font-bold">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-indigo-650 h-full transition-all duration-100 ease-out"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {task.status === "SUCCESS" && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 text-[10px] font-sans">
                        <span className="text-slate-400">Success ACK logged</span>
                        <button
                          onClick={() => removeFinishedTask(task.id)}
                          className="text-indigo-600 hover:text-indigo-850 font-bold underline cursor-pointer"
                        >
                          Clear handle
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Celery logs output */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-32 shadow-md shadow-slate-900/10">
        <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          CELERY DAEMON STDOUT BROKER INTERACTION CONSOLE
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {queueLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("REJECT")
                  ? "text-rose-400"
                  : log.includes("SUCCESS") || log.includes("ACKNACK")
                  ? "text-emerald-400 bg-emerald-950/20"
                  : "text-slate-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 05. WEBSOCKETS CHAT SIMULATOR ENGINE (BIDIRECTIONAL MULTI WINDOW MULTIPLEXING)
// ==============================================================================
function WebSocketsChatSimulator() {
  const [activeClients, setActiveClients] = useState<any[]>([
    { username: "Sven_Staff", connected: true, msgInput: "" },
    { username: "Amara_Dev", connected: true, msgInput: "" }
  ]);
  const [intercomLogs, setIntercomLogs] = useState<string[]>([
    "WebSocket endpoint initialized: ws://localhost:3000/ws/{room_id}/{username}",
    "Room mapping active. Multi-client session active on room='general'."
  ]);
  const [simFeed, setSimFeed] = useState<Array<{ sender: string; body: string; type: string }>>([
    { sender: "System", body: "User Sven_Staff joined the chat room", type: "notification" },
    { sender: "System", body: "User Amara_Dev joined the chat room", type: "notification" }
  ]);

  const appendIntercomLog = (msg: string) => {
    setIntercomLogs((prev) => [`[WS-CORE] ${msg}`, ...prev]);
  };

  const handleConnectClient = (idx: number, state: boolean) => {
    const updated = [...activeClients];
    updated[idx].connected = state;
    setActiveClients(updated);

    const client = updated[idx];
    if (state) {
      appendIntercomLog(`HANDSHAKE ACCEPTED: Upgrade protocol standard client ws://${client.username} on room 'general'.`);
      const joinMsg = { sender: "System", body: `User ${client.username} connected to the room.`, type: "notification" };
      setSimFeed((prev) => [...prev, joinMsg]);
    } else {
      appendIntercomLog(`SOCKET DROPPED: Client WS frame unregistered for user @${client.username}.`);
      const leaveMsg = { sender: "System", body: `${client.username} disconnected from the channel.`, type: "notification" };
      setSimFeed((prev) => [...prev, leaveMsg]);
    }
  };

  const handleBroadcastMessage = (idx: number) => {
    const updated = [...activeClients];
    const client = updated[idx];
    if (!client.msgInput || !client.connected) return;

    appendIntercomLog(`FRAME BROADCAST: Received raw payload frame of size ${client.msgInput.length} bytes from user '${client.username}'.`);
    
    const newMsg = {
      sender: client.username,
      body: client.msgInput,
      type: "message"
    };

    setSimFeed((prev) => [...prev, newMsg]);
    updated[idx].msgInput = "";
    setActiveClients(updated);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Zap className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">WebSocket Real-time Client:</strong> Simulate authentic full-duplex communication pipelines. Send binary payloads from client nodes and inspect handshake agreements live.
        </p>
      </div>

      {/* Concurrent dual mock client boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeClients.map((client, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-[300px] shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 font-mono">@{client.username}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleConnectClient(idx, true)}
                    className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                      client.connected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-400 border-slate-205 hover:text-slate-600"
                    }`}
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => handleConnectClient(idx, false)}
                    className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                      !client.connected
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-50 text-slate-400 border-slate-205 hover:text-slate-600"
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Chat history list */}
              <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[11px] h-36 overflow-y-auto space-y-1.5 shadow-inner">
                {simFeed.map((msg, i) => (
                  <div key={i} className="leading-relaxed">
                    {msg.type === "notification" ? (
                      <span className="text-slate-400 italic block py-0.5 text-center text-[10px] select-none">
                        ⚙️ {msg.body}
                      </span>
                    ) : (
                      <div className="font-sans">
                        <span
                          className={`font-bold font-mono ${
                            msg.sender === client.username ? "text-indigo-600" : "text-amber-600"
                          }`}
                        >
                          @{msg.sender}
                        </span>
                        <span className="text-slate-700 font-medium">: {msg.body}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Client messaging footer */}
            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                placeholder={client.connected ? "Type broadcast data..." : "Connect first"}
                disabled={!client.connected}
                value={client.msgInput}
                onChange={(e) => {
                  const updated = [...activeClients];
                  updated[idx].msgInput = e.target.value;
                  setActiveClients(updated);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBroadcastMessage(idx);
                }}
                className="flex-1 bg-white text-xs border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 disabled:opacity-50 shadow-sm transition-all font-sans"
              />
              <button
                onClick={() => handleBroadcastMessage(idx)}
                disabled={!client.connected}
                className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-2 flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-sm transition-colors"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Frame multiplex log history */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-32 shadow-md shadow-slate-900/10">
        <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          WEBSOCKET PROTOCOL Handshakes AND DATA FRAME LOOPS
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {intercomLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("HANDSHAKE")
                  ? "text-emerald-400 bg-emerald-950/20"
                  : log.includes("FRAME")
                  ? "text-cyan-300 bg-cyan-950/10"
                  : "text-slate-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 06. STRAWBERRY GRAPHQL EXPERIMENTAL SANDBOX
// ==============================================================================
function GraphQLPlaygroundSimulator() {
  const [selectedSchemaQuery, setSelectedSchemaQuery] = useState("queryUsers");
  const [schemaResult, setSchemaResult] = useState<string>(
    JSON.stringify(
      {
        data: {
          listUsers: [
            { id: 1, username: "alice", role: "admin", email: "alice@corp.com" },
            { id: 2, username: "bob", role: "editor", email: "bob@corp.com" }
          ]
        }
      },
      null,
      2
    )
  );
  const [strawberryLogs, setStrawberryLogs] = useState<string[]>([
    "Strawberry GraphQL Router registered. GraphiQL interface configured.",
    "Subscription channel established: monitorRegistrations async generator ready."
  ]);

  const prependGraphqlLog = (msg: string) => {
    setStrawberryLogs((prev) => [`[GQL-STRAWBERRY] ${msg}`, ...prev]);
  };

  const executeGraphQLResolver = () => {
    prependGraphqlLog(`AST PARSING: Resolving query operation '${selectedSchemaQuery}'...`);
    if (selectedSchemaQuery === "queryUsers") {
      setSchemaResult(
        JSON.stringify(
          {
            data: {
              listUsers: [
                { id: 1, username: "alice", role: "admin", email: "alice@corp.com" },
                { id: 2, username: "bob", role: "editor", email: "bob@corp.com" }
              ]
            }
          },
          null,
          2
        )
      );
      prependGraphqlLog("RESOLVER OK: Executed list_users static list resolver.");
    } else if (selectedSchemaQuery === "findUser") {
      setSchemaResult(
        JSON.stringify(
          {
            data: {
              findUserById: { id: 1, username: "alice", role: "admin", email: "alice@corp.com" }
            }
          },
          null,
          2
        )
      );
      prependGraphqlLog("RESOLVER OK: Executed find_user_by_id resolver matching argument: user_id=1.");
    } else {
      setSchemaResult(
        JSON.stringify(
          {
            data: {
              registerUser: { id: 3, username: "test_dev", role: "junior", email: "test_dev@gmail.com" }
            }
          },
          null,
          2
        )
      );
      prependGraphqlLog("MUTATION SUCCESS: Executed register_user mutation resolver to write simulated records.");
      prependGraphqlLog("EVENT DISPATCH: Subscription channel yielded new registration: 'LOG: Registered user test_dev with role junior'.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Layers className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">GraphQL Strawberry Laboratory:</strong> Run type-safe schemas without database over-fetching. Test mock mutations and subscription streams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Operations editor selector */}
        <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center bg-white p-2.5 border border-slate-200 rounded-lg shadow-sm">
            <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold font-sans">Select Query</span>
            <select
              value={selectedSchemaQuery}
              onChange={(e) => setSelectedSchemaQuery(e.target.value)}
              className="bg-transparent text-xs text-indigo-600 font-bold focus:outline-none cursor-pointer font-sans"
            >
              <option value="queryUsers">Query: Get All Users</option>
              <option value="findUser">Query: Find User ID 1</option>
              <option value="mutationRegister">Mutation: Create User</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono text-[11px] h-36 overflow-y-auto leading-relaxed text-indigo-650 shadow-inner">
            {selectedSchemaQuery === "queryUsers" && (
              <pre className="whitespace-pre">
                {`query GetUsers {
  listUsers {
    id
    username
    role
    email
  }
}`}
              </pre>
            )}
            {selectedSchemaQuery === "findUser" && (
              <pre className="whitespace-pre">
                {`query FetchUser {
  findUserById(userId: 1) {
    username
    role
  }
}`}
              </pre>
            )}
            {selectedSchemaQuery === "mutationRegister" && (
              <pre className="whitespace-pre">
                {`mutation CreateNewMember {
  registerUser(
    username: "test_dev",
    email: "test_dev@gmail.com",
    role: "junior"
  ) {
    id
    username
  }
}`}
              </pre>
            )}
          </div>

          <button
            onClick={executeGraphQLResolver}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Play className="h-3 w-3" />
            <span>Execute GraphQL Resolver</span>
          </button>
        </div>

        {/* GraphQL outputs JSON */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[300px] shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-sans">RESOLVED DATA OUTPUT (JSON)</h4>
            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 font-mono text-[11px] text-emerald-700 h-44 overflow-y-auto select-all leading-normal shadow-inner">
              <pre className="whitespace-pre">{schemaResult}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Strawberry stdout console logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-32 shadow-md shadow-slate-900/10">
        <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-850 text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
          STRAWBERRY ENGINE GRAPHQL RESOLVER ENGINE STDOUT
        </div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1 select-all leading-relaxed">
          {strawberryLogs.map((log, i) => (
            <div
              key={i}
              className={`p-1 rounded ${
                log.includes("RESOLVER")
                  ? "text-emerald-400 bg-emerald-950/20"
                  : log.includes("AST")
                  ? "text-indigo-300 bg-indigo-950/10"
                  : "text-slate-400"
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 07. DOCKER SETUP SIMULATOR (NETWORK BRIDGING DIAGRAMS)
// ==============================================================================
function DockerNetworksSimulator() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("postgres");

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Layers className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">Docker Compose Orchestration:</strong> Inspect architecture dependencies, port bridges, and configuration files of containers running inside our virtual system network.
        </p>
      </div>

      {/* Network visualization diagram */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 bg-slate-50 border border-slate-205 rounded-xl p-4 flex flex-col justify-center shadow-sm">
          <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider text-center mb-4">
            ORCHESTRATED SERVICES DICTIONARY
          </h4>
          <div className="relative border border-slate-200 p-4 rounded-xl bg-white grid grid-cols-2 gap-3 shadow-inner">
            <button
              onClick={() => setSelectedNodeId("postgres")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                selectedNodeId === "postgres"
                  ? "bg-indigo-50/50 border-indigo-500 text-slate-800 ring-1 ring-indigo-500"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-bold font-mono">postgres_db</div>
              <div className="text-[10px] text-slate-450 mt-1 font-sans">Host: db | Port: 5432</div>
            </button>
            <button
              onClick={() => setSelectedNodeId("redis")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                selectedNodeId === "redis"
                  ? "bg-indigo-50/50 border-indigo-500 text-slate-800 ring-1 ring-indigo-500"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-bold font-mono">redis_cache</div>
              <div className="text-[10px] text-slate-450 mt-1 font-sans">Host: cache | Port: 6379</div>
            </button>
            <button
              onClick={() => setSelectedNodeId("rabbitmq")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                selectedNodeId === "rabbitmq"
                  ? "bg-indigo-50/50 border-indigo-500 text-slate-800 ring-1 ring-indigo-500"
                  : "bg-slate-50 border-slate-205 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-bold font-mono">rabbitmq_broker</div>
              <div className="text-[10px] text-slate-450 mt-1 font-sans">Host: broker | Port: 5672</div>
            </button>
            <button
              onClick={() => setSelectedNodeId("fastapi")}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                selectedNodeId === "fastapi"
                  ? "bg-indigo-50/50 border-indigo-500 text-slate-800 ring-1 ring-indigo-500"
                  : "bg-slate-50 border-slate-205 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-bold font-mono">api_service</div>
              <div className="text-[10px] text-slate-450 mt-1 font-sans">Host: app | Port: 8000</div>
            </button>
          </div>
        </div>

        {/* Selected container node data */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[350px] shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-sans">SERVICE SPECIFICATIONS</h4>
            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 font-mono text-[11px] space-y-3 h-52 overflow-y-auto shadow-inner">
              {selectedNodeId === "postgres" && (
                <div className="space-y-2">
                  <div className="text-indigo-650 font-bold uppercase text-[10px]">Service: Database</div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    Persistent database. Mounts automated health checks on port 5432 to prevent down-stream application containers booting prematurely before PostgreSQL is ready to take connections.
                  </p>
                  <pre className="text-emerald-700 text-[10px] border border-slate-200 p-2 rounded bg-white font-mono shadow-sm">
                    {`environment:
  POSTGRES_USER: postgres
  POSTGRES_DB: backend_db`}
                  </pre>
                </div>
              )}
              {selectedNodeId === "redis" && (
                <div className="space-y-2">
                  <div className="text-indigo-650 font-bold uppercase text-[10px]">Service: Cache Store</div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    RAM cache and result store repository. Coordinates fast read offloading. Wires into the same bridge network as the application and queued workers.
                  </p>
                  <pre className="text-emerald-700 text-[10px] border border-slate-200 p-2 rounded bg-white font-mono shadow-sm">
                    {`image: redis:7-alpine
ports:
  - "6379:6379"`}
                  </pre>
                </div>
              )}
              {selectedNodeId === "rabbitmq" && (
                <div className="space-y-2">
                  <div className="text-indigo-650 font-bold uppercase text-[10px]">Service: Message Broker</div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    Broker for Celery asynchronous worker pools. Directs data tasks smoothly. Exposes management dashboard console interface for local audit checks.
                  </p>
                  <pre className="text-emerald-700 text-[10px] border border-slate-200 p-2 rounded bg-white font-mono shadow-sm">
                    {`image: rabbitmq:3-management
ports:
  - "5672:5672"
  - "15672:15672"`}
                  </pre>
                </div>
              )}
              {selectedNodeId === "fastapi" && (
                <div className="space-y-2">
                  <div className="text-indigo-650 font-bold uppercase text-[10px]">Service: FastAPI Server</div>
                  <p className="text-slate-600 text-xs font-sans leading-relaxed">
                    Multi-stage production build running the main server on port 8000. Leverages secure user-privileges blocks (non-root security configuration).
                  </p>
                  <pre className="text-emerald-700 text-[10px] border border-slate-200 p-2 rounded bg-white font-mono shadow-sm">
                    {`depends_on:
  postgres_db:
    condition: service_healthy`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 08. GITHUB ACTIONS CI STATUS WORKFLOW SIMULATOR
// ==============================================================================
function GithubActionsWorkflowSimulator() {
  const [pipelineProgress, setPipelineProgress] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  const executePipelineSequence = async () => {
    if (pipelineProgress === "RUNNING") return;
    setPipelineProgress("RUNNING");
    setPipelineLogs([]);

    const steps = [
      { name: "Triggering build hook: Git Push detected.", dur: 400 },
      { name: "Setting up runner pool VM: ubuntu-latest...", dur: 450 },
      { name: "Cloning source repository quayecodes/backend-engineering...", dur: 300 },
      { name: "Installing Python version 3.11 with pip caching...", dur: 600 },
      { name: "Executing Black code formatter controls (PEP 8 check)...", dur: 500 },
      { name: "✔ Black check SUCCESS: 0 files modified.", dur: 200 },
      { name: "Executing Flake8 structural check on module libraries...", dur: 500 },
      { name: "✔ Flake8 check SUCCESS: 100% clean formatting.", dur: 200 },
      { name: "Initializing testing micro-infrastructure nodes (PostgreSQL + Redis)...", dur: 800 },
      { name: "Executing Pytest runner suite over database and cache drivers...", dur: 700 },
      { name: "✔ Unit test 1 SUCCESS: test_rest_api_main_endpoints_pass", dur: 200 },
      { name: "✔ Unit test 2 SUCCESS: test_redis_cache_aside_lazy_validation", dur: 200 },
      { name: "✔ Unit test 3 SUCCESS: test_celery_rabbitmq_concurrency_trackers", dur: 200 },
      { name: "Compiling optimized multi-stage Docker image layers...", dur: 800 },
      { name: "Logging in to GitHub Container Registry (GHCR)...", dur: 300 },
      { name: "Publishing container build image: ghcr.io/backend-api:latest ...", dur: 800 },
      { name: "✔ SUCCESS: CI Workflow validation completed successfully.", dur: 200 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setPipelineLogs((curr) => [...curr, `[GITHUB-ACTION] ${steps[i].name}`]);
      await new Promise((r) => setTimeout(r, steps[i].dur));
      
      // Auto-scroll logs container if elements exist
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }

    setPipelineProgress("COMPLETED");
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-sm">
        <Github className="h-4 w-4 text-indigo-650 shrink-0" />
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          <strong className="text-indigo-805 font-bold">GitHub Actions CI Workspace:</strong> Run tests and lints automatically on repository push. Witness visual terminal diagnostics run format check and export docker files successfully.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status indicator panel */}
        <div className="md:col-span-1 bg-slate-50 border border-slate-205 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider mb-2 font-sans">INTEGRATION RUNNER</h4>
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 font-sans">Pipeline State:</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    pipelineProgress === "IDLE"
                      ? "text-slate-400"
                      : pipelineProgress === "RUNNING"
                      ? "text-amber-500 animate-pulse"
                      : "text-emerald-650"
                  }`}
                >
                  {pipelineProgress}
                </span>
              </div>

              {pipelineProgress === "RUNNING" && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-slate-100">
                    <div className="animate-pulse bg-indigo-600 w-full rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={executePipelineSequence}
            disabled={pipelineProgress === "RUNNING"}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors rounded-lg disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Play className="h-3 w-3" />
            <span>Trigger GitHub Actions Push</span>
          </button>
        </div>

        {/* Real-time scrolled logs card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[280px] shadow-sm">
          <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-mono tracking-widest font-bold text-slate-400 uppercase">
              GITHUB LINUX RUNNER VM TERMINAL
            </span>
            {pipelineProgress === "COMPLETED" && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span>BUILD GREEN</span>
              </span>
            )}
          </div>
          <div
            ref={logsRef}
            className="p-3 overflow-y-auto flex-1 font-mono text-[10px] text-slate-300 space-y-1 select-all select-all leading-relaxed"
          >
            {pipelineLogs.length === 0 ? (
              <p className="text-slate-500 text-center italic py-20 font-sans">Actions container waiting. Dispatch push events above.</p>
            ) : (
              pipelineLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-1 rounded ${
                    log.includes("✔") || log.includes("SUCCESS")
                      ? "text-emerald-400 bg-emerald-950/20"
                      : log.includes("Error")
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// MODULE DEFAULT. REPOSITORY OVERVIEW / SUMMARY STATS
// ==============================================================================
function RepoRootOverviewSimulator() {
  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 shadow-sm">
        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-650" />
          <span>Curriculum Laboratory Standard Reference Guidelines</span>
        </h4>
        <p className="text-xs text-slate-655 leading-relaxed font-sans">
          The code modules compiled inside this platform are engineered to embody high-performance backend patterns. Standardized with Python type hints and clean structures, these modules prepare developers to implement robust, enterprise-grade architectures locally or on container infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-sm">
          <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto" />
          <h5 className="text-xs font-bold text-slate-800 mt-1 uppercase font-sans">100% Complete Code</h5>
          <p className="text-[10px] text-slate-450">No mock pseudocode structures inside files.</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-sm">
          <Layers className="h-6 w-6 text-indigo-650 mx-auto" />
          <h5 className="text-xs font-bold text-slate-800 mt-1 uppercase font-sans">Full Integration</h5>
          <p className="text-[10px] text-slate-450">Docker compose bridges databases and worker nodes.</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-sm col-span-2 lg:col-span-1">
          <Download className="h-6 w-6 text-indigo-650 mx-auto" />
          <h5 className="text-xs font-bold text-slate-800 mt-1 uppercase font-sans">Direct Exporter</h5>
          <p className="text-[10px] text-slate-450">Generate real offline repository with one-click export.</p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl shadow-sm">
        <span className="text-[10px] text-slate-450 font-mono tracking-widest uppercase block mb-2 font-bold">QUICK START BLUEPRINT ASSEMBLY COMMANDS</span>
        <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300 space-y-1.5 leading-relaxed select-all">
          <p className="text-slate-550">{`# Clone or extract physical zip directory content`}</p>
          <p className="text-white">{`cd docker/`}</p>
          <p className="text-white">{`docker-compose up --build -d`}</p>
          <p className="text-slate-500">{`# FastAPI automatically launches on http://localhost:8000/docs`}</p>
        </div>
      </div>
    </div>
  );
}

// Small dictionary signature check helper
interface dict<K extends string, V> {
  [key: string]: V;
}

// ==============================================================================
// SYSTEM ARCHITECTURE DIAGRAM & GLOBAL DOCUMENTATION HUB
// ==============================================================================

interface ArchNodeMeta {
  id: string;
  name: string;
  tag: string;
  role: string;
  port: string;
  protocol: string;
  fileReference: string;
  description: string;
  sublist: string[];
  x: number;
  y: number;
  colorClass: string;
  iconName: "client" | "fastapi" | "postgres" | "redis" | "rabbitmq" | "celery" | "docker" | "cicd";
}

const ARCH_NODES_DATA: ArchNodeMeta[] = [
  {
    id: "client",
    name: "Client Dashboard SPA",
    tag: "spa_client_gateway",
    role: "User Interface / Visual Console",
    port: "3000 (Local Ingress Agent)",
    protocol: "HTTP 1.1 / JSON / WS RFC 6455",
    fileReference: "/src/App.tsx",
    description: "Built with React 18, Vite, and Tailwind CSS. Acts as the primary student lab interface. Initiates client-side state machine updates, upgrades connections to the real-time event pipeline, and issues GraphQL queries to fetch combined entities without database over-fetching.",
    sublist: [
      "Dynamic rendering powered by conditional state variables",
      "Interactive SVG blueprint overlays mapping data packets",
      "One-click master ZIP compilation directly from in-memory arrays"
    ],
    x: 80,
    y: 220,
    colorClass: "border-indigo-200 text-indigo-700 bg-indigo-50",
    iconName: "client"
  },
  {
    id: "fastapi",
    name: "FastAPI Application Server",
    tag: "gateway_application_node",
    role: "Primary Router & Controller",
    port: "8000 (Docker Private Net)",
    protocol: "Asynchronous Python ASGI",
    fileReference: "/01-rest-api/app/main.py",
    description: "The core engine coordinating business logic. Implements highperformance asynchronous routes utilizing Starlette engine layers and Pydantic v2 schemas. Validates incoming payload matrices, enforces token-based JWT boundary filters, and manages active async SQL database pools.",
    sublist: [
      "Asynchronous non-blocking concurrency model matching uvloop",
      "Automatic OpenAPI specifications generation (exposing /docs)",
      "Strict asymmetric RS256 JWT validation and decoding layers"
    ],
    x: 310,
    y: 220,
    colorClass: "border-indigo-500 text-slate-800 ring-2 ring-indigo-550",
    iconName: "fastapi"
  },
  {
    id: "postgres",
    name: "PostgreSQL Async Database",
    tag: "postgresql_relational_target",
    role: "Persistent Storage Engine",
    port: "5432 (Internal Port Bridge)",
    protocol: "TCP Wire Protocol",
    fileReference: "/01-rest-api/app/database.py",
    description: "Relational persistence vault containing production user matrices and nested item tables. Seamlessly integrated with Alembic migration directories for version tracking, utilizing the asynchronous dialect aspg (asyncpg) to sustain non-blocking queries.",
    sublist: [
      "Configured via SQLAlchemy 2.0 async sessionmaker",
      "Database schema versioned via atomic migration rollback files",
      "Robust index mapping on primary keys and foreign key constraints"
    ],
    x: 310,
    y: 360,
    colorClass: "border-emerald-300 text-slate-800 bg-emerald-50",
    iconName: "postgres"
  },
  {
    id: "redis",
    name: "Redis Cache Store",
    tag: "redis_ram_cache",
    role: "High-Speed Caching Layer",
    port: "6379 (Internal Port Bridge)",
    protocol: "RESP (Redis Serialization Protocol)",
    fileReference: "/03-caching/app/redis_client.py",
    description: "Facilitates sub-millisecond document access latencies by caching queried SQL rows in-memory. Implements custom Cache-Aside invalidation policies and coordinates persistent session data. Exposes granular TTL key controls to prevent stale configuration states.",
    sublist: [
      "Guarantees ultra-low latencies for frequently-accessed records",
      "Custom eviction profiles and programmatic key invalidation thresholds",
      "Serves as the high-availability storage tier for session caches"
    ],
    x: 520,
    y: 220,
    colorClass: "border-amber-300 text-slate-800 bg-amber-50",
    iconName: "redis"
  },
  {
    id: "rabbitmq",
    name: "RabbitMQ Message Broker",
    tag: "rabbitmq_broker",
    role: "Asynchronous Queue Orchestrator",
    port: "5672 (Payloads) / 15672 (Admin Dashboard)",
    protocol: "AMQP (Advanced Message Queuing Protocol)",
    fileReference: "/04-message-queues/docker-compose.yml",
    description: "Translates and queues high-overhead operational tasks dispatching from primary HTTP threads. Buffers peak traffic volume spikes cleanly, utilizing AMQP channels to delegate message delivery guarantees to the backend worker pools.",
    sublist: [
      "Orchestrates robust queue clusters insulating application threads",
      "Exposes interactive system health diagnostics on standard 15672",
      "Decoupled publish/subscribe routing via customizable message exchanges"
    ],
    x: 520,
    y: 80,
    colorClass: "border-blue-300 text-slate-800 bg-blue-50",
    iconName: "rabbitmq"
  },
  {
    id: "celery",
    name: "Celery Distributed Workers",
    tag: "celery_async_worker_pool",
    role: "Asynchronous Task Consumer",
    port: "Distributed Daemon Thread Pool",
    protocol: "Internal Message Queue Consumer",
    fileReference: "/04-message-queues/app/tasks.py",
    description: "Multi-threaded daemon nodes pulling and processing queued background payloads asynchronously. Completely handles high-latency operational loops, like PDF generation, file structures packaging, and batch database queries.",
    sublist: [
      "Decoupled concurrency engines preventing web application timeout errors",
      "Automated fallback task retries and error exception catch logic",
      "Persists finished computation statuses directly back to the database"
    ],
    x: 710,
    y: 80,
    colorClass: "border-cyan-300 text-slate-800 bg-cyan-50",
    iconName: "celery"
  },
  {
    id: "docker",
    name: "Docker Compose Network",
    tag: "docker_hypervisor_ring",
    role: "Infrastructure Container Isolation",
    port: "Isolated Private Bridge Interfaces",
    protocol: "Private Namespace DNS Routing",
    fileReference: "/docker/docker-compose.yml",
    description: "Fuses backend services, message brokers, caching nodes, and databases into a standard host-independent ecosystem. Locks down routing boundaries via custom virtual network bridges and implements healthchecks to enforce strict execution sequences.",
    sublist: [
      "Ensures absolute local replication of multi-layered production setups",
      "Guards upstream containers from booting before backplane databases are ready",
      "Frictionless configuration setup via parameterized YAML blueprints"
    ],
    x: 710,
    y: 280,
    colorClass: "border-slate-350 text-slate-800 bg-slate-100",
    iconName: "docker"
  },
  {
    id: "cicd",
    name: "GitHub Actions Runner CI",
    tag: "cicd_pipeline_runner",
    role: "Continuous Integration Workflow",
    port: "External Webhooks Pipeline",
    protocol: "HTTPS REST API Handshake",
    fileReference: "/.github/workflows/ci.yml",
    description: "Performs strict architectural hygiene audits on every git push event. Automatically runs quality linting procedures, verifies structural typescript compile stages, and tests code completeness to block syntax regressions from reaching master stages.",
    sublist: [
      "Comprehensive TypeScript and Linter status checking pipelines",
      "Parallel verification containers validating backend PEP8 limits",
      "Prepares Docker container layers cleanly for production targets"
    ],
    x: 80,
    y: 80,
    colorClass: "border-slate-205 text-slate-850 bg-slate-50",
    iconName: "cicd"
  }
];

function ArchitectureDocsHub() {
  const [selectedNode, setSelectedNode] = useState<string>("fastapi");
  const [activeTab, setActiveTab] = useState<"specs" | "pillars" | "quickstart" | "flows">("specs");
  const [nodeSearchQuery, setNodeSearchQuery] = useState<string>("");

  const matchedNodeIds = React.useMemo(() => {
    if (!nodeSearchQuery.trim()) {
      return ARCH_NODES_DATA.map((n) => n.id);
    }
    const q = nodeSearchQuery.toLowerCase();
    return ARCH_NODES_DATA.filter(
      (node) =>
        node.name.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q)
    ).map((n) => n.id);
  }, [nodeSearchQuery]);

  const matchedNodesCount = matchedNodeIds.length;

  const currentNode = ARCH_NODES_DATA.find((n) => n.id === selectedNode) || ARCH_NODES_DATA[1];

  const renderNodeIcon = (iconName: string) => {
    switch (iconName) {
      case "client":
        return <Users className="h-4 w-4 text-indigo-650" />;
      case "fastapi":
        return <Cpu className="h-4 w-4 text-indigo-600" />;
      case "postgres":
        return <Database className="h-4 w-4 text-emerald-600" />;
      case "redis":
        return <Zap className="h-4 w-4 text-amber-500" />;
      case "rabbitmq":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "celery":
        return <Layers className="h-4 w-4 text-cyan-600" />;
      case "docker":
        return <Layers className="h-4 w-4 text-indigo-500" />;
      case "cicd":
        return <Github className="h-4 w-4 text-slate-650" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-hidden flex flex-col">
      {/* Overview introduction panel */}
      <div className="px-6 py-4.5 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span>Interactive System Architecture & Engineering Documentation Hub</span>
          </h2>
          <p className="text-xs text-slate-550 mt-0.5 font-sans leading-relaxed">
            Examine system-wide operational layers, connection ports routing, container structures, and production-grade software engineering pillars.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-[11px] text-indigo-750 font-bold font-sans shadow-sm">
          <BookOpen className="h-3.5 w-3.5 text-indigo-650" />
          <span>8 Active Microservice Subsystems Map</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto xl:overflow-hidden">
        
        {/* LEFT COMPONENT (GRID 7 COLS) - INTERACTIVE INLINE SVG CANVAS MAP */}
        <section className="col-span-1 xl:col-span-7 flex flex-col gap-6 h-auto xl:h-[calc(100vh-12.5rem)] xl:overflow-y-auto pr-1">
          
          {/* Node Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter subsystems by name or description (e.g. database, redis, queue)..."
                value={nodeSearchQuery}
                onChange={(e) => setNodeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white"
              />
              {nodeSearchQuery && (
                <button
                  onClick={() => setNodeSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>
            {nodeSearchQuery && (
              <span className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg shrink-0">
                {matchedNodesCount} Matched
              </span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm h-[480px] sm:h-[550px] xl:h-auto xl:flex-1">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">LIVE TOPOLOGY MAP (INTERACTIVE BLUEPRINT)</h3>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">Click any node to reveal specification manuals and file references on the right</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider tracking-tight font-sans">
                Active Event Streams Animating
              </span>
            </div>

            {/* SVG Visualizer Container */}
            <div className="p-4 bg-slate-900 flex-1 flex items-center justify-center relative min-h-[350px]">
              {/* Subtle background blueprints mesh pattern overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:20px_20px]" />

              <svg viewBox="0 0 800 420" className="w-full h-full max-w-4xl z-10 select-none">
                <defs>
                  {/* Arrow marker for direct flow lines */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                  </marker>
                  
                  {/* Glowing active node filter */}
                  <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* BACKGROUND GROUP: DOCKER COMPOSE NETWORK DASHED BRIDGE BOX */}
                <rect x="200" y="25" width="580" height="375" rx="12" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="8,6" opacity="0.65" />
                <text x="215" y="45" fill="#94a3b8" className="font-mono text-[9px] font-bold tracking-widest uppercase">
                  [ DOCKER COMPOSE PRIVATE VIRTUAL BRIDGE NETWORK ]
                </text>

                {/* NETWORK CHANNELS AND animated data packets */}
                
                {/* 1. Client to FastAPI Core Connection */}
                <path d="M 80 220 H 310" stroke="#818cf8" strokeWidth="2.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" fill="none" opacity="0.8" />
                <path d="M 80 220 H 310" stroke="#c7d2fe" strokeWidth="2.5" strokeDasharray="8,10" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="100;0" dur="4s" repeatCount="indefinite" />
                </path>

                {/* 2. FastAPI to PostgreSQL Store */}
                <path d="M 310 220 V 360" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" fill="none" opacity="0.8" />
                <path d="M 310 220 V 360" stroke="#a7f3d0" strokeWidth="2.5" strokeDasharray="8,8" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="50;0" dur="3s" repeatCount="indefinite" />
                </path>

                {/* 3. FastAPI to Redis Caching */}
                <path d="M 310 220 H 520" stroke="#f59e0b" strokeWidth="2.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" fill="none" opacity="0.8" />
                <path d="M 310 220 H 520" stroke="#fcd34d" strokeWidth="2.5" strokeDasharray="8,12" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="100;0" dur="2s" repeatCount="indefinite" />
                </path>

                {/* 4. FastAPI dispatching background queues to RabbitMQ */}
                <path d="M 310 220 L 520 80" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" fill="none" opacity="0.8" />
                <path d="M 310 220 L 520 80" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6,8" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="80;0" dur="2.5s" repeatCount="indefinite" />
                </path>

                {/* 5. RabbitMQ distributing events to Celery Workers */}
                <path d="M 520 80 H 710" stroke="#22d3ee" strokeWidth="2" markerEnd="url(#arrow)" fill="none" opacity="0.8" />
                <path d="M 520 80 H 710" stroke="#c2f3fc" strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="60;0" dur="1.5s" repeatCount="indefinite" />
                </path>

                {/* 6. Celery Workers storing processing output task results back in Redis */}
                <path d="M 710 80 L 520 220" stroke="#a5b4fc" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" opacity="0.6" strokeDasharray="4,4" />

                {/* 7. Celery Workers committing post-task updates back into postgres */}
                <path d="M 710 80 L 310 360" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" opacity="0.5" strokeDasharray="5,5" />

                {/* 8. CI/CD triggering system image updates */}
                <path d="M 80 80 V 220" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" fill="none" opacity="0.7" />
                <path d="M 80 80 V 220" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8,8" fill="none" opacity="0.8">
                  <animate attributeName="stroke-dashoffset" values="70;0" dur="5s" repeatCount="indefinite" />
                </path>
                
                {/* 9. CI/CD pushing updates straight into FastAPI core */}
                <path d="M 80 80 L 310 220" stroke="#6366f1" strokeWidth="2.5" markerEnd="url(#arrow)" fill="none" opacity="0.75" />
                <path d="M 80 80 L 310 220" stroke="#e0e7ff" strokeWidth="2.5" strokeDasharray="8,10" fill="none" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" values="100;0" dur="3s" repeatCount="indefinite" />
                </path>

                {/* RENDER THE INTERACTIVE BLOCK NODES */}
                {ARCH_NODES_DATA.map((node) => {
                  const isSelected = selectedNode === node.id;
                  const isMatched = matchedNodeIds.includes(node.id);
                  const isSearchActive = nodeSearchQuery.trim() !== "";
                  
                  // Coordinate bounds
                  const boxWidth = 140;
                  const boxHeight = 58;
                  const bx = node.x - boxWidth / 2;
                  const by = node.y - boxHeight / 2;

                  // Opacity dimming for non-matching nodes during active search
                  const nodeOpacity = isSearchActive && !isMatched ? 0.25 : 1.0;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer group transition-all duration-200"
                      onClick={() => setSelectedNode(node.id)}
                      style={{ opacity: nodeOpacity }}
                    >
                      {/* Luminous halo under selection */}
                      {isSelected && (
                        <rect
                          x={bx - 4}
                          y={by - 4}
                          width={boxWidth + 8}
                          height={boxHeight + 8}
                          rx="14"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3.5"
                          opacity="0.85"
                          filter="url(#nodeGlow)"
                        />
                      )}

                      {/* Pulsing highlight halo for matching nodes with active search query */}
                      {isSearchActive && isMatched && (
                        <rect
                          x={bx - 6}
                          y={by - 6}
                          width={boxWidth + 12}
                          height={boxHeight + 12}
                          rx="16"
                          fill="none"
                          stroke="#eab308" // Premium gold outline for active selection matches
                          strokeWidth="3"
                          strokeDasharray="4 2"
                          opacity="0.9"
                          className="animate-pulse"
                        />
                      )}

                      {/* Box Background */}
                      <rect
                        x={bx}
                        y={by}
                        width={boxWidth}
                        height={boxHeight}
                        rx="10"
                        fill={isSelected ? "#1e1b4b" : "#f1f5f9"}
                        stroke={isSelected ? "#6366f1" : "#cbd5e1"}
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        className="transition-all duration-200 group-hover:stroke-indigo-400 group-hover:fill-slate-800/20"
                      />

                      {/* Title Header */}
                      <text
                        x={node.x}
                        y={node.y - 4}
                        textAnchor="middle"
                        fill={isSelected ? "#ffffff" : "#0f172a"}
                        className="font-sans text-[11px] font-bold tracking-tight"
                      >
                        {node.name.length > 20 ? node.name.substring(0, 18) + ".." : node.name}
                      </text>

                      {/* Service Tag label */}
                      <text
                        x={node.x}
                        y={node.y + 11}
                        textAnchor="middle"
                        fill={isSelected ? "#a5b4fc" : "#64748b"}
                        className="font-mono text-[8px] font-bold uppercase tracking-wider"
                      >
                        {node.tag}
                      </text>

                      {/* Connection status light dot in top right */}
                      <circle cx={bx + boxWidth - 10} cy={by + 10} r="3" fill="#10b981" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quick-reference context card in footer of the canvas */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-3.5">
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed text-center md:text-left">
                💡 <strong className="text-slate-800">Operational Tip:</strong> Click any of the rectangular systems nodes directly inside the blueprint map above. The right sidebar will immediately load its specifications sheet, host routes, configuration files paths, and core engineering workflows.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setSelectedNode("client")}
                  className={`px-2.5 py-1 text-[10px] rounded border font-mono font-bold uppercase transition-all whitespace-nowrap ${
                    selectedNode === "client" ? "bg-indigo-600 text-white border-indigo-650" : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  client_spa
                </button>
                <button
                  onClick={() => setSelectedNode("fastapi")}
                  className={`px-2.5 py-1 text-[10px] rounded border font-mono font-bold uppercase transition-all whitespace-nowrap ${
                    selectedNode === "fastapi" ? "bg-indigo-600 text-white border-indigo-650" : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  fastapi_app
                </button>
                <button
                  onClick={() => setSelectedNode("postgres")}
                  className={`px-2.5 py-1 text-[10px] rounded border font-mono font-bold uppercase transition-all whitespace-nowrap ${
                    selectedNode === "postgres" ? "bg-indigo-600 text-white border-indigo-650" : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  postgres_db
                </button>
                <button
                  onClick={() => setSelectedNode("redis")}
                  className={`px-2.5 py-1 text-[10px] rounded border font-mono font-bold uppercase transition-all whitespace-nowrap ${
                    selectedNode === "redis" ? "bg-indigo-600 text-white border-indigo-650" : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  redis_cache
                </button>
              </div>
            </div>
          </div>

          {/* Quick Connection Flow Router map explaining how events propagate */}
          <div className="p-5 bg-indigo-950/90 text-indigo-100 rounded-xl space-y-4 shadow-sm border border-indigo-900">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono text-indigo-300">
              <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin-slow" />
              <span>Network Event Sequences & Real-time message flows</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-xs">
              <div className="p-3 bg-slate-900/40 rounded-lg space-y-1 border border-indigo-900/60 font-sans">
                <span className="text-emerald-400 font-bold block">1. Reading Queries (Cache-Aside)</span>
                <p className="text-[11px] text-slate-350 leading-relaxed leading-normal">
                  User requests profile. FastAPI polls Redis. Catch hit resolves in sub-millisecond. On cache miss, requests fall back to SQLAlchemy PostgreSQL, updates Redis, and returns the entity.
                </p>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-lg space-y-1 border border-indigo-900/60 font-sans">
                <span className="text-cyan-400 font-bold block">2. Decoupled Queues (AMQP)</span>
                <p className="text-[11px] text-slate-350 leading-relaxed leading-normal">
                  User dispatches heavy PDF generation task. FastAPI publishes request on RabbitMQ (5672) and immediately yields HTTP 202 Success. Celery workers lock, consume, run, and write final file.
                </p>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-lg space-y-1 border border-indigo-900/60 font-sans">
                <span className="text-purple-400 font-bold block">3. Full-Duplex Feeds (WS Streams)</span>
                <p className="text-[11px] text-slate-350 leading-relaxed leading-normal">
                  Active connection establishes standard HTTP handshake, rapidly upgrading to WS (WebSockets) full TCP framing. Messages multiplex over routing backplanes directly inside in-memory buffers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COMPONENT (GRID 5 COLS) - MULTI-TAB DETAILED SPECS SHEET & DOCUMENTATION */}
        <section className="col-span-1 xl:col-span-5 flex flex-col gap-6 h-auto xl:h-[calc(100vh-12.5rem)] xl:overflow-y-auto pr-1">
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm flex-1">
            
            {/* Documentation Tab Selectors */}
            <div className="px-2 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("specs")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === "specs" ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📋 Dynamic Specs
              </button>
              <button
                onClick={() => setActiveTab("pillars")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === "pillars" ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏛️ Core Pillars
              </button>
              <button
                onClick={() => setActiveTab("flows")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === "flows" ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🗺️ Port Matrix
              </button>
              <button
                onClick={() => setActiveTab("quickstart")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === "quickstart" ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🚀 Quick Start
              </button>
            </div>

            {/* TAB CONTENT PANEL AREA */}
            <div className="p-5 flex-1 overflow-y-auto bg-white">
              
              {/* TAB 1: DYNAMIC NODE SPECIFICATION */}
              {activeTab === "specs" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="p-2 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                      {renderNodeIcon(currentNode.iconName)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">SELECTED NODE REFERENCE</h4>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5">{currentNode.name}</h3>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-450 font-sans">Identifier Token:</span>
                      <span className="font-mono text-indigo-650 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{currentNode.tag}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-450 font-sans">Operational Role:</span>
                      <span className="text-slate-850 font-bold font-sans text-right">{currentNode.role}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-450 font-sans">Port Bound:</span>
                      <span className="font-mono text-slate-700 font-bold">{currentNode.port}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-450 font-sans">Transport Protocol:</span>
                      <span className="font-mono text-slate-600">{currentNode.protocol}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-450 font-sans">Primary Source File:</span>
                      <span className="font-mono text-indigo-550 font-bold tracking-tight bg-slate-50 px-2 py-0.5 rounded text-[10px] break-all max-w-[65%] text-right select-all">{currentNode.fileReference}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-mono tracking-widest uppercase font-bold text-slate-400">Architectural Description</h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed font-sans leading-relaxed">
                      {currentNode.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-mono tracking-widest uppercase font-bold text-slate-400">Core Engineering Features</h4>
                    <ul className="space-y-2">
                      {currentNode.sublist.map((feature, idx) => (
                        <li key={idx} className="flex gap-2 text-[11px] text-slate-600 font-sans">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-650 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: SYSTEM ENGINEERING PILLARS */}
              {activeTab === "pillars" && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xs font-mono tracking-widest uppercase font-bold text-slate-400">CORE SYSTEM ARCHITECTURE PILLARS</h3>
                    <p className="text-[11px] text-slate-550 font-sans">The quayecodes repository is built around four modern backend principles:</p>
                  </div>

                  <div className="space-y-4">
                    {/* Pillar 1 */}
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-201 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-indigo-650 shrink-0" />
                        <h4 className="text-[11.5px] font-bold text-slate-800 font-sans">1. Asynchronous Concurrency Models</h4>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-sans">
                        Rather than utilizing blocking threads per connection, our FastAPI server and SQLAlchemy ORM core drivers execute asynchronous coroutines. Operating via uvloop socket registers, this architecture avoids state idling and scales gracefully under heavy traffic conditions.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-201 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-emerald-650 shrink-0" />
                        <h4 className="text-[11.5px] font-bold text-slate-800 font-sans">2. Cryptographic Security & JWT Boundaries</h4>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-sans">
                        Bypasses shared secret keys for asymmetric RSA structures. Authenticators encrypt claims utilizing a confidential private key file, while downstream client adapters validate claims instantly with a public key. Avoids database session polling on API routing operations completely.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-201 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                        <h4 className="text-[11.5px] font-bold text-slate-800 font-sans">3. Sub-Millisecond Cache-Aside Optimization</h4>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-sans">
                        Protects persistent database clusters by staging frequent queries on Redis RAM. Employs fine-tuned Cache-aside reading structures with precise eviction key timeouts. Programmatic invalidation sequences trigger immediately on user modifications to prevent dirty reads.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-201 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />
                        <h4 className="text-[11.5px] font-bold text-slate-800 font-sans">4. High-Throughput Broker Buffering</h4>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-sans">
                        By integrating RabbitMQ AMQP message brokers alongside Celery worker groups, intensive background workflows are completely isolated from HTTP thread blocks. The primary application stays hyper-responsive while heavy batch reports process in parallel background sandboxes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NETWORK PORT FLOW MATRIX */}
              {activeTab === "flows" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-mono tracking-widest uppercase font-bold text-slate-400">NETWORK BOUND PORT MAP</h3>
                    <p className="text-[11px] text-slate-550 font-sans">A listing of all systems connections, ports, and protocols established inside the docker overlay networks:</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-700">
                          <th className="px-3 py-2">Service Node</th>
                          <th className="px-3 py-2">Port</th>
                          <th className="px-3 py-2">Traffic Protocol</th>
                          <th className="px-3 py-2">Ingress Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                        <tr>
                          <td className="px-3 py-2 font-bold text-indigo-750">client_dashboard</td>
                          <td className="px-3 py-2">3000</td>
                          <td className="px-3 py-2">HTTP / WS</td>
                          <td className="px-3 py-2 text-emerald-650 font-bold text-[9px]">EXTERNAL PUBLIC</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-indigo-750 font-bold">fastapi_endpoint</td>
                          <td className="px-3 py-2">8000</td>
                          <td className="px-3 py-2">ASGI Python</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold text-[9px]">INTERNAL BRIDGE</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-emerald-800">postgresql_database</td>
                          <td className="px-3 py-2">5432</td>
                          <td className="px-3 py-2">TCP Wire</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold text-[9px]">INTERNAL BRIDGE</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-amber-700">redis_cache_store</td>
                          <td className="px-3 py-2">6379</td>
                          <td className="px-3 py-2">RESP Socket</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold text-[9px]">INTERNAL BRIDGE</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-blue-700">rabbitmq_broker</td>
                          <td className="px-3 py-2">5672</td>
                          <td className="px-3 py-2">AMQP Wire</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold text-[9px]">INTERNAL BRIDGE</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-blue-700">rabbitmq_console</td>
                          <td className="px-3 py-2">15672</td>
                          <td className="px-3 py-2">HTTP Web</td>
                          <td className="px-3 py-2 text-emerald-650 font-bold text-[9px]">EXTERNAL ADMIN</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold text-cyan-705">celery_workers</td>
                          <td className="px-3 py-2">N/A</td>
                          <td className="px-3 py-2">Queue Pool</td>
                          <td className="px-3 py-2 text-indigo-600 font-semibold text-[9px]">ISOLATED INNER</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-lg text-[11px] text-slate-650 font-sans leading-relaxed">
                    <strong>Container Bridge Security:</strong> Only ports 3000 (React client) and 15672 (RabbitMQ diagnostics dashboard) are mapped outward to public interfaces. All relational databases, RAM caches, and AMQP event brokers are locked within Docker compose subnet boundaries to prevent public network breaches.
                  </div>
                </div>
              )}

              {/* TAB 4: QUICK START ASSEMBLY COMMAND MANUAL */}
              {activeTab === "quickstart" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-mono tracking-widest uppercase font-bold text-slate-400">PRODUCTION BOOT MANUAL</h3>
                    <p className="text-[11px] text-slate-550 font-sans">Run the complete integrated ecosystem locally inside containers or native setups:</p>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-705 leading-normal block">Option A: The One-Click Orchestration (Docker Compose)</span>
                      <p className="text-[11px] text-slate-550 font-sans leading-relaxed">
                        The absolute easiest way to compile and run the full backend setup (FastAPI, Redis, PostgreSQL, RabbitMQ, Celery Workers) is via Docker Compose:
                      </p>
                      <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-[11px] leading-relaxed select-all">
                        <p className="text-slate-500"># Navigate into the docker directory</p>
                        <p className="text-white">cd docker/</p>
                        <p className="text-slate-500"># Fire up containers in detached background daemon mode</p>
                        <p className="text-white">docker-compose up --build -d</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-705 leading-normal block">Option B: Bare-Metal Setup (Native Commands)</span>
                      <p className="text-[11px] text-slate-550 font-sans leading-relaxed">
                        To run specific services independently, install the python prerequisites first:
                      </p>
                      <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-[11px] leading-relaxed select-all">
                        <p className="text-slate-500"># 1. Install dependencies</p>
                        <p className="text-white">pip install -r requirements.txt</p>
                        <p className="text-slate-500"># 2. Trigger migrations Kopf via Alembic</p>
                        <p className="text-white">alembic upgrade head</p>
                        <p className="text-slate-500"># 3. Boot active API server</p>
                        <p className="text-white">uvicorn app.main:app --reload --port 8000</p>
                        <p className="text-slate-500 font-mono"># 4. Trigger Celery workers daemon on high priority</p>
                        <p className="text-white">celery -A app.worker worker --loglevel=info</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
