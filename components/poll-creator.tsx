import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { CheckSquare, Plus, Trash2, X } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';

interface PollCreatorProps {
  groupId: Id<"groups">;
  onPollCreated: (pollId: Id<"polls">) => void;
  className?: string;
}

export const PollCreator = ({
  groupId,
  onPollCreated,
  className,
}: PollCreatorProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createPoll = useMutation(api.polls.create);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = useCallback(async () => {
    if (!title.trim()) {
      alert('Please provide a poll title');
      return;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Please provide at least two options');
      return;
    }

    setIsCreating(true);

    try {
      // Calculate expiration timestamp if provided
      let expiresAtTimestamp: number | undefined = undefined;
      if (expiresAt) {
        expiresAtTimestamp = new Date(expiresAt).getTime();
      }

      const result = await createPoll({
        title: title.trim(),
        description: description.trim(),
        groupId,
        options: validOptions.map(text => ({ text })),
        isMultipleChoice,
        isAnonymous,
        expiresAt: expiresAtTimestamp,
      });

      if (result?.pollId) {
        onPollCreated(result.pollId);
        
        // Reset form
        setTitle('');
        setDescription('');
        setOptions(['', '']);
        setIsMultipleChoice(false);
        setIsAnonymous(false);
        setExpiresAt('');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [title, description, options, isMultipleChoice, isAnonymous, expiresAt, createPoll, groupId, onPollCreated]);

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <h3 className="text-lg font-medium">Create a Poll</h3>
      
      <div className="space-y-2">
        <Label htmlFor="poll-title">Poll Question</Label>
        <Input
          id="poll-title"
          placeholder="Ask a question..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="poll-description">Description (Optional)</Label>
        <Textarea
          id="poll-description"
          placeholder="Add more context to your question..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="space-y-3">
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        {options.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Option
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="multiple-choice"
            checked={isMultipleChoice}
            onCheckedChange={setIsMultipleChoice}
          />
          <Label htmlFor="multiple-choice">Allow multiple selections</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="anonymous-poll"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
          <Label htmlFor="anonymous-poll">Make votes anonymous</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expires-at">Poll End Date (Optional)</Label>
          <Input
            id="expires-at"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>
      
      <Button
        type="button"
        className="w-full"
        onClick={handleCreatePoll}
        disabled={isCreating}
      >
        {isCreating ? 'Creating Poll...' : 'Create Poll'}
      </Button>
    </Card>
  );
};
