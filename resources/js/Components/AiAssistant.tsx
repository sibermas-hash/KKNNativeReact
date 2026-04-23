import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Ada yang bisa saya bantu?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/ai/assistant', { message: input });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Gagal koneksi AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="mb-4 w-80 h-[400px] bg-white rounded-xl border border-emerald-50 flex flex-col overflow-hidden"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div className="p-4 bg-[#0d9488] text-white flex justify-between items-center">
              <span className="text-sm font-bold">Saizu AI</span>
              <X className="cursor-pointer h-5 w-5" onClick={() => setIsOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-lg text-xs max-w-[80%] ${m.role === 'user' ? 'bg-[#0d9488] text-white' : 'bg-white border border-emerald-50 text-emerald-950'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <Loader2 size={16} className="animate-spin text-[#0d9488]" />}
            </div>
            <div className="p-3 border-t border-emerald-50 flex gap-2 bg-white">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] outline-none text-emerald-950 placeholder:text-black" placeholder="Tanya sesuatu..." />
              <button onClick={send} className="p-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors">
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-[#0d9488] text-white flex items-center justify-center hover:bg-[#0f766e] transition-colors"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}
