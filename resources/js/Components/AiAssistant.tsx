import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
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
            className="mb-4 w-80 h-[400px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center font-bold">
              <span>Saizu AI</span>
              <X className="cursor-pointer" onClick={() => setIsOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-emerald-50/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 rounded-lg text-xs max-w-[80%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <Loader2 size={16} className="animate-spin text-emerald-600" />}
            </div>
            <div className="p-2 border-t flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                className="flex-1 text-xs border-none focus:ring-0" placeholder="Tanya..." />
              <button onClick={send} className="p-2 bg-emerald-600 text-white rounded-lg"><Send size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="h-14 w-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center">
        {isOpen ? <X /> : <MessageSquare />}
      </button>
    </div>
  );
}
