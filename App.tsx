import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ComicPanel from './components/ComicPanel';
import LoadingSpinner from './components/LoadingSpinner';
import { generateScriptAndImage, suggestContinuation } from './services/geminiService';
import type { ComicPanelData } from './types';

// Declaração para o TypeScript reconhecer as bibliotecas do CDN
declare const jspdf: any;
declare const html2canvas: any;

const App: React.FC = () => {
  const [panels, setPanels] = useState<ComicPanelData[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [continuationPrompt, setContinuationPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [redoingPanel, setRedoingPanel] = useState<ComicPanelData | null>(null);
  const [redoPrompt, setRedoPrompt] = useState('');

  const comicStripRef = useRef<HTMLDivElement>(null);

  const handleGeneratePanel = useCallback(async (isContinuation: boolean, panelToReplaceId?: string) => {
    const isRedo = !!panelToReplaceId;
    const currentPrompt = isRedo ? redoPrompt : (isContinuation ? continuationPrompt : prompt);

    if (!currentPrompt.trim()) {
      setError("Por favor, digite uma ideia!");
      return;
    }
    
    setLoadingMessage("Gerando arte... A IA está desenhando sua obra-prima!");
    setIsLoading(true);
    setError(null);
    
    try {
      let context = '';
      let userPromptForApi = currentPrompt;

      if (isRedo) {
        const panelIndex = panels.findIndex(p => p.id === panelToReplaceId);
        context = panels.slice(0, panelIndex).map(p => p.sceneDescription).join(' ');
      } else if (isContinuation && panels.length > 0) {
        context = panels.map(p => p.sceneDescription).join(' ');
        const lastPanelScript = panels[panels.length-1].sceneDescription;
        userPromptForApi = `${lastPanelScript}. O usuário adicionou: "${currentPrompt}"`;
      }
      
      const { sceneDescription, panelText, imageUrl } = await generateScriptAndImage(userPromptForApi, context);
      
      const newPanel: ComicPanelData = {
        id: `panel-${Date.now()}`,
        imageUrl,
        panelText,
        sceneDescription,
      };
      
      if (isRedo) {
        setPanels(prev => prev.map(p => p.id === panelToReplaceId ? { ...newPanel, id: p.id } : p));
        setRedoingPanel(null);
        setRedoPrompt('');
      } else {
        setPanels(prev => [...prev, newPanel]);
        if(isContinuation) {
          setContinuationPrompt('');
        } else {
          setPrompt('');
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, continuationPrompt, panels, redoPrompt]);

  const handlePanelTextChange = (id: string, newText: string) => {
    setPanels(panels.map(panel => panel.id === id ? { ...panel, panelText: newText } : panel));
  };
  
  const handleRestart = () => {
    if (window.confirm("Tem certeza que deseja apagar toda a sua história e começar de novo?")) {
      setPanels([]);
      setPrompt('');
      setContinuationPrompt('');
      setError(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!comicStripRef.current) return;
    setLoadingMessage("Preparando seu PDF...");
    setIsLoading(true);

    const panelNumbers = comicStripRef.current.querySelectorAll('.panel-number');
    panelNumbers.forEach(el => (el as HTMLElement).style.display = 'none');

    html2canvas(comicStripRef.current, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const margin = 50;
      const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height + (margin * 2)]
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gerador de HQs Michel Douglas Online', pdfWidth / 2, margin - 20, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', 0, margin, canvas.width, canvas.height);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Desenvolvido por Michel Douglas Dos Santos', pdfWidth / 2, canvas.height + margin + 20, { align: 'center' });
      
      pdf.save('minha-hq-epica.pdf');

    }).catch(err => {
      console.error("Erro ao gerar PDF:", err);
      setError("Não foi possível gerar o PDF. Tente novamente.");
    }).finally(() => {
        panelNumbers.forEach(el => (el as HTMLElement).style.display = 'block');
        setIsLoading(false);
    });
  };

  const handleSuggestContinuation = async () => {
    if (panels.length === 0) return;
    setIsSuggesting(true);
    setError(null);
    try {
      const context = panels.map(p => p.sceneDescription).join(' ');
      const suggestion = await suggestContinuation(context);
      setContinuationPrompt(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-200" 
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
        backgroundSize: '10px 10px'
      }}>
      {(isLoading) && <LoadingSpinner message={loadingMessage}/>}
      
      {redoingPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
          <div className="bg-white border-8 border-black p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-3xl font-bangers text-black mb-4">Refazer Quadrinho</h2>
              <textarea
                value={redoPrompt}
                onChange={(e) => setRedoPrompt(e.target.value)}
                placeholder="Descreva a nova cena ou diálogo para este quadrinho..."
                className="w-full h-32 p-3 border-4 border-black text-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
              />
              <div className="flex gap-4 mt-4">
                  <button onClick={() => handleGeneratePanel(false, redoingPanel.id)} className="w-full bg-green-500 text-white font-bangers text-2xl py-2 border-4 border-black">Gerar!</button>
                  <button onClick={() => setRedoingPanel(null)} className="w-full bg-red-500 text-white font-bangers text-2xl py-2 border-4 border-black">Cancelar</button>
              </div>
          </div>
        </div>
      )}

      <Header />
      
      <main className="container mx-auto p-4 md:p-8">
        {error && (
          <div className="bg-red-500 border-4 border-black text-white p-4 mb-8 shadow-lg">
            <p className="font-bangers text-2xl">ERRO!</p>
            <p>{error}</p>
          </div>
        )}
        
        {panels.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-4 justify-center">
            <button onClick={handleRestart} className="bg-red-600 text-white font-bangers text-2xl py-2 px-6 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-red-700 active:translate-y-1 active:shadow-none transition-all">
              Reiniciar História
            </button>
            <button onClick={handleDownloadPdf} className="bg-blue-600 text-white font-bangers text-2xl py-2 px-6 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all">
              Baixar em PDF
            </button>
          </div>
        )}

        <div ref={comicStripRef}>
          {panels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 p-4 bg-gray-300 border-4 border-dashed border-gray-500">
              {panels.map((panel, index) => (
                <ComicPanel 
                  key={panel.id} 
                  panel={panel} 
                  panelNumber={index + 1}
                  onTextChange={handlePanelTextChange} 
                  onRedoClick={() => setRedoingPanel(panel)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          {panels.length === 0 ? (
            <PromptInput
              title="Comece sua HQ!"
              value={prompt}
              onValueChange={setPrompt}
              onSubmit={() => handleGeneratePanel(false)}
              isLoading={isLoading}
              placeholder="Ex: Um detetive com sobretudo em uma cidade chuvosa de neon..."
              buttonText="Criar Primeiro Painel!"
            />
          ) : (
            <PromptInput
              title="Continue a história..."
              value={continuationPrompt}
              onValueChange={setContinuationPrompt}
              onSubmit={() => handleGeneratePanel(true)}
              isLoading={isLoading}
              placeholder="O que acontece a seguir? Ex: Ele encontra uma pista misteriosa..."
              buttonText="Adicionar Próximo Painel!"
              onSuggest={handleSuggestContinuation}
              isSuggesting={isSuggesting}
            />
          )}
        </div>
      </main>
      <footer className="text-center mt-12 p-6 bg-gray-800 text-gray-300">
        <div className="max-w-4xl mx-auto">
            <p className="font-bangers text-2xl text-white mb-2">Desenvolvido por Michel Douglas Dos Santos</p>
            <p className="mb-4">
                Aprenda a criar aplicações como esta no meu <a href="http://micheldouglasonline.netlify.app" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-bold">Curso de IA</a>!
            </p>
            <div className="flex justify-center items-center gap-6 mb-4">
                <a href="https://facebook.com/micheldouglasonline" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-bold">Facebook</a>
                <span className="text-gray-500">|</span>
                <a href="https://instagram.com/micheldouglasonline" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-bold">Instagram</a>
            </div>
            <p className="text-sm text-gray-400">
                Passe o mouse sobre um painel para ver o roteiro e refazê-lo. Clique no texto para editar.
            </p>
            <p className="text-sm text-gray-500 mt-2">
                Gerador de HQs - Powered by Google Gemini.
            </p>
        </div>
    </footer>
    </div>
  );
};

export default App;