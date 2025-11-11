'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Plus, Calendar, MapPin, Loader2 } from 'lucide-react';
import { formatMessageDate } from '@/lib/utils';

interface UserContextPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserContextPanel({ open, onOpenChange }: UserContextPanelProps) {
  const [contextType, setContextType] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const utils = trpc.useUtils();
  const { data: contexts } = trpc.userContext.getAll.useQuery(undefined, { enabled: open });

  const addMutation = trpc.userContext.add.useMutation({
    onSuccess: () => {
      utils.userContext.getAll.invalidate();
      setContextType('');
      setContent('');
      setStartDate('');
      setEndDate('');
    },
  });

  const deleteMutation = trpc.userContext.delete.useMutation({
    onSuccess: () => {
      utils.userContext.getAll.invalidate();
    },
  });

  const handleAdd = () => {
    if (!contextType || !content) return;

    addMutation.mutate({
      contextType,
      content,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const getContextIcon = (type: string) => {
    if (type.toLowerCase().includes('location') || type.toLowerCase().includes('travel')) {
      return <MapPin className="w-4 h-4" />;
    }
    if (type.toLowerCase().includes('availability') || type.toLowerCase().includes('schedule')) {
      return <Calendar className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Current Context</DialogTitle>
          <DialogDescription>
            Set your current status, location, and availability. This helps generate contextually
            aware responses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Context */}
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="font-semibold text-sm">Add New Context</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={contextType}
                  onChange={(e) => setContextType(e.target.value)}
                  placeholder="e.g., Travel, Availability"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Context</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g., In Boston for a conference, Busy with project deadline"
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!contextType || !content || addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Context
                </>
              )}
            </Button>
          </div>

          {/* Current Contexts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Active Context</h3>

            {contexts && contexts.length > 0 ? (
              <div className="space-y-2">
                {contexts.map((ctx) => (
                  <div
                    key={ctx.id}
                    className="border rounded-lg p-3 space-y-2 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getContextIcon(ctx.contextType)}
                        <Badge variant="secondary">{ctx.contextType}</Badge>
                        {ctx.endDate && (
                          <span className="text-xs text-gray-500">
                            Until {new Date(ctx.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ctx.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">{ctx.content}</p>
                    <p className="text-xs text-gray-500">
                      Added {formatMessageDate(new Date(ctx.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active context yet</p>
                <p className="text-xs">Add context about your current status and availability</p>
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Example Contexts</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• "In Boston next week for work" (Travel)</li>
              <li>• "Busy with project deadline until Friday" (Availability)</li>
              <li>• "On vacation, limited availability" (Status)</li>
              <li>• "Working from home this week" (Location)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
