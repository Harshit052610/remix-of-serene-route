import React, { useState, useCallback } from 'react';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

const VAPI_API_KEY = 'abf4424a-40cb-4c7e-bc29-52d8586e36ac';
const VAPI_ASSISTANT_ID = 'aaf864ed-3ebe-44c9-9cad-de1821cb8c10';

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const startListening = useCallback(() => {
    setShowModal(true);
    setIsListening(true);
    setTranscript('');

    // Use Web Speech API for voice recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
      setIsListening(false);
      setShowModal(false);
    }
  }, []);

  const processCommand = async (text: string) => {
    setIsProcessing(true);

    // Process commands locally
    const lowerText = text.toLowerCase();

    if (lowerText.includes('navigate') || lowerText.includes('directions')) {
      const destination = text.replace(/navigate to|directions to|go to/gi, '').trim();
      onCommand(`navigate:${destination}`);
    } else if (lowerText.includes('find') || lowerText.includes('search')) {
      const query = text.replace(/find|search for|search/gi, '').trim();
      onCommand(`search:${query}`);
    } else if (lowerText.includes('police') || lowerText.includes('hospital') || lowerText.includes('help')) {
      onCommand('sos');
    } else if (lowerText.includes('safe') || lowerText.includes('shops')) {
      onCommand('safe-shops');
    } else if (lowerText.includes('radar') || lowerText.includes('scan')) {
      onCommand('radar');
    } else if (lowerText.includes('traffic')) {
      onCommand('layer:traffic');
    } else if (lowerText.includes('satellite')) {
      onCommand('maptype:satellite');
    } else if (lowerText.includes('3d') || lowerText.includes('three d')) {
      onCommand('toggle3d');
    } else {
      onCommand(`search:${text}`);
    }

    setIsProcessing(false);
    setTimeout(() => setShowModal(false), 1500);
  };

  const stopListening = () => {
    setIsListening(false);
    setShowModal(false);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <button
        onClick={startListening}
        className="fab fab-voice absolute right-4 bottom-32 z-20"
        title="Voice Assistant"
      >
        <Mic className="w-6 h-6" />
      </button>

      {/* Voice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-panel rounded-3xl p-8 max-w-sm mx-4 text-center animate-bounce-in">
            <button
              onClick={stopListening}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-primary animate-pulse'
                  : isProcessing
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
              ) : isListening ? (
                <Mic className="w-10 h-10 text-primary-foreground" />
              ) : (
                <MicOff className="w-10 h-10 text-primary-foreground" />
              )}
            </div>

            <h3 className="font-serif text-xl font-semibold mb-2">
              {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Ready'}
            </h3>

            <p className="text-muted-foreground text-sm mb-4">
              {isListening
                ? 'Speak your command'
                : 'Try: "Navigate to nearest hospital" or "Find safe shops"'}
            </p>

            {transcript && (
              <div className="bg-secondary rounded-xl p-3 text-sm">
                <span className="text-muted-foreground">Heard: </span>
                <span className="font-medium">{transcript}</span>
              </div>
            )}

            <div className="mt-6 text-xs text-muted-foreground">
              Powered by VAPI
            </div>
          </div>
        </div>
      )}
    </>
  );
};
