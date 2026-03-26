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
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Lock,
  Unlock,
  AlertCircle,
  QrCode,
  Scan,
  FileText,
  ChevronRight,
  ChevronLeft,
  Share2
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import * as fflate from 'fflate';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cn } from './lib/utils';

// --- Types ---
interface ImageState {
  dataUrl: string | null;
  encryptedCode: string | null;
  rawCode: string | null;
  dimensions: { width: number; height: number } | null;
}

export default function App() {
  const [state, setState] = useState<ImageState>({
    dataUrl: null,
    encryptedCode: null,
    rawCode: null,
    dimensions: null,
  });
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputCode, setInputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEncryptedMode, setIsEncryptedMode] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showQrModal, setShowQrModal] = useState<{ show: boolean; data: string | null }>({ show: false, data: null });
  const [showScanner, setShowScanner] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const QR_MAX_LENGTH = 2900;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- Neural Algorithm Utilities ---
  const compress = (data: string): string => {
    const uint8 = new TextEncoder().encode(data);
    const compressed = fflate.zlibSync(uint8, { level: 9 });
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(compressed[i]);
    }
    return btoa(binary);
  };

  const decompress = (base64: string): string => {
    const binary = atob(base64);
    const uint8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);
    const decompressed = fflate.unzlibSync(uint8);
    return new TextDecoder().decode(decompressed);
  };

  // --- Logic: Encoding ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (isEncryptedMode && !password) {
      triggerToast("PASSWORD_REQUIRED: ENTER_PASSWORD_TO_ENCRYPT");
      return;
    }

    setIsProcessing(true);
    setProcessingStep('INGESTING_IMAGE...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setProcessingStep('MAPPING_PIXELS...');
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        
        setProcessingStep('GENERATING_LOSSLESS_PAYLOAD...');
        
        // Lossless PNG
        const base64data = canvas.toDataURL('image/png');
        const cleanData = base64data.split(',')[1];
        const rawCode = `N:${compress(cleanData)}`;
        let encryptedCode = null;
        
        if (isEncryptedMode && password) {
          setProcessingStep('APPLYING_AES_ENCRYPTION...');
          try {
            const encrypted = CryptoJS.AES.encrypt(rawCode, password).toString();
            encryptedCode = `E:${compress(encrypted)}`;
          } catch (err) {
            console.error('Encryption failed:', err);
            triggerToast("ENCRYPTION_FAILED: SYSTEM_ERROR");
            setIsProcessing(false);
            return;
          }
        }

        setProcessingStep('FINALIZING_VAULT_PAYLOAD...');
        setTimeout(() => {
          setState({
            dataUrl: base64data,
            encryptedCode: encryptedCode,
            rawCode: rawCode,
            dimensions: { width: img.width, height: img.height },
          });
          setIsProcessing(false);
          setProcessingStep('');
          triggerToast("ENCODE_SUCCESS: PAYLOAD_READY");
        }, 800);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Logic: Decoding ---
  const handleDecode = (codeToDecode?: string) => {
    const code = codeToDecode || inputCode.trim();
    if (!code) return;
    
    setIsProcessing(true);
    setProcessingStep('ANALYZING_PAYLOAD...');
    
    setTimeout(() => {
      try {
        let currentCode = code;
        
        // 1. Handle Encryption
        if (currentCode.startsWith('E:')) {
          if (!password) {
            triggerToast('DECRYPTION_ERROR: PASSWORD_REQUIRED');
            setIsProcessing(false);
            setProcessingStep('');
            return;
          }
          
          setProcessingStep('DECRYPTING_ALGORITHM...');
          const compressedEncrypted = currentCode.substring(2);
          try {
            const encryptedData = decompress(compressedEncrypted);
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted || !decrypted.startsWith('N:')) throw new Error('Invalid password');
            currentCode = decrypted;
          } catch (err) {
            triggerToast('DECRYPTION_ERROR: INVALID_PASSWORD');
            setIsProcessing(false);
            setProcessingStep('');
            return;
          }
        } 

        // 2. Handle Decompression
        if (currentCode.startsWith('N:')) {
          setProcessingStep('RECONSTRUCTING_PIXELS...');
          try {
            const decompressed = decompress(currentCode.substring(2));
            const dataUrl = `data:image/png;base64,${decompressed}`;
            
            const img = new Image();
            img.onload = () => {
              setState({
                dataUrl: dataUrl,
                encryptedCode: code.startsWith('E:') ? code : null,
                rawCode: currentCode,
                dimensions: { width: img.width, height: img.height },
              });
              setIsProcessing(false);
              setProcessingStep('');
              triggerToast("DECODE_SUCCESS: IMAGE_RECONSTRUCTED");
            };
            img.src = dataUrl;
          } catch (err) {
            triggerToast('DECODING_ERROR: PAYLOAD_CORRUPTED');
            setIsProcessing(false);
            setProcessingStep('');
          }
        } else {
          throw new Error('Invalid code format');
        }
      } catch (err) {
        triggerToast('DECODING_ERROR: INVALID_PAYLOAD');
        setIsProcessing(false);
        setProcessingStep('');
      }
    }, 1000);
  };

  const handleFileDecodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputCode(content);
      handleDecode(content);
    };
    reader.readAsText(file);
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render((decodedText) => {
        setInputCode(decodedText);
        scanner.clear();
        setShowScanner(false);
        handleDecode(decodedText);
      }, (error) => {
        // console.warn(error);
      });
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  const handleDownload = () => {
    if (!state.dataUrl) return;
    const link = document.createElement('a');
    link.download = `PHOTOSEEDER777_${Date.now()}.png`;
    link.href = state.dataUrl;
    link.click();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      triggerToast("COPIED_TO_CLIPBOARD");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      triggerToast("COPY_FAILED");
    }
  };

  const handleDownloadTxt = (data: string, name: string) => {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setState({ dataUrl: null, encryptedCode: null, rawCode: null, dimensions: null });
    setInputCode('');
    setPassword('');
    setShowRawCode(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff9d] font-mono selection:bg-[#00ff9d] selection:text-black">
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Header */}
      <header className="border-b border-[#00ff9d]/20 p-4 md:p-6 bg-black/80 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="w-10 h-10 bg-[#00ff9d] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(0,255,157,0.3)]">
              <Shield className="text-black w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-[#00ff9d] glitch-subtle">PHOTOSEEDER777</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto">
            <button 
              onClick={() => setMode('encode')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-sm text-xs font-bold transition-all border uppercase tracking-widest",
                mode === 'encode' ? "bg-[#00ff9d] text-black border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)]" : "text-[#00ff9d]/60 border-transparent hover:text-[#00ff9d] hover:bg-[#00ff9d]/5"
              )}
            >
              ENCODE
            </button>
            <button 
              onClick={() => setMode('decode')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-sm text-xs font-bold transition-all border uppercase tracking-widest",
                mode === 'decode' ? "bg-[#00ff9d] text-black border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)]" : "text-[#00ff9d]/60 border-transparent hover:text-[#00ff9d] hover:bg-[#00ff9d]/5"
              )}
            >
              DECODE
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-black/40 border border-[#00ff9d]/20 p-5 md:p-8 rounded-sm space-y-8 md:space-y-10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold flex items-center gap-3 tracking-widest">
                <Terminal className="w-5 h-5 text-[#00ff9d]" />
                {mode === 'encode' ? 'ENCRYPTION_ENGINE' : 'DECRYPTION_ENGINE'}
              </h2>
              {mode === 'encode' && (
                <div className="flex items-center gap-3 bg-[#00ff9d]/5 px-3 py-1.5 rounded-sm border border-[#00ff9d]/10">
                  <span className="text-[9px] font-bold tracking-widest opacity-60 hidden sm:inline">ENCRYPTED_MODE</span>
                  <button 
                    onClick={() => setIsEncryptedMode(!isEncryptedMode)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      isEncryptedMode ? "bg-[#00ff9d]" : "bg-[#00ff9d]/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-3 h-3 bg-black rounded-full transition-transform",
                      isEncryptedMode ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold tracking-widest opacity-60 flex items-center gap-2 uppercase">
                  <Lock className="w-3 h-3" />
                  SECURE_PASSWORD {isEncryptedMode && <span className="text-red-500 font-black">!</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER_PASSWORD..."
                    className="w-full bg-black/60 border border-[#00ff9d]/20 rounded-sm py-4 px-5 text-sm focus:border-[#00ff9d] outline-none transition-all placeholder:opacity-20 font-mono"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00ff9d]/40 hover:text-[#00ff9d] p-2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'encode' ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#00ff9d]/20 rounded-sm py-16 md:py-20 flex flex-col items-center justify-center gap-5 hover:border-[#00ff9d]/60 transition-all group bg-[#00ff9d]/[0.02] active:scale-[0.98]"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#00ff9d]/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                      <Upload className="w-12 h-12 text-[#00ff9d]/40 group-hover:text-[#00ff9d] transition-colors relative z-10" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-xs font-bold tracking-[0.2em]">UPLOAD_SOURCE_IMAGE</p>
                      <p className="text-[10px] opacity-40 mt-2 font-mono uppercase">PNG | JPG | WEBP</p>
                    </div>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  <div className="bg-[#00ff9d]/5 p-5 border border-[#00ff9d]/10 rounded-sm space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest">
                      <AlertCircle className="w-4 h-4 text-[#00ff9d]" />
                      SYSTEM_ADVISORY
                    </div>
                    <ul className="text-[10px] opacity-60 font-mono space-y-2 leading-relaxed">
                      <li className="flex gap-2"><span>//</span> RECONSTRUCTION IS 100% LOSSLESS.</li>
                      <li className="flex gap-2"><span>//</span> LARGE IMAGES = LONG VAULT CODES.</li>
                      <li className="flex gap-2"><span>//</span> USE .TXT EXPORT FOR MASSIVE PAYLOADS.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest opacity-60 flex items-center gap-2 uppercase">
                      <Hash className="w-3 h-3" />
                      PAYLOAD_INPUT
                    </label>
                    <textarea 
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="PASTE_PAYLOAD_HERE..."
                      className="w-full h-40 bg-black/60 border border-[#00ff9d]/20 rounded-sm p-5 text-sm focus:border-[#00ff9d] outline-none transition-all placeholder:opacity-20 font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={startScanner}
                      className="flex items-center justify-center gap-3 py-4 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-sm text-xs font-bold hover:bg-[#00ff9d]/20 transition-all active:scale-[0.97]"
                    >
                      <Scan className="w-5 h-5" />
                      SCAN_QR
                    </button>
                    <button 
                      onClick={() => decodeFileInputRef.current?.click()}
                      className="flex items-center justify-center gap-3 py-4 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-sm text-xs font-bold hover:bg-[#00ff9d]/20 transition-all active:scale-[0.97]"
                    >
                      <FileText className="w-5 h-5" />
                      UPLOAD_TXT
                    </button>
                    <input 
                      type="file" 
                      ref={decodeFileInputRef} 
                      onChange={handleFileDecodeUpload} 
                      accept=".txt" 
                      className="hidden" 
                    />
                  </div>

                  <button 
                    onClick={() => handleDecode()}
                    disabled={!inputCode || isProcessing}
                    className="w-full py-5 bg-[#00ff9d] text-black font-black rounded-sm flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] active:scale-[0.98] uppercase tracking-widest"
                  >
                    {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Unlock className="w-6 h-6" />}
                    RECONSTRUCT_IMAGE
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Output/Preview */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-black/40 border border-[#00ff9d]/20 p-5 md:p-8 rounded-sm min-h-[400px] md:min-h-[500px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold flex items-center gap-3 tracking-widest">
                <ImageIcon className="w-5 h-5 text-[#00ff9d]" />
                OUTPUT_PREVIEW
              </h2>
              {state.dataUrl && (
                <button 
                  onClick={reset}
                  className="text-[10px] font-bold text-[#00ff9d]/40 hover:text-[#00ff9d] transition-all flex items-center gap-2 uppercase tracking-widest p-2"
                >
                  <X className="w-4 h-4" />
                  RESET
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              {isProcessing ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 border-4 border-[#00ff9d]/10 border-t-[#00ff9d] rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(0,255,157,0.2)]" />
                  <p className="text-xs font-bold animate-pulse tracking-[0.3em] uppercase text-[#00ff9d]">{processingStep}</p>
                </div>
              ) : state.dataUrl ? (
                <div className="w-full space-y-8">
                  <div className="relative group max-h-[350px] md:max-h-[450px] overflow-hidden border border-[#00ff9d]/20 rounded-sm bg-black/40">
                    <img 
                      src={state.dataUrl} 
                      alt="Reconstructed" 
                      className="w-full h-auto object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-sm">
                      <button 
                        onClick={handleDownload}
                        className="p-4 bg-[#00ff9d] text-black rounded-full hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,255,157,0.4)]"
                        title="Download Image"
                      >
                        <Download className="w-8 h-8" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#00ff9d]/5 border border-[#00ff9d]/10 rounded-sm">
                      <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Resolution</p>
                      <p className="text-sm font-mono text-[#00ff9d]">{state.dimensions?.width} x {state.dimensions?.height} PX</p>
                    </div>
                    <div className="p-4 bg-[#00ff9d]/5 border border-[#00ff9d]/10 rounded-sm">
                      <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-1">Payload_Size</p>
                      <p className="text-sm font-mono text-[#00ff9d]">{((state.encryptedCode || state.rawCode)?.length || 0).toLocaleString()} CHR</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleDownload}
                    className="w-full py-4 bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-black rounded-sm flex items-center justify-center gap-3 hover:bg-[#00ff9d] hover:text-black transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                  >
                    <Download className="w-5 h-5" />
                    DOWNLOAD_IMAGE
                  </button>

                  <div className="space-y-6">
                    {/* Encrypted Output */}
                    {state.encryptedCode && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[#00ff9d] tracking-widest uppercase flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            ENCRYPTED_PAYLOAD
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => handleCopy(state.encryptedCode!)} className="p-2.5 hover:bg-[#00ff9d]/10 rounded-sm transition-colors text-[#00ff9d]/60 hover:text-[#00ff9d]" title="Copy Payload"><Copy className="w-4 h-4" /></button>
                            <button 
                              onClick={() => {
                                if (state.encryptedCode!.length > QR_MAX_LENGTH) {
                                  triggerToast("PAYLOAD_TOO_LARGE_FOR_QR: USE_TXT_EXPORT");
                                } else {
                                  setShowQrModal({ show: true, data: state.encryptedCode });
                                }
                              }} 
                              className={cn(
                                "p-2.5 rounded-sm transition-colors",
                                state.encryptedCode!.length > QR_MAX_LENGTH ? "opacity-20 cursor-not-allowed" : "hover:bg-[#00ff9d]/10 text-[#00ff9d]/60 hover:text-[#00ff9d]"
                              )}
                              title={state.encryptedCode!.length > QR_MAX_LENGTH ? "Payload too large for QR" : "Generate QR Code"}
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDownloadTxt(state.encryptedCode!, 'encrypted_payload')} className="p-2.5 hover:bg-[#00ff9d]/10 rounded-sm transition-colors text-[#00ff9d]/60 hover:text-[#00ff9d]" title="Download .txt"><Download className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="w-full h-24 bg-black/80 border border-[#00ff9d]/20 rounded-sm p-4 text-[9px] break-all overflow-y-auto font-mono opacity-60 leading-relaxed custom-scrollbar">
                          {state.encryptedCode}
                        </div>
                      </div>
                    )}

                    {/* Raw Output */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] font-bold opacity-40 tracking-widest uppercase flex items-center gap-2">
                            <Unlock className="w-3 h-3" />
                            RAW_PAYLOAD
                          </label>
                          <button 
                            onClick={() => setShowRawCode(!showRawCode)}
                            className="text-[9px] font-bold text-[#00ff9d] hover:underline uppercase tracking-widest p-1"
                          >
                            {showRawCode ? 'HIDE' : 'SHOW_RAW'}
                          </button>
                        </div>
                        {showRawCode && (
                          <div className="flex gap-2">
                            <button onClick={() => handleCopy(state.rawCode!)} className="p-2.5 hover:bg-[#00ff9d]/10 rounded-sm transition-colors text-[#00ff9d]/60 hover:text-[#00ff9d]" title="Copy Payload"><Copy className="w-4 h-4" /></button>
                            <button 
                              onClick={() => {
                                if (state.rawCode!.length > QR_MAX_LENGTH) {
                                  triggerToast("PAYLOAD_TOO_LARGE_FOR_QR: USE_TXT_EXPORT");
                                } else {
                                  setShowQrModal({ show: true, data: state.rawCode });
                                }
                              }} 
                              className={cn(
                                "p-2.5 rounded-sm transition-colors",
                                state.rawCode!.length > QR_MAX_LENGTH ? "opacity-20 cursor-not-allowed" : "hover:bg-[#00ff9d]/10 text-[#00ff9d]/60 hover:text-[#00ff9d]"
                              )}
                              title={state.rawCode!.length > QR_MAX_LENGTH ? "Payload too large for QR" : "Generate QR Code"}
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDownloadTxt(state.rawCode!, 'raw_payload')} className="p-2.5 hover:bg-[#00ff9d]/10 rounded-sm transition-colors text-[#00ff9d]/60 hover:text-[#00ff9d]" title="Download .txt"><Download className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      {showRawCode && (
                        <div className="w-full h-24 bg-black/80 border border-[#00ff9d]/20 rounded-sm p-4 text-[9px] break-all overflow-y-auto font-mono opacity-60 leading-relaxed custom-scrollbar">
                          {state.rawCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-10 space-y-6 py-20">
                  <ImageIcon className="w-24 h-24 mx-auto" />
                  <p className="text-xs font-bold tracking-[0.5em] uppercase">AWAITING_PAYLOAD</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* QR Modal */}
      <AnimatePresence>
        {showQrModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowQrModal({ show: false, data: null })}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-sm max-w-sm w-full space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-black">
                <h3 className="text-xs font-bold">PAYLOAD_QR_CODE</h3>
                <button onClick={() => setShowQrModal({ show: false, data: null })}><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-white p-4 flex items-center justify-center border border-black/10">
                {showQrModal.data && (
                  <QRCodeSVG 
                    value={showQrModal.data} 
                    size={250}
                    level="L"
                    includeMargin={true}
                  />
                )}
              </div>
              <p className="text-[9px] text-black/60 text-center leading-relaxed">
                Scan this code with PHOTOSEEDER777 on another device to reconstruct the image.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-[#00ff9d]/20">
              <h3 className="text-xs font-bold">SCANNING_PAYLOAD...</h3>
              <button onClick={stopScanner} className="p-2 hover:bg-[#00ff9d]/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div id="reader" className="w-full max-w-md border border-[#00ff9d]/20 rounded-sm overflow-hidden" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#00ff9d] text-black px-6 py-3 rounded-sm shadow-[0_0_30px_rgba(0,255,157,0.3)] flex items-center gap-3"
          >
            <Check className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-8 border-t border-[#00ff9d]/10 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 text-[11px]">
          <div className="flex items-center gap-4">
            <p className="font-bold tracking-widest">by 9r4n4y</p>
            <a 
              href="https://github.com/9r4n4y" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-sm hover:bg-[#00ff9d] hover:text-black transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GITHUB
            </a>
          </div>
          <div className="flex items-center gap-8 font-bold tracking-widest">
            <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> 100%_OFFLINE</span>
            <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> AES_256_ENCRYPTED</span>
            <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> LOSSLESS_RECONSTRUCTION</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
