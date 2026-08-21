import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Check, Cpu, Moon, Palette, Save, SlidersHorizontal, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { settingsService } from '@/services/settings';
import { memoryService } from '@/services/memory';
import { useTheme } from '@/hooks/useTheme';
import { useSEO } from '@/hooks/useSEO';
import { Memory, UserSettings } from '@/types';

export function SettingsPage() {
  useSEO({
    title: 'Settings',
    description: 'Customize AI model hyperparameters, persona system prompts, and memory settings.',
  });

  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.6);
  const [topP, setTopP] = useState(0.9);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [modelName, setModelName] = useState('nvidia/nemotron-3-ultra-550b-a55b');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, mems] = await Promise.all([
        settingsService.get(),
        memoryService.list(),
      ]);
      setSettings(s);
      setMemories(mems);
      setSystemPrompt(s.system_prompt_override || '');
      setTemperature(s.temperature);
      setTopP(s.top_p);
      setMemoryEnabled(s.memory_enabled);
      setModelName(s.model_name);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);
      const updated = await settingsService.update({
        system_prompt_override: systemPrompt || null,
        temperature,
        top_p: topP,
        memory_enabled: memoryEnabled,
        model_name: modelName,
        theme: theme,
      });
      setSettings(updated);
      setStatusMessage({ type: 'success', text: 'AI parameters and system preferences updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await memoryService.delete(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Could not delete memory: ${err.message}`);
    }
  };

  const handleClearAllMemories = async () => {
    if (confirm('Are you sure you want to clear all stored memories?')) {
      try {
        await memoryService.clearAll();
        setMemories([]);
      } catch (err: any) {
        alert(`Could not clear memories: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid overflow-y-auto p-4 md:p-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-8">
          <div className="flex items-center gap-3.5">
            <Link
              to="/chat"
              className="p-2.5 rounded-2xl bg-surface-100 border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                AI Workspace Settings
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Customize appearance, model hyperparameters, and long-term memory
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-2xl text-xs md:text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
                statusMessage.type === 'success'
                  ? 'bg-primary/10 border border-primary/30 text-primary shadow-glow'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          {/* Section 0: Appearance / Theme */}
          <div className="bg-surface-100 p-6 md:p-8 rounded-3xl border border-border shadow-glass backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
              <div className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Appearance & Theme</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border bg-surface-50 hover:border-border'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#07090e] border border-white/10 text-primary">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Dark Mode (Obsidian)</h4>
                  <p className="text-xs text-text-muted mt-0.5">High-contrast cyber dark interface with sky blue accents</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-border bg-surface-50 hover:border-border'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white border border-black/10 text-navy-800">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Light Mode (Clean White)</h4>
                  <p className="text-xs text-text-muted mt-0.5">Crisp, modern, high-clarity white workspace with navy accents</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: AI Model & Hyperparameters */}
          <form onSubmit={handleSaveSettings} className="space-y-6 bg-surface-100 p-6 md:p-8 rounded-3xl border border-border shadow-glass backdrop-blur-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Model Parameters & Tuning</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Active AI Model</label>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-200 border border-border text-xs font-mono text-text-primary">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span className="truncate">{modelName.replace(/^nvidia\//i, '')}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-xs font-medium text-text-secondary">Temperature</label>
                  <span className="text-xs font-bold text-primary font-mono">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary h-2 bg-surface-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
                  <span>Deterministic (0.0)</span>
                  <span>Creative (1.5)</span>
                </div>
              </div>
            </div>

            {/* Custom System Prompt Override */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">
                Custom System Persona (Prompt Override)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Leave blank to use the default analytical, direct, honest, and concise AI persona..."
                rows={4}
                className="w-full p-4 rounded-2xl bg-surface-200 border border-border text-text-primary text-xs md:text-sm focus:outline-none focus:border-primary/50 resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Memory Feature Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-200 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-semibold text-text-primary">Long-Term Memory Engine</h4>
                  <p className="text-[11px] text-text-muted">
                    Automatically extract and remember user preferences, tech stack, and workflow facts
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={saving} className="gap-2 px-6 py-2.5 font-bold shadow-glow hover:shadow-glow-lg">
                <Save className="w-4 h-4" />
                Save AI Settings
              </Button>
            </div>
          </form>

          {/* Section 2: Long-Term Memories Store */}
          <div className="bg-surface-100 p-6 md:p-8 rounded-3xl border border-border shadow-glass backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Memory Knowledge Vault</h2>
                  <p className="text-xs text-text-muted">Extracted facts and preferences stored across chats</p>
                </div>
              </div>

              {memories.length > 0 && (
                <Button variant="danger" size="sm" onClick={handleClearAllMemories}>
                  Clear All Memory
                </Button>
              )}
            </div>

            {memories.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">
                No memories recorded yet. As you chat, the assistant will automatically remember useful preferences!
              </p>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence>
                  {memories.map((mem) => (
                    <motion.div
                      key={mem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-200 border border-border text-xs text-text-primary group hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] uppercase font-mono font-semibold text-primary">
                          {mem.category}
                        </span>
                        <span className="font-medium text-text-primary">{mem.content}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
