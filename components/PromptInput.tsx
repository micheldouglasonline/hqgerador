import React from 'react';

interface PromptInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder: string;
  buttonText: string;
  title: string;
  onSuggest?: () => void;
  isSuggesting?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onValueChange, onSubmit, isLoading, placeholder, buttonText, title, onSuggest, isSuggesting }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="bg-blue-500 border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-bangers text-white mb-4" style={{ textShadow: '2px 2px 0 #000' }}>{title}</h2>
      <textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading || isSuggesting}
        className="w-full h-28 p-3 border-4 border-black text-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 transition duration-200 disabled:opacity-50"
      />
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button
          onClick={onSubmit}
          disabled={isLoading || isSuggesting}
          className="w-full bg-yellow-400 text-black font-bangers text-3xl py-3 border-4 border-black hover:bg-yellow-500 active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-150 disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {buttonText}
        </button>
        {onSuggest && (
           <button
            onClick={onSuggest}
            disabled={isLoading || isSuggesting}
            className="w-full sm:w-auto bg-green-500 text-white font-bangers text-2xl py-3 px-6 border-4 border-black hover:bg-green-600 active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-150 disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
            title="Peça uma ideia para a IA!"
          >
            {isSuggesting ? 'Sugerindo...' : 'Sugerir Continuação'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PromptInput;