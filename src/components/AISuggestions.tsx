'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Loader2, Sparkles, Check } from 'lucide-react';
import type { IMessage } from '@/lib/db/imessage';

interface AISuggestionsProps {
  contactPhone: string;
  contactName: string | null;
  messages: IMessage[];
}

export function AISuggestions({ contactPhone, contactName, messages }: AISuggestionsProps) {
  const [additionalContext, setAdditionalContext] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateMutation = trpc.ai.generateSuggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
    },
  });

  const handleGenerate = () => {
    const recentMessages = messages.slice(-10).map((m) => ({
      text: m.text || '',
      isFromMe: m.isFromMe,
      timestamp: m.timestamp,
    }));

    generateMutation.mutate({
      contactPhone,
      recentMessages,
      additionalContext: additionalContext || undefined,
    });
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      {/* Additional Context Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Additional Context (optional)
        </label>
        <Textarea
          placeholder="e.g., I'm busy this week, I'm traveling to Boston, etc."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending || messages.length === 0}
        className="w-full"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Suggestions
          </>
        )}
      </Button>

      {/* Error Display */}
      {generateMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            Failed to generate suggestions. Check your OpenAI API key.
          </p>
        </div>
      )}

      {/* Suggestions Display */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Response Suggestions for {contactName || contactPhone}
          </h3>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
            >
              <p className="text-sm text-gray-900">{suggestion}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(suggestion, index)}
                className="w-full"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!generateMutation.isPending && suggestions.length === 0 && (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Add optional context and click Generate to get AI-powered response suggestions
          </p>
        </div>
      )}
    </div>
  );
}
