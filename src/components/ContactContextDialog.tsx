'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

interface ContactContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactPhone: string;
  contactName: string | null;
}

export function ContactContextDialog({
  open,
  onOpenChange,
  contactPhone,
  contactName,
}: ContactContextDialogProps) {
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [formalityLevel, setFormalityLevel] = useState<'casual' | 'neutral' | 'formal'>('neutral');
  const [backgroundContext, setBackgroundContext] = useState('');

  const utils = trpc.useUtils();
  const { data: contactData } = trpc.contacts.getWithContext.useQuery(
    { phoneNumber: contactPhone },
    { enabled: open }
  );

  const analyzeMutation = trpc.ai.analyzeStyle.useMutation({
    onSuccess: (data) => {
      setFormalityLevel(data.formalityLevel as 'casual' | 'neutral' | 'formal');
    },
  });

  const updateMutation = trpc.contacts.updateContext.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate();
      utils.contacts.getWithContext.invalidate({ phoneNumber: contactPhone });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (contactData?.context) {
      setName(contactData.context.name || '');
      setRelationshipType(contactData.context.relationshipType || '');
      setFormalityLevel(contactData.context.formalityLevel || 'neutral');
      setBackgroundContext(contactData.context.backgroundContext || '');
    } else if (contactName) {
      setName(contactName);
    }
  }, [contactData, contactName]);

  const handleSave = () => {
    updateMutation.mutate({
      phoneNumber: contactPhone,
      name: name || undefined,
      relationshipType: relationshipType || undefined,
      formalityLevel,
      backgroundContext: backgroundContext || undefined,
    });
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate({ contactPhone });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Context</DialogTitle>
          <DialogDescription>
            Add context about {contactName || contactPhone} to help generate better responses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
            />
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship Type</Label>
            <Input
              id="relationship"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g., Friend, Colleague, Family, Manager"
            />
          </div>

          {/* Formality Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Formality Level</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-2" />
                    Auto-Analyze
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={formalityLevel === 'casual' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFormalityLevel('casual')}
              >
                Casual
              </Badge>
              <Badge
                variant={formalityLevel === 'neutral' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFormalityLevel('neutral')}
              >
                Neutral
              </Badge>
              <Badge
                variant={formalityLevel === 'formal' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFormalityLevel('formal')}
              >
                Formal
              </Badge>
            </div>
            {analyzeMutation.data && (
              <p className="text-xs text-gray-600">
                Analysis: {analyzeMutation.data.analysis} (Avg message length:{' '}
                {analyzeMutation.data.avgMessageLength} chars, Emoji freq:{' '}
                {analyzeMutation.data.emojiFrequency})
              </p>
            )}
          </div>

          {/* Background Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Background & Context</Label>
            <Textarea
              id="context"
              value={backgroundContext}
              onChange={(e) => setBackgroundContext(e.target.value)}
              placeholder="Add context about this person: shared history, interests, current projects, how you know them, etc."
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              This information will be used to generate more personalized and contextually
              appropriate responses.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Context'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
