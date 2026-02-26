/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  FileText, 
  Search,
  ArrowRight,
  History,
  Settings,
  HelpCircle,
  Languages,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from './translations';
import { GoogleGenAI, Modality } from "@google/genai";
import { v4 as uuidv4 } from "uuid";

interface VerificationResult {
  id: string;
  document_type: string;
  verdict: 'GENUINE' | 'FAKE' | 'SUSPICIOUS';
  confidence: number;
  reasons: string[];
  grammar_issues: string[];
  masked_sensitive_data: string[];
  extracted_text: string[];
  audioData?: string;
  timestamp?: string;
}

type AppScreen = 'splash' | 'language-select' | 'login' | 'main';

interface User {
  email: string;
  isGuest: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app-language') as Language) || 'en';
  });
  
  // Privacy & Security States
  const [saveHistory, setSaveHistory] = useState(() => {
    return localStorage.getItem('save-history') !== 'false';
  });
  const [maskData, setMaskData] = useState(() => {
    return localStorage.getItem('mask-data') !== 'false';
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<VerificationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('app-language', language);
    localStorage.setItem('save-history', String(saveHistory));
    localStorage.setItem('mask-data', String(maskData));
  }, [language, saveHistory, maskData]);

  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => setScreen('language-select'), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const response = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete history item", err);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm(t.deleteHistory + "?")) return;
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      if (response.ok) {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({ email, isGuest: false });
      setScreen('main');
      setIsLoginLoading(false);
    }, 1500);
  };

  const handleGuestLogin = () => {
    setUser({ email: 'Guest User', isGuest: true });
    setScreen('main');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('login');
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      const mimeType = file.type;

      // 2. Initialize Gemini
      // Note: process.env.GEMINI_API_KEY is injected by the platform
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const modelName = "gemini-3-flash-preview";

      // 3. Verification Prompt
      const prompt = `
        You are an AI Document Verification Assistant for Indian documents.
        
        Analyze the provided image of a document (Aadhaar / ID / Certificate).
        
        Your tasks:
        1) Perform OCR and extract all readable text from the image.
        2) Detect sensitive numbers like:
           - Aadhaar number
           - Phone number
           - ID numbers
        3) For privacy, MASK all sensitive numbers:
           - Show only first 2 digits and last 2 digits
           - Replace the middle digits with X or *
           Example:
           - 123456789012 → 12XXXXXXXX12
           - 9876543210 → 98XXXXXX10
        4) Analyze the document and classify it into: GENUINE, FAKE, SUSPICIOUS.
        5) Also check for grammar/spelling mistakes.
        
        Verification Rules:
        - If the word "SAMPLE" appears anywhere → Verdict = FAKE.
        - If it looks like an Aadhaar card but does not contain a valid 12-digit number → Verdict = FAKE.
        - If important keywords like "Government of India", "UIDAI", or "Aadhaar" are missing → Verdict = SUSPICIOUS.
        - If Aadhaar number format looks correct and required keywords are present → Verdict = GENUINE.
        - If image quality is poor or text is unclear → Verdict = SUSPICIOUS.
        
        Output format (IMPORTANT: return only JSON, no extra text):
        {
          "document_type": "Aadhaar / ID Card / Certificate / Unknown",
          "verdict": "GENUINE / FAKE / SUSPICIOUS",
          "confidence": number,
          "reasons": ["Reason 1", "Reason 2"],
          "grammar_issues": ["Issue 1", "Issue 2"],
          "masked_sensitive_data": ["12XXXXXXXX12", "98XXXXXX10"],
          "extracted_text": ["line 1 (with masked numbers only)", "line 2 (with masked numbers only)"]
        }
        
        Notes:
        - Do NOT show full Aadhaar, phone, or ID numbers anywhere.
        - Always mask sensitive numbers for privacy.
        - This is a demo/logical verification, not official government verification.
        - Do not write anything outside the JSON.
      `;

      const result = await genAI.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error("AI returned no candidates. It might have been blocked by safety filters.");
      }

      const text = result.text;
      if (!text) throw new Error("AI returned empty text");
      
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const verificationData = JSON.parse(cleanJson);

      // 4. Generate Voice Output
      const summary = `Verdict is ${verificationData.verdict}. Document type is ${verificationData.document_type}. Reasons include ${verificationData.reasons.join(', ')}.`;
      const ttsPrompt = `Say clearly in ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}: ${summary}`;
      const ttsResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      const responseData: VerificationResult = {
        ...verificationData,
        id: uuidv4(),
        audioData: audioData
      };

      setResult(responseData);
      
      if (audioData) {
        playAudio(audioData);
      }

      // 5. Save to History if requested
      if (saveHistory) {
        await fetch('/api/save-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responseData),
        });
      }

    } catch (err) {
      setError(t.error);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play();
  };

  const maskValue = (key: string, value: string) => {
    if (!maskData) return value;
    const sensitiveKeys = ['aadhaar', 'pan', 'id', 'number', 'account', 'phone', 'mobile'];
    const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k));
    
    if (isSensitive && value.length > 4) {
      return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
    return value;
  };

  if (screen === 'splash') {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-black mb-6 shadow-2xl shadow-white/10">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase">AP/TS AI Verifier</h1>
          <div className="mt-8 flex gap-1">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div 
                key={delay}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay }}
                className="w-2 h-2 bg-white rounded-full" 
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'language-select') {
    const languages: { code: Language; name: string; local: string }[] = [
      { code: 'te', name: 'Telugu', local: 'తెలుగు' },
      { code: 'en', name: 'English', local: 'English' },
      { code: 'hi', name: 'Hindi', local: 'हिन्दी' },
    ];

    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-black/5"
        >
          <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mb-8">
            <Languages className="opacity-40" size={32} />
          </div>
          <h2 className="text-3xl font-serif italic mb-2">{t.selectLanguage}</h2>
          <p className="opacity-50 mb-8">Choose your preferred language to continue</p>
          
          <div className="space-y-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`
                  w-full p-6 rounded-2xl flex items-center justify-between transition-all border-2
                  ${language === lang.code 
                    ? 'border-black bg-black text-white shadow-lg' 
                    : 'border-black/5 bg-black/5 hover:border-black/20'}
                `}
              >
                <div className="text-left">
                  <p className="font-bold text-lg">{lang.local}</p>
                  <p className={`text-xs ${language === lang.code ? 'opacity-60' : 'opacity-40'}`}>{lang.name}</p>
                </div>
                {language === lang.code && <CheckCircle2 size={24} />}
              </button>
            ))}
          </div>

          <button
            onClick={() => setScreen('login')}
            className="w-full mt-10 py-5 bg-[#141414] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          >
            <span>{t.continue}</span>
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-black/5"
        >
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-serif italic mb-2">{t.loginTitle}</h2>
          <p className="opacity-40 text-sm mb-8">{t.loginSubtitle}</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.emailLabel}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ap.gov.in"
                className="w-full p-4 bg-black/5 rounded-2xl border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.passwordLabel}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 bg-black/5 rounded-2xl border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none text-sm"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoginLoading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
            >
              {isLoginLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t.signIn} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-black/5">
            <button 
              onClick={handleGuestLogin}
              className="w-full py-4 bg-white text-black border border-black/5 rounded-2xl font-bold hover:bg-black/5 transition-all text-sm"
            >
              {t.guestMode}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#141414] rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{t.appName}</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-semibold">{t.appSubtitle}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => { setShowHistory(false); setResult(null); }}
              className={`transition-opacity ${!showHistory ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              {t.dashboard}
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className={`transition-opacity ${showHistory ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              {t.history}
            </button>
            <button 
              onClick={() => setScreen('language-select')}
              className="opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <Languages size={14} />
              {t.settings}
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPrivacy(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <Lock size={20} className="opacity-60" />
            </button>
            <div className="h-8 w-[1px] bg-black/10 mx-1" />
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Officer</p>
                  <p className="text-xs font-bold truncate max-w-[120px]">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-full text-xs font-bold transition-colors"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setScreen('login')}
                className="bg-[#141414] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-all shadow-lg shadow-black/10"
              >
                {t.login}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-serif italic mb-2">{t.historyTitle}</h2>
                  <p className="opacity-50">{t.privacyDesc}</p>
                </div>
                {historyItems.length > 0 && (
                  <button 
                    onClick={clearAllHistory}
                    className="flex items-center gap-2 text-red-600 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                    {t.deleteHistory}
                  </button>
                )}
              </div>

              {historyItems.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center border border-black/5">
                  <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="opacity-20" size={40} />
                  </div>
                  <p className="opacity-40 font-medium">{t.noHistory}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow relative group"
                    >
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.verdict === 'GENUINE' ? 'bg-emerald-50 text-emerald-600' : item.verdict === 'FAKE' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {item.verdict === 'GENUINE' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.document_type}</p>
                          <p className="text-[10px] opacity-40 uppercase font-bold">{new Date(item.timestamp!).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-sm opacity-70 mb-4 line-clamp-2">{item.reasons[0]}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-black/5">
                        <div className="flex items-center gap-2">
                          <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                            item.verdict === 'GENUINE' ? 'bg-emerald-100 text-emerald-700' : 
                            item.verdict === 'FAKE' ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>{item.verdict}</div>
                          <div className="text-xs font-bold opacity-40 uppercase tracking-widest">Conf: {item.confidence}%</div>
                          {item.audioData && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                playAudio(item.audioData!);
                              }}
                              className="p-1.5 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
                              title="Play Voice Result"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            setResult(item);
                            setShowHistory(false);
                          }}
                          className="text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          View Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Upload & Instructions */}
              <div className="lg:col-span-5 space-y-8">
                <section>
                  <h2 className="text-4xl font-serif italic mb-4">{t.verifyTitle}</h2>
                  <p className="text-lg text-[#141414]/70 leading-relaxed">
                    {t.verifySubtitle}
                  </p>
                </section>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all
                      ${preview ? 'border-emerald-500/30 bg-emerald-50/30' : 'border-black/10 hover:border-black/30 hover:bg-black/5'}
                    `}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    
                    {preview ? (
                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium">{t.changeImage}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4">
                          <Upload className="opacity-40" />
                        </div>
                        <p className="font-medium text-center">{t.uploadPlaceholder}</p>
                        <p className="text-xs opacity-40 mt-2">{t.uploadHint}</p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <History size={18} className="opacity-40" />
                        <span className="text-sm font-medium">{t.saveHistoryLabel}</span>
                      </div>
                      <button 
                        onClick={() => setSaveHistory(!saveHistory)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${saveHistory ? 'bg-black' : 'bg-black/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${saveHistory ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={!file || loading}
                      className={`
                        w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                        ${!file || loading 
                          ? 'bg-black/10 text-black/30 cursor-not-allowed' 
                          : 'bg-[#141414] text-white hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/10'}
                      `}
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t.verifying}</span>
                        </div>
                      ) : (
                        <>
                          <span>{t.verifyButton}</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-black/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Lock size={20} />
                    </div>
                    <h4 className="font-bold">{t.privacyTitle}</h4>
                  </div>
                  <p className="text-xs opacity-50 leading-relaxed">{t.privacyDesc}</p>
                </div>

                <div className="bg-[#141414] text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                  <div className="relative z-10">
                    <h4 className="text-xl font-serif italic mb-4">How AI Detects Fraud</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center shrink-0 text-[10px] font-bold">01</div>
                        <p className="text-xs opacity-60">AI analyzes font pixels to detect digital "ghosting" or "pasting" anomalies.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center shrink-0 text-[10px] font-bold">02</div>
                        <p className="text-xs opacity-60">Layout templates are compared against official government standards in real-time.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center shrink-0 text-[10px] font-bold">03</div>
                        <p className="text-xs opacity-60">QR codes are scanned and cross-verified with the visible text on the document.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {!result && !loading && !error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full min-h-[400px] border-2 border-dashed border-black/5 rounded-[40px] flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-24 h-24 bg-white rounded-full shadow-inner flex items-center justify-center mb-6">
                        <Search className="opacity-10" size={48} />
                      </div>
                      <h3 className="text-2xl font-serif italic mb-2">{t.readyTitle}</h3>
                      <p className="max-w-xs opacity-40 text-sm">
                        {t.readySubtitle}
                      </p>
                    </motion.div>
                  )}

                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full min-h-[400px] bg-white rounded-[40px] flex flex-col items-center justify-center p-12 text-center shadow-sm border border-black/5"
                    >
                      <div className="relative">
                        <div className="w-32 h-32 border-4 border-black/5 rounded-full" />
                        <div className="absolute inset-0 w-32 h-32 border-4 border-t-black border-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShieldCheck className="animate-pulse" size={40} />
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif italic mt-8 mb-2">{t.verifying}</h3>
                      <p className="opacity-40 text-sm animate-pulse">Checking for fraud indicators and layout anomalies</p>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full min-h-[400px] bg-red-50 rounded-[40px] flex flex-col items-center justify-center p-12 text-center border border-red-100"
                    >
                      <XCircle className="text-red-500 mb-6" size={64} />
                      <h3 className="text-2xl font-bold text-red-900 mb-2">Error</h3>
                      <p className="text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 overflow-hidden"
                    >
                      {/* Result Header */}
                      <div className={`p-8 flex items-center justify-between ${result.verdict === 'GENUINE' ? 'bg-emerald-50' : result.verdict === 'FAKE' ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <div className="flex items-center gap-4">
                          {result.verdict === 'GENUINE' ? (
                            <CheckCircle2 className="text-emerald-600" size={48} />
                          ) : result.verdict === 'FAKE' ? (
                            <XCircle className="text-red-600" size={48} />
                          ) : (
                            <AlertCircle className="text-amber-600" size={48} />
                          )}
                          <div>
                            <h3 className={`text-3xl font-bold ${result.verdict === 'GENUINE' ? 'text-emerald-900' : result.verdict === 'FAKE' ? 'text-red-900' : 'text-amber-900'}`}>
                              {result.verdict}
                            </h3>
                            <p className="text-sm opacity-60 font-medium uppercase tracking-widest">
                              {result.document_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-serif italic">{result.confidence}%</div>
                          <div className="text-[10px] uppercase font-bold opacity-40">{t.confidence}</div>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                        {/* Voice Output */}
                        {result.audioData && (
                          <div className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                            <div className="flex items-center gap-3">
                              <Volume2 className="text-black/40" />
                              <p className="text-sm font-medium whitespace-pre-line">
                                {result.reasons[0]}
                              </p>
                            </div>
                            <button 
                              onClick={() => playAudio(result.audioData!)}
                              className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-90"
                            >
                              <Volume2 size={20} />
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            {/* Reasons Section */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
                                <Search size={14} />
                                Verification Reasons
                              </h4>
                              <div className="space-y-3">
                                {result.reasons.map((reason, i) => (
                                  <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`flex items-start gap-3 text-sm p-4 rounded-2xl border ${
                                      result.verdict === 'GENUINE' ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100' : 
                                      result.verdict === 'FAKE' ? 'text-red-600 bg-red-50/50 border-red-100' : 
                                      'text-amber-600 bg-amber-50/50 border-amber-100'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                      result.verdict === 'GENUINE' ? 'bg-emerald-100' : 
                                      result.verdict === 'FAKE' ? 'bg-red-100' : 
                                      'bg-amber-100'
                                    }`}>
                                      {result.verdict === 'GENUINE' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    </div>
                                    <p className="opacity-80 leading-relaxed">{reason}</p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>

                            {/* Grammar Issues Section */}
                            {result.grammar_issues.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
                                  <FileText size={14} />
                                  Grammar & Spelling Issues
                                </h4>
                                <div className="space-y-2">
                                  {result.grammar_issues.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                      <Info size={14} />
                                      <span>{issue}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Masked Sensitive Data Section */}
                            {result.masked_sensitive_data.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
                                  <Lock size={14} />
                                  Masked Sensitive Data
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {result.masked_sensitive_data.map((data, i) => (
                                    <div key={i} className="px-3 py-1.5 bg-black/5 rounded-lg text-xs font-mono font-bold">
                                      {data}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Extracted Text Section */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-2">
                              <FileText size={14} />
                              Extracted Text (OCR)
                            </h4>
                            <div className="bg-black/[0.02] p-6 rounded-3xl border border-black/5 max-h-[400px] overflow-y-auto">
                              <div className="space-y-1">
                                {result.extracted_text.map((line, i) => (
                                  <p key={i} className="text-xs font-mono opacity-60 leading-relaxed">
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-3xl font-serif italic mb-4">{t.privacyTitle}</h2>
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="opacity-40" />
                  </div>
                  <p className="text-sm opacity-70">Documents are processed in memory and never written to server disk.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="opacity-40" />
                  </div>
                  <p className="text-sm opacity-70">Encryption is used for all data in transit between your device and our AI.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="opacity-40" />
                  </div>
                  <p className="text-sm opacity-70">You have full control over your verification history and can delete it anytime.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-black/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-30">
            <ShieldCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-tighter">Secured by Gemini AI</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest opacity-40">
            <button onClick={() => setShowPrivacy(true)} className="hover:opacity-100 transition-opacity">Privacy Policy</button>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Contact Support</a>
          </div>
          <p className="text-[10px] opacity-30">© 2026 AP/TS Document Verification System</p>
        </div>
      </footer>
    </div>
  );
}
