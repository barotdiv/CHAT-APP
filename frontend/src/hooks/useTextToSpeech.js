import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for Web Speech Synthesis API (Text-To-Speech)
 */
export function useTextToSpeech() {
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanMarkdownForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.') // Strip multi-line code blocks
      .replace(/`([^`]+)`/g, '$1')                         // Strip inline code backticks
      .replace(/https?:\/\/[^\s]+/g, '')                    // Strip URLs
      .replace(/[*_~#>-]/g, '')                             // Strip markdown syntax symbols
      .replace(/\n+/g, ' ')                                 // Replace newlines with space
      .trim();
  };

  const speak = useCallback((messageId, text) => {
    if (!isSupported || !text) return;

    // If currently speaking this message, toggle stop
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Cancel any active speech before starting new one
    window.speechSynthesis.cancel();

    const speechText = cleanMarkdownForSpeech(text);
    if (!speechText) return;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  }, [isSupported, speakingMessageId]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  }, [isSupported]);

  return {
    speakingMessageId,
    isSupported,
    speak,
    stop
  };
}
