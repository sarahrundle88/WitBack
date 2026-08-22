/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { Copy, RefreshCw, Check, ShieldAlert, Sparkles, ArrowLeft, ArrowRight, MoveHorizontal } from "lucide-react";

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface RetortCardProps {
  reply: string;
  count: number;
  isLoading: boolean;
  onSwipeAway: (direction: 'left' | 'right') => void;
  onCopy: () => void;
  copied: boolean;
  onBackToEdit: () => void;
  onNext: () => void;
}

function RetortCard({
  reply,
  count,
  isLoading,
  onSwipeAway,
  onCopy,
  copied,
  onBackToEdit,
  onNext,
}: RetortCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0.3, 0.9, 1, 0.9, 0.3]);
  const swipeHintOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);

  return (
    <motion.div
      key={`retort-card-${count}`}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        const threshold = 80;
        const velocityThreshold = 350;
        if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
          onSwipeAway('right');
        } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
          onSwipeAway('left');
        }
      }}
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: x.get() >= 0 ? 300 : -300,
        rotate: x.get() >= 0 ? 20 : -20,
        transition: { duration: 0.25 }
      }}
      className="absolute inset-0 z-20 flex flex-col justify-between bg-black text-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none border border-neutral-800"
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
        <Sparkles size={160} />
      </div>

      {/* Top action row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] uppercase font-bold tracking-widest text-neutral-300">
            Retort #{count}
          </span>
          <span className="hidden sm:inline-flex text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
            Swipeable
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBackToEdit();
          }}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Edit snippet</span>
        </button>
      </div>

      {/* Center Retort Content */}
      <div className="relative z-10 my-auto py-3">
        <p className="text-2xl sm:text-3xl md:text-3xl font-light leading-snug sm:leading-tight italic text-neutral-100 tracking-tight">
          "{reply}"
        </p>

        {/* Dynamic Drag Hint on Swiping */}
        <motion.div
          style={{ opacity: swipeHintOpacity }}
          className="mt-3 flex items-center gap-1.5 text-xs font-mono text-amber-300/80"
        >
          <MoveHorizontal size={14} />
          <span>Release to deal next retort</span>
        </motion.div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-medium text-white transition-all shadow-sm"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 font-sans hidden xs:inline">
            Swipe away
          </span>
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <>
                <span>Next</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [retortCount, setRetortCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showCard, setShowCard] = useState(false);

  const fetchRetort = async (textSnippet: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a fresh, witty, dry, and sharp one-liner reply to this petty or misogynistic email snippet. Do not repeat previous replies. Input snippet: "${textSnippet}"`,
        config: {
          systemInstruction: "You are a witty, dry, and sharp assistant. Your task is to generate short, snappy, and slightly devastating one-liner replies to misogynistic or petty emails from men. The tone should be professional yet dismissive, deadpan, or dryly humorous. Keep it strictly under 15 words. Avoid crude profanity, but be cutting and confident. Output only the one-liner quote.",
          temperature: 0.9,
          topP: 0.95,
        },
      });

      const text = response.text;
      if (text) {
        setReply(text.replace(/^["']|["']$/g, '').trim());
        setRetortCount((prev) => prev + 1);
        setShowCard(true);
      } else {
        setError('The void returned nothing. Try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Gemini is currently unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialGenerate = () => {
    if (!input.trim()) return;
    fetchRetort(input);
  };

  const handleNextRetort = () => {
    if (!input.trim() || isLoading) return;
    fetchRetort(input);
  };

  const handleSwipeAway = (_direction: 'left' | 'right') => {
    handleNextRetort();
  };

  const copyToClipboard = () => {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#1A1A1A] font-sans selection:bg-black selection:text-white flex flex-col justify-between">
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex-1 flex flex-col justify-center">
        
        {/* Header - Compact for mobile screens */}
        <header className="mb-6 sm:mb-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-3"
          >
            <ShieldAlert size={12} />
            Boundary Defense
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl font-light tracking-tighter mb-1.5"
          >
            WitBack<span className="text-neutral-400">.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-500 text-sm sm:text-base font-light max-w-md mx-auto"
          >
            Dry, short, and snappy retorts for petty emails.
          </motion.p>
        </header>

        {/* Interactive Staged Box Area */}
        <div className="relative w-full min-h-[300px] sm:min-h-[320px] rounded-[28px] sm:rounded-[32px]">
          
          {/* Base Input Layer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full h-full min-h-[300px] sm:min-h-[320px] bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-neutral-200/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label 
                  htmlFor="audacity-input"
                  className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400"
                >
                  Paste the audacity here
                </label>
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors uppercase tracking-wider"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                id="audacity-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    handleInitialGenerate();
                  }
                }}
                placeholder="e.g. 'Per my previous email, as I already explained...'"
                className="w-full h-36 sm:h-40 bg-transparent border-none focus:ring-0 text-base sm:text-lg font-light placeholder:text-neutral-300 resize-none p-0 focus:outline-none text-neutral-800 leading-relaxed"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
              <div className="text-[11px] text-neutral-400 font-mono">
                {input.length > 0 ? `${input.length} chars` : 'Cmd+Enter to send'}
              </div>
              <button
                type="button"
                onClick={handleInitialGenerate}
                disabled={isLoading || !input.trim()}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all
                  ${isLoading || !input.trim() 
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                    : 'bg-black text-white hover:scale-102 active:scale-98 shadow-md shadow-black/10'}
                `}
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Generate Wit</span>
                    <Sparkles size={14} />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Swipeable Overlay Card Layer */}
          <AnimatePresence mode="wait">
            {showCard && reply && (
              <RetortCard
                key={retortCount}
                reply={reply}
                count={retortCount}
                isLoading={isLoading}
                onSwipeAway={handleSwipeAway}
                onCopy={copyToClipboard}
                copied={copied}
                onBackToEdit={() => setShowCard(false)}
                onNext={handleNextRetort}
              />
            )}
          </AnimatePresence>

          {/* Inline Loading Overlay when card is dealt */}
          {isLoading && showCard && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-[28px] sm:rounded-[32px]">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-white text-xs font-medium">
                <RefreshCw size={14} className="animate-spin text-amber-400" />
                <span>Dealing next retort...</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-medium text-center border border-red-100"
          >
            {error}
          </motion.div>
        )}

        {/* Quick Quick-Start Examples for Testing */}
        {!showCard && !input && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-center"
          >
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-2 font-mono">
              Or try a classic:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                "You'd understand if you smiled more",
                "I'll explain this so even you can follow",
                "Are you sure you have the bandwidth for this?",
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setInput(sample);
                  }}
                  className="text-xs text-neutral-600 bg-white hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full transition-all text-left truncate max-w-full"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* Footer */}
      <footer className="w-full text-center pb-6 pt-2">
        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em]">
          Built for peace of mind &bull; Powered by Gemini
        </p>
      </footer>
    </div>
  );
}

