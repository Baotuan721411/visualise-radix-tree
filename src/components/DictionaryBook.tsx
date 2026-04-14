import React, { useState, useMemo, useEffect } from 'react';
import { RadixTrie } from '../lib/radix';
import { X, ChevronLeft, ChevronRight, Edit2, Trash2, Check, X as CancelIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface DictionaryBookProps {
  trieRef: React.MutableRefObject<RadixTrie>;
  version: number;
  setVersion: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

export function DictionaryBook({ trieRef, version, setVersion, onClose }: DictionaryBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: '', definition: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allWords = useMemo(() => trieRef.current.getAllWords(), [version, trieRef]);
  
  const WORDS_PER_PAGE = 4;
  const WORDS_PER_SPREAD = isMobile ? WORDS_PER_PAGE : WORDS_PER_PAGE * 2;
  const totalPages = Math.max(1, Math.ceil(allWords.length / WORDS_PER_SPREAD));

  // Ensure current page is valid after deletions
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  const currentWords = allWords.slice(currentPage * WORDS_PER_SPREAD, (currentPage + 1) * WORDS_PER_SPREAD);
  const leftPageWords = isMobile ? currentWords : currentWords.slice(0, WORDS_PER_PAGE);
  const rightPageWords = isMobile ? [] : currentWords.slice(WORDS_PER_PAGE, WORDS_PER_SPREAD);

  const handleDelete = (word: string) => {
    trieRef.current.delete(word);
    setVersion(v => v + 1);
  };

  const startEdit = (item: {word: string, definition: string}) => {
    setEditingWord(item.word);
    setEditForm({ word: item.word, definition: item.definition });
  };

  const saveEdit = () => {
    if (!editForm.word.trim() || !editForm.definition.trim()) return;
    
    if (editForm.word.toLowerCase() !== editingWord?.toLowerCase()) {
      trieRef.current.delete(editingWord!);
    }
    trieRef.current.insert(editForm.word.trim(), editForm.definition.trim());
    
    setVersion(v => v + 1);
    setEditingWord(null);
  };

  const renderPage = (words: typeof allWords, pageNum: number) => (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden pb-12">
        {words.map(item => (
          <div key={item.word} className="group relative border-b border-gray-100 pb-4 h-[110px]">
            {editingWord === item.word ? (
              <div className="flex flex-col gap-2 h-full">
                <input 
                  value={editForm.word}
                  onChange={e => setEditForm({...editForm, word: e.target.value})}
                  className="font-bold text-lg bg-gray-50 border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea 
                  value={editForm.definition}
                  onChange={e => setEditForm({...editForm, definition: e.target.value})}
                  className="text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-1 resize-none flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="absolute right-0 top-0 flex gap-1">
                  <button onClick={() => setEditingWord(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"><CancelIcon className="w-4 h-4"/></button>
                  <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"><Check className="w-4 h-4"/></button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-900">{item.word}</h3>
                  <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => startEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(item.word)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                <p className="text-gray-600 mt-1 text-sm leading-relaxed line-clamp-3">{item.definition}</p>
              </div>
            )}
          </div>
        ))}
        {words.length === 0 && (
          <div className="text-center text-gray-400 italic mt-10">
            Trang trống
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-center text-gray-400 text-sm font-medium">
        Trang {pageNum}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[80vh] min-h-[600px] max-h-[700px] bg-white rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200"
      >
        {/* Left Page (or single page on mobile) */}
        <div className={`flex-1 p-6 md:p-10 flex flex-col relative ${!isMobile ? 'border-r border-gray-200 bg-gray-50/50' : 'bg-white'}`}>
          {renderPage(leftPageWords, isMobile ? currentPage + 1 : currentPage * 2 + 1)}
          
          {currentPage > 0 && (
            <button 
              onClick={() => setCurrentPage(p => p - 1)}
              className="absolute bottom-6 md:bottom-8 left-6 md:left-8 flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-all bg-white shadow-sm border border-gray-200 px-4 py-2 rounded-full hover:shadow hover:-translate-x-1"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
          )}
          
          {/* Next button for mobile */}
          {isMobile && currentPage < totalPages - 1 && (
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              className="absolute bottom-6 right-6 flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-all bg-white shadow-sm border border-gray-200 px-4 py-2 rounded-full hover:shadow hover:translate-x-1"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Right Page (desktop only) */}
        {!isMobile && (
          <div className="flex-1 p-10 flex flex-col relative bg-white">
            {renderPage(rightPageWords, currentPage * 2 + 2)}
            
            {currentPage < totalPages - 1 && (
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                className="absolute bottom-8 right-8 flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-all bg-white shadow-sm border border-gray-200 px-4 py-2 rounded-full hover:shadow hover:translate-x-1"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
