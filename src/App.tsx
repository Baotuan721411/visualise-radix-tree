import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RadixTrie } from './lib/radix';
import { TrieVisualizer } from './components/TrieVisualizer';
import { DictionaryBook } from './components/DictionaryBook';
import { Search, Plus, Trash2, BookOpen, Info, Zap, X, Check, Edit2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const INITIAL_WORDS = [
  { word: "apple", definition: "Quả táo, một loại trái cây hình tròn có vỏ đỏ hoặc xanh." },
  { word: "applet", definition: "Một ứng dụng nhỏ, thực hiện một vài chức năng đơn giản." },
  { word: "application", definition: "Ứng dụng hoặc một yêu cầu chính thức." },
  { word: "bat", definition: "Con dơi, một loài động vật có vú biết bay." },
  { word: "batch", definition: "Một mẻ, một lô hàng hóa." },
  { word: "cat", definition: "Con mèo, động vật ăn thịt nhỏ được thuần hóa." },
  { word: "caterpillar", definition: "Sâu bướm, ấu trùng của bướm." },
  { word: "dog", definition: "Con chó, động vật ăn thịt được thuần hóa." }
];

const SAMPLE_WORDS_15 = [
  { word: "car", definition: "ô tô" },
  { word: "cart", definition: "xe đẩy" },
  { word: "card", definition: "thẻ" },
  { word: "care", definition: "quan tâm" },
  { word: "career", definition: "sự nghiệp" },
  { word: "careful", definition: "cẩn thận" },
  { word: "sun", definition: "mặt trời" },
  { word: "sunny", definition: "có nắng" },
  { word: "sunlight", definition: "ánh sáng mặt trời" },
  { word: "sunflower", definition: "hoa hướng dương" },
  { word: "water", definition: "nước" },
  { word: "waterfall", definition: "thác nước" },
  { word: "waterfowl", definition: "chim nước" },
  { word: "watermelon", definition: "dưa hấu" },
  { word: "watermark", definition: "hình mờ" }
];

export default function App() {
  const trieRef = useRef<RadixTrie>(new RadixTrie());
  const [version, setVersion] = useState(0);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [deletingNode, setDeletingNode] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<{type: 'success' | 'error' | 'info', text: string, definition?: string} | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [animating, setAnimating] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  
  // Flashcard states
  const [flashcardData, setFlashcardData] = useState<{word: string, definition: string} | null>(null);
  const [isEditingFlashcard, setIsEditingFlashcard] = useState(false);
  const [flashcardEditDef, setFlashcardEditDef] = useState('');

  // Form states
  const [inputWord, setInputWord] = useState('');
  const [inputDef, setInputDef] = useState('');

  useEffect(() => {
    // Initialize
    INITIAL_WORDS.forEach(({ word, definition }) => {
      trieRef.current.insert(word, definition);
    });
    setVersion(v => v + 1);
  }, []);

  const allWords = useMemo(() => {
    // depend on version
    return trieRef.current.getAllWords();
  }, [version]);

  const handleAdd15Words = () => {
    SAMPLE_WORDS_15.forEach(({word, definition}) => {
      trieRef.current.insert(word, definition);
    });
    setVersion(v => v + 1);
    setResultMessage({ type: 'success', text: 'Đã thêm 15 từ mẫu thành công!' });
  };

  const handleClearAll = () => {
    trieRef.current = new RadixTrie();
    setVersion(v => v + 1);
    setResultMessage({ type: 'success', text: 'Đã xóa tất cả các từ!' });
    setHighlightPath([]);
    setSuggestions([]);
  };

  const handleAdd = async () => {
    if (!inputWord.trim() || !inputDef.trim() || animating) return;

    const word = inputWord.trim();
    const def = inputDef.trim();
    
    const { path } = trieRef.current.insert(word, def);
    setVersion(v => v + 1);
    setInputWord('');
    setInputDef('');
    setResultMessage(null);
    setSuggestions([]);
    
    setAnimating(true);
    setHighlightPath([]);
    
    for (let i = 0; i < path.length; i++) {
      setHighlightPath(path.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setAnimating(false);
    setResultMessage({ type: 'success', text: `Đã thêm từ: "${word}"` });
  };

  const handleDelete = async () => {
    if (!inputWord.trim() || animating) return;

    const word = inputWord.trim();
    setInputWord('');
    setInputDef('');
    setResultMessage(null);
    setSuggestions([]);

    const searchResult = trieRef.current.search(word);
    
    setAnimating(true);
    setHighlightPath([]);
    
    for (let i = 0; i < searchResult.path.length; i++) {
      setHighlightPath(searchResult.path.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    if (searchResult.found) {
      setDeletingNode(searchResult.node?.id || null);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { success } = trieRef.current.delete(word);
      setVersion(v => v + 1);
      setDeletingNode(null);
      setHighlightPath([]);
      
      setResultMessage({ type: 'success', text: `Đã xóa từ: "${word}"` });
    } else {
      setHighlightPath([]);
      setResultMessage({ type: 'error', text: `Không tìm thấy từ: "${word}"` });
    }
    setAnimating(false);
  };

  const handleSaveFlashcard = () => {
    if (flashcardData) {
      trieRef.current.insert(flashcardData.word, flashcardEditDef);
      setVersion(v => v + 1);
      setFlashcardData({ ...flashcardData, definition: flashcardEditDef });
      setIsEditingFlashcard(false);
      setResultMessage({ type: 'success', text: `Đã cập nhật nghĩa của "${flashcardData.word}"`, definition: flashcardEditDef });
    }
  };

  const handleSearch = async () => {
    if (!inputWord.trim() || animating) return;

    const word = inputWord.trim();
    setResultMessage(null);
    setSuggestions([]);

    const { found, definition, path } = trieRef.current.search(word);
    
    setAnimating(true);
    setHighlightPath([]);
    
    for (let i = 0; i < path.length; i++) {
      setHighlightPath(path.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    if (found) {
      setResultMessage({ type: 'success', text: `Đã tìm thấy "${word}"`, definition });
      setFlashcardData({ word, definition: definition || '' });
      setIsEditingFlashcard(false);
    } else {
      const sugs = trieRef.current.getSuggestions(word);
      setSuggestions(sugs);
      setResultMessage({ type: 'error', text: `Không tìm thấy từ: "${word}"` });
    }
    setAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Từ Điển Radix</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>
          <button 
            onClick={handleAdd15Words}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span className="hidden sm:inline">Thêm 15 từ mẫu</span>
          </button>
          <button 
            onClick={() => setIsBookOpen(true)}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="hidden sm:inline">Mở Từ Điển</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar - Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Unified Control Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-3">
              <BookOpen className="w-5 h-5 text-blue-500" /> Quản lý từ vựng
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Từ vựng</label>
                <input 
                  type="text" 
                  placeholder="Nhập từ tiếng Anh..." 
                  value={inputWord}
                  onChange={e => setInputWord(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  disabled={animating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Định nghĩa <span className="text-gray-400 font-normal">(Chỉ dùng khi Thêm)</span></label>
                <textarea 
                  placeholder="Nhập nghĩa tiếng Việt..." 
                  value={inputDef}
                  onChange={e => setInputDef(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 bg-gray-50 focus:bg-white transition-colors"
                  disabled={animating}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={handleSearch}
                  disabled={animating || !inputWord.trim()}
                  className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Search className="w-4 h-4" /> Tìm kiếm
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={animating || !inputWord.trim() || !inputDef.trim()}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={animating || !inputWord.trim()}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Center - Visualization & Results */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Result Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 min-h-[120px] flex flex-col justify-center">
            {animating ? (
              <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Đang duyệt cây Radix...
              </div>
            ) : resultMessage ? (
              <div>
                <div className={`font-semibold text-lg flex items-center gap-2 ${resultMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  <Info className="w-5 h-5" />
                  {resultMessage.text}
                </div>
                {resultMessage.definition && (
                  <div className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-900">Định nghĩa:</span> {resultMessage.definition}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-500">Có phải ý bạn là:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {suggestions.map(s => (
                        <button 
                          key={s} 
                          onClick={() => setInputWord(s)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Thực hiện một thao tác để xem kết quả tại đây.
              </div>
            )}
          </div>

          {/* Visualization */}
          <div className="flex-1 relative">
            <TrieVisualizer root={trieRef.current.root} highlightPath={highlightPath} deletingNode={deletingNode} version={version} />
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200 text-xs flex flex-col gap-2 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></div>
                <span>Từ hoàn chỉnh</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
                <span>Nút trung gian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-600"></div>
                <span>Đường dẫn đang duyệt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-300 border border-red-600"></div>
                <span>Nút đang xóa</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      <AnimatePresence>
        {isBookOpen && (
          <DictionaryBook 
            trieRef={trieRef} 
            version={version} 
            setVersion={setVersion} 
            onClose={() => setIsBookOpen(false)} 
          />
        )}
        
        {flashcardData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
            onClick={() => setFlashcardData(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-200"
            >
              <button
                onClick={() => setFlashcardData(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center capitalize">{flashcardData.word}</h2>
              
              {isEditingFlashcard ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={flashcardEditDef}
                    onChange={e => setFlashcardEditDef(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 text-gray-700"
                    placeholder="Nhập định nghĩa mới..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsEditingFlashcard(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveFlashcard}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 w-full mb-6 min-h-[8rem] flex items-center justify-center shadow-inner">
                    <p className="text-gray-700 text-lg text-center leading-relaxed">
                      {flashcardData.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFlashcardEditDef(flashcardData.definition);
                      setIsEditingFlashcard(true);
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full"
                  >
                    <Edit2 className="w-4 h-4" /> Chỉnh sửa nghĩa
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
