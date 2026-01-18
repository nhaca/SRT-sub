
import React, { useState } from 'react';
import { AppTab, TargetLanguage, ProcessingStatus } from './types';
import { geminiService } from './services/geminiService';
import { fileToBase64, downloadFile } from './utils/fileUtils';

// --- Sub-components (extracted to improve readability) ---

const LoadingOverlay: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  if (!status.loading) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold text-slate-800">{status.message}</p>
        <p className="text-sm text-slate-500 mt-2 italic">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>
  );
};

const Header: React.FC = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
          Gemini SRT Pro
        </h1>
      </div>
      <div className="hidden md:block text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
        Powered by Gemini 3 Flash
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.EXTRACT);
  const [status, setStatus] = useState<ProcessingStatus>({ loading: false, message: '', error: null });
  const [extractedSrt, setExtractedSrt] = useState<string>('');
  const [translatedSrt, setTranslatedSrt] = useState<string>('');
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.ENGLISH);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
  };

  const processExtraction = async () => {
    if (!uploadFile) return;

    setStatus({ loading: true, message: 'Đang trích xuất phụ đề...', error: null });
    try {
      const base64 = await fileToBase64(uploadFile);
      const srt = await geminiService.extractSrtFromVideo(base64, uploadFile.type);
      setExtractedSrt(srt);
      setStatus({ loading: false, message: '', error: null });
    } catch (err: any) {
      setStatus({ loading: false, message: '', error: err.message });
    }
  };

  const processTranslation = async () => {
    if (!extractedSrt) return;

    setStatus({ loading: true, message: `Đang dịch sang ${targetLang}...`, error: null });
    try {
      const translated = await geminiService.translateSrt(extractedSrt, targetLang);
      setTranslatedSrt(translated);
      setStatus({ loading: false, message: '', error: null });
    } catch (err: any) {
      setStatus({ loading: false, message: '', error: err.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <LoadingOverlay status={status} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl mb-8 w-fit shadow-inner">
          <button
            onClick={() => setActiveTab(AppTab.EXTRACT)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === AppTab.EXTRACT
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trích xuất SRT
          </button>
          <button
            onClick={() => setActiveTab(AppTab.TRANSLATE)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === AppTab.TRANSLATE
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dịch phụ đề
          </button>
        </div>

        {/* Tab Content: EXTRACT */}
        {activeTab === AppTab.EXTRACT && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left: Upload Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">1</span>
                Tải lên Video
              </h2>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                  ${uploadFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'}
                `}
                onClick={() => document.getElementById('videoInput')?.click()}
              >
                <input
                  id="videoInput"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 mb-3 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {uploadFile ? (
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{uploadFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-800">Chọn video hoặc kéo thả vào đây</p>
                      <p className="text-xs text-slate-500 mt-1">Hỗ trợ MP4, MKV, MOV...</p>
                    </>
                  )}
                </div>
              </div>

              <button
                disabled={!uploadFile || status.loading}
                onClick={processExtraction}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Bắt đầu Trích xuất
              </button>
            </div>

            {/* Right: Preview / Export Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Kết quả SRT
                </h2>
                {extractedSrt && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadFile(extractedSrt, 'subtitle.srt', 'text/plain')}
                      className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                    >
                      Tải .SRT
                    </button>
                    <button 
                      onClick={() => downloadFile(extractedSrt, 'subtitle.txt', 'text/plain')}
                      className="text-xs font-bold text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      Tải .TXT
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {extractedSrt ? (
                  <textarea
                    value={extractedSrt}
                    onChange={(e) => setExtractedSrt(e.target.value)}
                    className="w-full h-full min-h-[300px] p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                ) : (
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic">
                    <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Phụ đề trích xuất sẽ hiện ở đây
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: TRANSLATE */}
        {activeTab === AppTab.TRANSLATE && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Left: Input SRT */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">1</span>
                  Phụ đề gốc
                </h2>
                <textarea
                  placeholder="Dán nội dung SRT tại đây hoặc trích xuất từ tab bên cạnh..."
                  value={extractedSrt}
                  onChange={(e) => setExtractedSrt(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 text-slate-700 font-mono text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
             </div>

             {/* Right: Translation Controls & Result */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">2</span>
                    Bản dịch
                  </h2>
                  <div className="flex gap-2">
                    {translatedSrt && (
                      <button 
                        onClick={() => downloadFile(translatedSrt, `translated_${targetLang}.srt`, 'text/plain')}
                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                      >
                        Tải về
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Dịch sang</label>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value as TargetLanguage)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={TargetLanguage.ENGLISH}>Tiếng Anh</option>
                      <option value={TargetLanguage.CHINESE}>Tiếng Trung</option>
                      <option value={TargetLanguage.VIETNAMESE}>Tiếng Việt</option>
                    </select>
                  </div>
                  <button
                    disabled={!extractedSrt || status.loading}
                    onClick={processTranslation}
                    className="mt-6 flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-violet-200 transition-all"
                  >
                    Dịch ngay
                  </button>
                </div>

                <div className="flex-1 relative">
                  {translatedSrt ? (
                    <textarea
                      readOnly
                      value={translatedSrt}
                      className="w-full h-full min-h-[250px] p-4 bg-slate-900 text-indigo-300 font-mono text-sm rounded-xl outline-none resize-none"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic">
                       Chưa có bản dịch
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{status.error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2024 Gemini SRT Pro. Ứng dụng AI hỗ trợ xử lý phụ đề thông minh.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
