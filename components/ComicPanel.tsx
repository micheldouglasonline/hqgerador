import React, { useState, useEffect, useRef } from 'react';
import type { ComicPanelData } from '../types';

interface ComicPanelProps {
  panel: ComicPanelData;
  onTextChange: (id: string, newText: string) => void;
  onRedoClick: (id: string) => void;
  panelNumber: number;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ panel, onTextChange, onRedoClick, panelNumber }) => {
  const [text, setText] = useState(panel.panelText);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(panel.panelText);
  }, [panel.panelText]);

  const handleBlur = () => {
    if (textRef.current) {
      const newText = textRef.current.innerText;
      if (newText !== panel.panelText) {
        onTextChange(panel.id, newText);
      }
    }
  };

  const isNarration = text.toUpperCase().startsWith('NARRAÇÃO:');
  const displayText = isNarration ? text.substring(9).trim() : text.replace(/['"]+/g, '');

  const textContainerClass = isNarration
    ? 'comic-narrator-box text-black text-sm sm:text-base p-2 w-full absolute top-0 left-0'
    : 'comic-speech-bubble text-black text-center text-sm sm:text-base font-bold p-3 absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12';


  return (
    <div className="bg-white border-8 border-black aspect-square flex justify-center items-center overflow-hidden relative group">
      <div className="panel-number absolute top-0 left-0 bg-yellow-400 text-black font-bangers text-2xl px-3 py-1 border-b-4 border-r-4 border-black z-10">
        {panelNumber}
      </div>
      <img src={panel.imageUrl} alt={panel.sceneDescription} className="w-full h-full object-cover" />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div 
          className={textContainerClass}
          ref={textRef}
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLDivElement).blur();
            }
          }}
          >
          {displayText}
        </div>
      </div>
       <div className="absolute inset-0 bg-black bg-opacity-70 p-4 text-white flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-y-auto z-20">
            <div>
                <h3 className="font-bangers text-xl text-yellow-300">Roteiro do Artista:</h3>
                <p className="text-sm">{panel.sceneDescription}</p>
            </div>
            <button 
              onClick={() => onRedoClick(panel.id)}
              className="mt-4 w-full bg-blue-500 text-white font-bangers text-xl py-2 border-2 border-black hover:bg-blue-600 transition-colors"
            >
              Refazer Quadrinho
            </button>
        </div>
    </div>
  );
};

export default ComicPanel;