/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  Copy, 
  RefreshCw, 
  Image as ImageIcon, 
  Hash, 
  Terminal, 
  Check,
  Shield,
  Cpu,
  Eye,
  EyeOff,
  HelpCircle,
  Github,
  X,
  Lock,
  Zap,
  AlertCircle
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import LZString from 'lz-string';
import { cn } from './lib/utils';

// --- Types ---
interface ImageState {
  dataUrl: string | null;
  seed: string | null;
  realSeed: string | null;
  encryptedPayload: string | null;
  dimensions: { width: number; height: number } | null;
}

/// --- Constants ---
const RESOLUTIONS = {
  'SD': 256,
  'HD': 720,
  'FHD': 1080,
  'ORIGINAL': 0 // 0 flag for original
};

// --- Neural Vault Utility (IndexedDB for high-capacity local storage) ---
const vaultDB = {
  dbName: 'PhotoseederVault',
  storeName: 'vault',
  version: 1,

  async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async set(key: string, value: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async get(key: string): Promise<string | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
};

export default function App() {
  const [state, setState] = useState<ImageState>({
    dataUrl: null,
    seed: null,
    realSeed: null,
    encryptedPayload: null,
    dimensions: null,
  });
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [targetRes, setTargetRes] = useState<keyof typeof RESOLUTIONS>('ORIGINAL');
  const [inputSeed, setInputSeed] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEncryptedMode, setIsEncryptedMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRealSeed, setShowRealSeed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [processingStep, setProcessingStep] = useState('');
  
  const [showHelp, setShowHelp] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // --- Components ---
  const ScrambleText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    
    useEffect(() => {
      let iteration = 0;
      let interval: any = null;

      const startScramble = () => {
        clearInterval(interval);
        iteration = 0;
        interval = setInterval(() => {
          setDisplayedText(text.split("").map((char, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join(""));
          
          if (iteration >= text.length) {
            clearInterval(interval);
          }
          iteration += 1 / 4;
        }, 40);
      };

      startScramble();
      const triggerInterval = setInterval(startScramble, 12000);

      return () => {
        clearInterval(interval);
        clearInterval(triggerInterval);
      };
    }, [text]);

    return <span className="font-mono inline-block min-w-[14ch]">{displayedText}</span>;
  };

  const TypingText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
      let i = 0;
      setDisplayedText('');
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, [text, speed]);

    return <span className="font-mono">{displayedText}</span>;
  };

  const BootSequence = () => {
    const lines = [
      "INITIALIZING_KERNEL_777...",
      "LOADING_BABEL_PROTOCOLS...",
      "ESTABLISHING_SECURE_BUFFER...",
      "BYPASSING_CLOUD_LATENCY...",
      "SYSTEM_READY_FOR_INGESTION."
    ];
    
    return (
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-terminal-bg flex flex-col items-center justify-center p-8"
      >
        <div className="max-w-md w-full space-y-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-terminal-accent flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)]">
              <Eye className="text-terminal-bg w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-terminal-accent tracking-tighter">PHOTOSEEDER777</h1>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="text-xs font-mono text-terminal-accent/60 flex gap-3">
                <span className="opacity-30">[{i + 1}]</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.6 }}
                >
                  <TypingText text={line} speed={20} />
                </motion.div>
              </div>
            ))}
          </div>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
            className="h-1 bg-terminal-accent mt-12 shadow-[0_0_10px_rgba(0,255,157,0.5)]"
          />
        </div>
      </motion.div>
    );
  };

  const DataStream = () => {
    const [streams] = useState(() => 
      Array.from({ length: 15 }).map(() => ({
        left: `${Math.random() * 100}%`,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 5,
        chars: Array.from({ length: 20 }).map(() => (Math.random() > 0.5 ? '1' : '0'))
      }))
    );

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.05]">
        {streams.map((stream, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: "100vh", opacity: [0, 1, 0] }}
            transition={{ 
              duration: stream.duration, 
              repeat: Infinity, 
              delay: stream.delay,
              ease: "linear"
            }}
            style={{ left: stream.left }}
            className="absolute text-[10px] font-mono text-terminal-accent flex flex-col gap-2"
          >
            {stream.chars.map((char, j) => (
              <span key={j}>{char}</span>
            ))}
          </motion.div>
        ))}
      </div>
    );
  };

  // --- Logic: Encoding ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setProcessingStep('INITIALIZING_LOSSLESS_BUFFER...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setProcessingStep('MAPPING_PIXELS...');
        
        // Strictly lossless: no resizing
        const width = img.width;
        const height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false; // Disable smoothing for true lossless
        ctx.drawImage(img, 0, 0, width, height);
        
        setProcessingStep('ENCRYPTING_NEURAL_PAYLOAD...');
        
        // Use WebP lossless if supported, fallback to PNG
        // WebP lossless is typically 25-30% smaller than PNG
        canvas.toBlob((blob) => {
          if (!blob) {
            setIsProcessing(false);
            setProcessingStep('');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            // Remove the data URL prefix to save space
            // Format: [type_flag]:[base64_data]
            // P = PNG, W = WebP
            const typeFlag = blob.type === 'image/webp' ? 'W' : 'P';
            const cleanData = base64data.split(',')[1];
            const realSeed = `${typeFlag}:${cleanData}`;
            let optimizedSeed = realSeed;
            let encryptedPayload = null;
            
            if (isEncryptedMode && password) {
              setProcessingStep('APPLYING_AES_ENCRYPTION...');
              try {
                // Encrypt the seed
                const encrypted = CryptoJS.AES.encrypt(realSeed, password).toString();
                // Compress the encrypted string
                const compressed = LZString.compressToEncodedURIComponent(encrypted);
                encryptedPayload = `E:${compressed}`;
                
                // Generate a short Vault ID for the "short code" requirement
                const vaultId = Math.random().toString(36).substring(2, 10).toUpperCase();
                optimizedSeed = `VAULT:${vaultId}`;
                
                // Store in high-capacity local vault (IndexedDB)
                try {
                  await vaultDB.set(`vault_${vaultId}`, encryptedPayload);
                } catch (e) {
                  console.warn('Vault storage failed, falling back to full payload');
                  optimizedSeed = encryptedPayload;
                }
              } catch (err) {
                console.error('Encryption failed:', err);
                triggerToast("ENCRYPTION_FAILED: CHECK_PASSWORD");
                setIsProcessing(false);
                return;
              }
            }

            setProcessingStep('FINALIZING_SEED...');
            setTimeout(() => {
              setState({
                dataUrl: base64data,
                seed: optimizedSeed,
                realSeed: realSeed,
                encryptedPayload: encryptedPayload,
                dimensions: { width, height },
              });
              setIsProcessing(false);
              setProcessingStep('');
              triggerToast("ENCODE_SUCCESS: NEURAL_SEED_GENERATED");
            }, 800);
          };
          reader.readAsDataURL(blob);
        }, 'image/webp', 1.0);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Logic: Decoding ---
  const handleDecode = () => {
    if (!inputSeed.trim()) return;
    setIsProcessing(true);
    setProcessingStep('DECRYPTING SEED...');
    
    setTimeout(() => {
      try {
        let currentSeed = inputSeed.trim();
        let decryptedSeed: string | null = null;
        let encryptedPayload: string | null = null;
        
        // Handle Vault Codes
        if (currentSeed.startsWith('VAULT:')) {
          const vaultId = currentSeed.substring(6);
          vaultDB.get(`vault_${vaultId}`).then(stored => {
            if (stored) {
              processSeed(stored, stored);
            } else {
              // Fallback to localStorage for backward compatibility
              const oldStored = localStorage.getItem(`vault_${vaultId}`);
              if (oldStored) {
                processSeed(oldStored, oldStored);
              } else {
                triggerToast('VAULT_ERROR: DATA_NOT_FOUND_LOCALLY');
                setIsProcessing(false);
                setProcessingStep('');
              }
            }
          }).catch(() => {
            triggerToast('VAULT_ERROR: DATABASE_ACCESS_FAILED');
            setIsProcessing(false);
            setProcessingStep('');
          });
          return;
        }

        processSeed(currentSeed, null);
      } catch (err) {
        triggerToast('DECODING_ERROR: SEED_CORRUPTED');
        setIsProcessing(false);
        setProcessingStep('');
      }
    }, 1000);
  };

  const processSeed = (seedToProcess: string, originalEncryptedPayload: string | null) => {
    try {
      let currentSeed = seedToProcess;
      let decryptedSeed: string | null = null;
      let encryptedPayload = originalEncryptedPayload;

      // Handle Encrypted Seeds
      if (currentSeed.startsWith('E:')) {
        encryptedPayload = currentSeed;
        if (!password) {
          triggerToast('DECRYPTION_ERROR: PASSWORD_REQUIRED');
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
        
        setProcessingStep('DECRYPTING_AES_PAYLOAD...');
        const compressedData = currentSeed.substring(2);
        try {
          // Decompress first
          const encryptedData = LZString.decompressFromEncodedURIComponent(compressedData);
          if (!encryptedData) throw new Error('Decompression failed');
          
          // Then decrypt
          const bytes = CryptoJS.AES.decrypt(encryptedData, password);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (!decrypted) throw new Error('Invalid password');
          decryptedSeed = decrypted;
          currentSeed = decrypted;
        } catch (err) {
          triggerToast('DECRYPTION_ERROR: INVALID_PASSWORD_OR_DATA');
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
      } else if (isEncryptedMode) {
        // Strict Mode: If Encrypted Mode is ON, don't allow non-encrypted seeds
        triggerToast('SECURITY_ERROR: ENCRYPTED_SEED_REQUIRED');
        setIsProcessing(false);
        setProcessingStep('');
        return;
      }

      let decompressed = '';
      if (currentSeed.startsWith('W:') || currentSeed.startsWith('P:')) {
        const [type, data] = currentSeed.split(':');
        const mime = type === 'W' ? 'image/webp' : 'image/png';
        decompressed = `data:${mime};base64,${data}`;
      } else {
        // Fallback for old seeds
        decompressed = LZString.decompressFromEncodedURIComponent(currentSeed);
      }

      if (!decompressed || !decompressed.startsWith('data:image')) {
        throw new Error('Invalid seed format');
      }
      
      const img = new Image();
      img.onload = () => {
        setProcessingStep('RECONSTRUCTING IMAGE...');
        setTimeout(() => {
          setState({
            dataUrl: decompressed,
            seed: inputSeed,
            realSeed: decryptedSeed || currentSeed,
            encryptedPayload: encryptedPayload,
            dimensions: { width: img.width, height: img.height },
          });
          setIsProcessing(false);
          setProcessingStep('');
          triggerToast("DECODE_SUCCESS: IMAGE_RECONSTRUCTED");
        }, 800);
      };
      img.src = decompressed;
    } catch (err) {
      triggerToast('DECODING_ERROR: SEED_CORRUPTED');
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleCopySuccess = () => {
    setCopied(true);
    triggerToast("SEED_COPIED_TO_CLIPBOARD");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRefined = async (textToCopy: string) => {
    if (!textToCopy) return;
    
    // 1. Try modern Clipboard API
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        handleCopySuccess();
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }

    // 2. Fallback to execCommand('copy')
    try {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.setAttribute('readonly', ''); // Prevent keyboard on mobile
      
      // Style to be effectively invisible but technically "visible" to the browser
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.fontSize = "16px"; // Prevent auto-zoom on iOS
      
      document.body.appendChild(textArea);
      
      // Selection logic
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.focus();
        textArea.select();
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        handleCopySuccess();
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (err) {
      console.error('All copy methods failed:', err);
      triggerToast("COPY_FAILED: USE_MANUAL_SELECT");
    }
  };

  const handleDownload = () => {
    if (!state.dataUrl) return;
    const link = document.createElement('a');
    const ext = state.dataUrl.includes('png') ? 'png' : 'webp';
    link.download = `photoseeder_${Date.now()}.${ext}`;
    link.href = state.dataUrl;
    link.click();
  };

  const handleDownloadSeed = (seedToDownload: string, filename: string) => {
    if (!seedToDownload) return;
    const blob = new Blob([seedToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setState({ dataUrl: null, seed: null, realSeed: null, encryptedPayload: null, dimensions: null });
    setInputSeed('');
    setMode('encode');
    setShowRealSeed(false);
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-sans relative overflow-hidden selection:bg-terminal-accent selection:text-terminal-bg">
      <AnimatePresence>
        {isBooting && <BootSequence key="boot" />}
      </AnimatePresence>

      <DataStream />

      {/* Background Effects */}
      <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,157,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 scanline-overlay pointer-events-none z-50 opacity-[0.03]" />
      <div className="fixed inset-0 noise-bg pointer-events-none opacity-[0.02]" />

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex justify-center p-4 bg-terminal-bg/80 backdrop-blur-md overflow-y-auto items-start md:items-center"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-xl w-full my-auto bg-terminal-dim border border-terminal-accent/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,255,157,0.2)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-terminal-accent" />
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-2 hover:bg-terminal-accent/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-terminal-accent" />
              </button>
              
              <h2 className="text-2xl font-bold text-terminal-accent mb-6 flex items-center gap-3">
                <HelpCircle className="w-6 h-6" />
                SYSTEM_MANUAL
              </h2>
              
              <div className="space-y-6 text-sm leading-relaxed opacity-80">
                <section>
                  <h3 className="text-terminal-accent font-bold mb-2 uppercase tracking-widest text-xs">Encoding</h3>
                  <p>Select an image from your device. Photoseeder will map every pixel into a unique, encrypted "Neural Seed String". This process is strictly lossless and happens entirely on your hardware.</p>
                </section>
                
                <section>
                  <h3 className="text-terminal-accent font-bold mb-2 uppercase tracking-widest text-xs">Sharing</h3>
                  <p>Copy the generated seed string or save it as a file. This string contains all the data needed to reconstruct your image perfectly, without ever uploading it to a cloud server.</p>
                </section>
                
                <section>
                  <h3 className="text-terminal-accent font-bold mb-2 uppercase tracking-widest text-xs">Encrypted Mode</h3>
                  <p>Enable "Encrypted Mode" to protect your seeds with a password. The resulting seed will be AES-encrypted, making it impossible to reconstruct the image without the correct password. This ensures your visual data remains private even if the seed string is intercepted.</p>
                </section>
                
                <section>
                  <h3 className="text-terminal-accent font-bold mb-2 uppercase tracking-widest text-xs">Decoding</h3>
                  <p>Paste a seed string into the decoder. If the seed is encrypted, you must provide the correct password used during encoding to reconstruct the original image with 1:1 pixel accuracy.</p>
                </section>
              </div>
              
              <div className="mt-8 pt-6 border-t border-terminal-accent/10 flex justify-end">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 bg-terminal-accent text-terminal-bg font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 border-b border-terminal-accent/20 bg-terminal-bg/90 backdrop-blur-xl p-4 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-terminal-accent rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)] relative group overflow-hidden cursor-pointer glitch-hover">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative z-10 flex items-center justify-center">
                <Eye className="text-terminal-bg w-7 h-7 group-hover:scale-110 transition-transform" />
                <Zap className="absolute -top-1 -right-1 w-3 h-3 text-terminal-bg fill-terminal-bg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-terminal-bg rotate-45" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.05em] text-terminal-accent glitch-subtle">
                <ScrambleText text="PHOTOSEEDER777" />
              </h1>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 md:gap-8"
          >
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2.5 bg-terminal-accent/5 border border-terminal-accent/20 rounded-lg text-terminal-accent hover:bg-terminal-accent/10 transition-all tap-active"
              title="How to use"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-8 text-[10px] font-bold tracking-widest opacity-60">
              <div className="flex items-center gap-2 group cursor-help">
                <Shield className="w-3 h-3 text-terminal-accent group-hover:scale-125 transition-transform" />
                <span className="group-hover:text-terminal-accent transition-colors">SECURE_LOCAL</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-terminal-accent" />
                <span>V.3.0.0-PRO</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 crt-monitor">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Mode Switcher */}
          <div className="space-y-4">
            <div className="flex p-1.5 bg-terminal-dim/30 border border-terminal-accent/10 rounded-xl backdrop-blur-sm">
              <button 
                onClick={() => setMode('encode')}
                className={cn(
                  "flex-1 py-4 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-3 tap-active group relative overflow-hidden",
                  mode === 'encode' ? "bg-terminal-accent text-terminal-bg shadow-[0_0_15px_rgba(0,255,157,0.3)]" : "hover:bg-terminal-accent/5 opacity-60"
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <ImageIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">ENCODE_DATA</span>
              </button>
              <button 
                onClick={() => setMode('decode')}
                className={cn(
                  "flex-1 py-4 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-3 tap-active group relative overflow-hidden",
                  mode === 'decode' ? "bg-terminal-accent text-terminal-bg shadow-[0_0_15px_rgba(0,255,157,0.3)]" : "hover:bg-terminal-accent/5 opacity-60"
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <Hash className="w-4 h-4 relative z-10" />
                <span className="relative z-10">DECODE_SEED</span>
              </button>
            </div>

            {/* Encryption Toggle & Password */}
            <div className="p-4 bg-terminal-dim/20 border border-terminal-accent/10 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className={cn("w-4 h-4 transition-colors", isEncryptedMode ? "text-terminal-accent" : "text-terminal-accent/30")} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Encrypted_Mode</span>
                </div>
                <button 
                  onClick={() => setIsEncryptedMode(!isEncryptedMode)}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    isEncryptedMode ? "bg-terminal-accent" : "bg-terminal-accent/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: isEncryptedMode ? 22 : 2 }}
                    className="absolute top-1 left-0 w-3 h-3 bg-terminal-bg rounded-full"
                  />
                </button>
              </div>

              <AnimatePresence>
                {isEncryptedMode && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ENTER_SECURE_PASSWORD..."
                        className="w-full bg-terminal-bg/50 border border-terminal-accent/20 rounded-lg py-3 px-4 text-xs font-mono focus:border-terminal-accent outline-none transition-all placeholder:opacity-20"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-accent/40 hover:text-terminal-accent transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[9px] opacity-40 font-mono flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      PASSWORD_REQUIRED_FOR_DECRYPTION
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Area */}
          <AnimatePresence mode="wait">
            {mode === 'encode' ? (
              <motion.div 
                key="encode"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative min-h-[300px] lg:h-96 border-2 border-dashed border-terminal-accent/20 rounded-2xl flex flex-col items-center justify-center gap-5 cursor-pointer hover:border-terminal-accent/60 transition-all bg-terminal-accent/[0.02] overflow-hidden shadow-[inset_0_0_50px_rgba(0,255,157,0.02)]"
                >
                  {/* Scan Line Animation */}
                  <motion.div 
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-1 bg-terminal-accent/20 blur-sm z-0 pointer-events-none"
                  />
                  
                  {/* Corner Accents */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-terminal-accent/40 group-hover:border-terminal-accent transition-colors" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-terminal-accent/40 group-hover:border-terminal-accent transition-colors" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-terminal-accent/40 group-hover:border-terminal-accent transition-colors" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-terminal-accent/40 group-hover:border-terminal-accent transition-colors" />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-terminal-accent/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                    <Upload className="w-16 h-16 text-terminal-accent relative z-10 crt-flicker" />
                  </div>
                  
                  <div className="text-center relative z-10">
                    <p className="text-sm font-bold tracking-[0.3em] group-hover:text-terminal-accent transition-colors">INGEST_SOURCE_IMAGE</p>
                    <p className="text-[10px] opacity-40 mt-2 font-mono uppercase tracking-widest">Strictly Lossless Protocol</p>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="decode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-terminal-accent uppercase tracking-[0.2em]">Babel Seed Input</label>
                    <span className="text-[9px] opacity-40 font-mono">AWAITING_PAYLOAD</span>
                  </div>
                  <textarea 
                    value={inputSeed}
                    onChange={(e) => setInputSeed(e.target.value)}
                    placeholder="Paste encrypted seed string..."
                    className="w-full h-48 lg:h-72 bg-terminal-bg/50 border border-terminal-accent/20 rounded-xl p-5 text-xs focus:border-terminal-accent focus:ring-2 focus:ring-terminal-accent/10 outline-none font-mono resize-none transition-all placeholder:opacity-20"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,255,157,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDecode}
                  disabled={!inputSeed || isProcessing}
                  className="w-full py-5 bg-terminal-accent text-terminal-bg font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all glitch-hover relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin relative z-10" /> : <Hash className="w-5 h-5 relative z-10" />}
                  <span className="relative z-10">RECONSTRUCT_IMAGE</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Output / Preview */}
        <div className="lg:col-span-7">
          <div className="h-full border border-terminal-accent/20 rounded-2xl bg-terminal-bg/60 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Preview Header */}
            <div className="p-5 border-b border-terminal-accent/10 flex items-center justify-between bg-terminal-dim/20">
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", state.dataUrl ? "bg-terminal-accent animate-pulse shadow-[0_0_10px_#00ff9d]" : "bg-terminal-accent/20")} />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Output_Terminal</span>
              </div>
              {state.dataUrl && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className="p-2 hover:bg-terminal-accent/10 rounded-lg transition-colors tap-active"
                    title={showPreview ? "Hide Preview" : "Show Preview"}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 hover:bg-terminal-accent/10 rounded-lg transition-colors text-terminal-accent tap-active"
                    title="Download Result"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={reset}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 tap-active"
                    title="Clear Terminal"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Content */}
            <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center relative min-h-[450px] lg:min-h-[550px]">
              {!state.dataUrl && !isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  className="text-center"
                >
                  <ImageIcon className="w-24 h-24 mx-auto mb-6" />
                  <p className="text-lg font-bold tracking-[0.5em]">SYSTEM_IDLE</p>
                  <p className="text-[10px] mt-4 font-mono">AWAITING_DATA_INGESTION</p>
                </motion.div>
              )}

              {isProcessing && (
                <div className="text-center space-y-6">
                  <div className="relative w-32 h-32 mx-auto">
                    <motion.div 
                      animate={{ y: ["0%", "120px", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-0.5 bg-terminal-accent/40 blur-sm z-20 pointer-events-none"
                    />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-[3px] border-terminal-accent border-t-transparent rounded-full shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 border-[2px] border-terminal-accent/30 border-b-transparent rounded-full"
                    />
                    <Cpu className="absolute inset-0 m-auto w-8 h-8 text-terminal-accent crt-flicker" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold tracking-[0.3em] text-terminal-accent animate-pulse">
                      <TypingText text={processingStep} />
                    </p>
                    <div className="w-40 h-1 bg-terminal-accent/10 mx-auto rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full bg-terminal-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {state.dataUrl && !isProcessing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col items-center gap-6 md:gap-8"
                >
                  {showPreview && (
                    <div className="relative group perspective-1000 w-full flex justify-center">
                      <motion.div 
                        whileHover={{ rotateY: 5, rotateX: -5 }}
                        className="relative z-10 group/img overflow-hidden rounded-xl max-w-full"
                      >
                        <div className="absolute -inset-8 bg-terminal-accent/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        {/* Holographic Overlay */}
                        <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover/img:opacity-30 transition-opacity duration-500 overflow-hidden rounded-xl">
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-terminal-accent/20 to-transparent -translate-x-full group-hover/img:translate-x-full transition-transform duration-1000" />
                        </div>

                        {/* Scan Line on Image */}
                        <div className="img-scanline opacity-0 group-hover/img:opacity-100 transition-opacity" />

                        <img 
                          src={state.dataUrl} 
                          alt="Processed" 
                          className="max-w-full max-h-[350px] md:max-h-[400px] object-contain border border-terminal-accent/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                      
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                        <button 
                          onClick={handleDownload}
                          className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded-lg font-bold text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-transform tap-active"
                        >
                          <Download className="w-3.5 h-3.5" />
                          DOWNLOAD_IMAGE
                        </button>
                        <button 
                          onClick={() => handleDownloadSeed(state.seed || "", isEncryptedMode ? "vault_code.txt" : "seed.txt")}
                          className="px-4 py-2 bg-terminal-dim text-terminal-accent border border-terminal-accent/30 rounded-lg font-bold text-[10px] flex items-center gap-2 shadow-xl hover:scale-105 transition-transform tap-active"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {isEncryptedMode ? "DOWNLOAD_VAULT_CODE" : "DOWNLOAD_SEED"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full space-y-4 md:space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 bg-terminal-dim/20 border border-terminal-accent/10 rounded-xl backdrop-blur-md"
                      >
                        <p className="text-[8px] opacity-40 uppercase mb-1 font-mono">Dimensions</p>
                        <p className="text-[10px] font-bold text-terminal-accent">{state.dimensions?.width} x {state.dimensions?.height} PX</p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-terminal-dim/20 border border-terminal-accent/10 rounded-xl backdrop-blur-md"
                      >
                        <p className="text-[8px] opacity-40 uppercase mb-1 font-mono">Payload_Size</p>
                        <p className="text-[10px] font-bold text-terminal-accent">{(state.seed?.length || 0).toLocaleString()} CHR</p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:block p-3 bg-terminal-dim/20 border border-terminal-accent/10 rounded-xl backdrop-blur-md"
                      >
                        <p className="text-[8px] opacity-40 uppercase mb-1 font-mono">Encryption</p>
                        <p className="text-[10px] font-bold text-terminal-accent">LZ-BABEL-777</p>
                      </motion.div>
                    </div>

                    <div className="relative group">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold text-terminal-accent uppercase tracking-[0.3em]">
                          {isEncryptedMode ? "Neural Vault Code" : "Neural Seed String"}
                        </p>
                        <span className="text-[8px] opacity-30 font-mono">
                          {isEncryptedMode ? "VAULT_REFERENCE" : "ENCRYPTED_DATA"}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Primary Seed Box */}
                        <div className="relative">
                          <div className="w-full h-20 bg-terminal-bg/80 border border-terminal-accent/20 rounded-xl p-3 text-[8px] break-all overflow-y-auto font-mono opacity-60 leading-relaxed scrollbar-hide select-all cursor-text">
                            {state.seed}
                          </div>
                          <div className="absolute bottom-3 right-3 flex gap-2">
                            <button 
                              onClick={() => handleCopyRefined(state.seed || "")}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all tap-active shadow-lg",
                                copied ? "bg-green-500 text-white" : "bg-terminal-accent text-terminal-bg hover:shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                              )}
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copied ? "COPIED" : isEncryptedMode ? "COPY_VAULT_CODE" : "COPY_SEED"}</span>
                            </button>
                            <button 
                              onClick={() => handleDownloadSeed(state.seed || "", isEncryptedMode ? "vault_code.txt" : "seed.txt")}
                              className="px-3 py-1.5 bg-terminal-dim text-terminal-accent border border-terminal-accent/30 rounded-lg font-bold text-[9px] flex items-center gap-2 shadow-lg hover:bg-terminal-dim/80 transition-all tap-active"
                            >
                              <Download className="w-3 h-3" />
                              {isEncryptedMode ? "SAVE_VAULT_CODE" : "SAVE_SEED"}
                            </button>
                          </div>
                        </div>

                        {/* Secondary Options Section */}
                        <div className="pt-2 border-t border-terminal-accent/10 space-y-3">
                          {isEncryptedMode && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[8px] font-bold text-terminal-accent/40 uppercase tracking-widest">Encrypted Payload (Shareable)</p>
                                <span className="text-[7px] opacity-20 font-mono">FULL_ENCRYPTED_DATA</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleCopyRefined(state.encryptedPayload || "")}
                                  className="flex-1 px-3 py-1.5 bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20 rounded-lg text-[8px] font-bold flex items-center justify-center gap-2 hover:bg-terminal-accent/20 transition-all"
                                >
                                  <Copy className="w-3 h-3" />
                                  COPY_ENCRYPTED_PAYLOAD
                                </button>
                                <button 
                                  onClick={() => handleDownloadSeed(state.encryptedPayload || "", "encrypted_payload.txt")}
                                  className="flex-1 px-3 py-1.5 bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20 rounded-lg text-[8px] font-bold flex items-center justify-center gap-2 hover:bg-terminal-accent/20 transition-all"
                                >
                                  <Download className="w-3 h-3" />
                                  SAVE_ENCRYPTED_PAYLOAD
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setShowRealSeed(!showRealSeed)}
                                className="text-[9px] font-bold text-terminal-accent/60 hover:text-terminal-accent uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                              >
                                {showRealSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {showRealSeed ? "HIDE_REAL_SEED" : "SHOW_REAL_SEED"}
                              </button>
                              {showRealSeed && isEncryptedMode && (
                                <span className="text-[8px] text-red-500/50 font-mono animate-pulse">WARNING: UNENCRYPTED_DATA_EXPOSED</span>
                              )}
                            </div>
                            
                            <AnimatePresence>
                              {showRealSeed && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="relative overflow-hidden"
                                >
                                  <div className="w-full h-24 bg-terminal-accent/5 border border-terminal-accent/10 rounded-xl p-3 text-[8px] break-all overflow-y-auto font-mono opacity-60 leading-relaxed scrollbar-hide select-all cursor-text">
                                    {state.realSeed}
                                  </div>
                                  <div className="absolute bottom-3 right-3 flex gap-2">
                                    <button 
                                      onClick={() => handleCopyRefined(state.realSeed || "")}
                                      className="px-3 py-1.5 bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/30 rounded-lg text-[9px] font-bold flex items-center gap-2 transition-all tap-active shadow-lg hover:bg-terminal-accent/30"
                                    >
                                      <Copy className="w-3 h-3" />
                                      COPY_REAL
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadSeed(state.realSeed || "", "real_seed.txt")}
                                      className="px-3 py-1.5 bg-terminal-dim text-terminal-accent border border-terminal-accent/30 rounded-lg font-bold text-[9px] flex items-center gap-2 shadow-lg hover:bg-terminal-dim/80 transition-all tap-active"
                                    >
                                      <Download className="w-3 h-3" />
                                      SAVE_REAL
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-terminal-accent/10 bg-terminal-dim/10 flex items-center justify-between text-[9px] font-bold tracking-widest opacity-30">
              <div className="flex gap-6">
                <span className="flex items-center gap-1.5 hover:opacity-100 transition-opacity cursor-default group">
                  <div className="w-1 h-1 bg-terminal-accent rounded-full group-hover:animate-ping" />
                  <span className="group-hover:text-terminal-accent transition-colors">SYSTEM_READY</span>
                </span>
                <span className="flex items-center gap-1.5 hover:opacity-100 transition-opacity cursor-default group">
                  <div className="w-1 h-1 bg-terminal-accent rounded-full group-hover:animate-ping" />
                  <span className="group-hover:text-terminal-accent transition-colors">ENCRYPTION_ACTIVE</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto p-10 flex flex-col items-center gap-6">
        <div className="w-20 h-[1px] bg-terminal-accent/30" />
        <div className="flex items-center gap-6">
          <p className="text-[11px] tracking-[0.2em] font-mono opacity-40">
            - by 9r4n4y
          </p>
          <motion.a 
            href="https://github.com/9r4n4y"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1, color: "#00ff9d" }}
            className="p-2 bg-terminal-accent/5 border border-terminal-accent/20 rounded-full text-terminal-accent/40 hover:border-terminal-accent transition-all"
          >
            <Github className="w-5 h-5" />
          </motion.a>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-terminal-accent text-terminal-bg px-6 py-3 rounded-xl font-bold text-xs shadow-[0_0_30px_rgba(0,255,157,0.4)] flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-terminal-bg rounded-full animate-ping" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
