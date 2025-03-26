import { useState, useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface PollDisplayProps {
  pollId: Id<"polls">;
  className?: string;
}

export const PollDisplay = ({ pollId, className }: PollDisplayProps) => {
  const poll = useQuery(api.polls.get, { pollId });
  const currentUser = useQuery(api.users.currentUser, {});
  const voteMutation = useMutation(api.polls.vote);
  const [selectedOptions, setSelectedOptions] = useState<Id<"pollOptions">[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  // Determine if the poll has expired
  const isExpired = poll?.expiresAt ? poll.expiresAt < Date.now() : false;
  
  // Calculate total votes
  useEffect(() => {
    if (poll?.options) {
      let total = 0;
      const userVotes: Id<"pollOptions">[] = [];
      
      poll.options.forEach(option => {
        // For anonymous polls
        if (typeof option.votes === 'number') {
          total += option.votes;
        } 
        // For non-anonymous polls
        else if (Array.isArray(option.votes)) {
          total += option.votes.length;
          
          // Check if current user has voted for this option
          if (currentUser && option.votes.some(vote => vote.userId === currentUser._id)) {
            userVotes.push(option._id);
          }
        }
      });
      
      setTotalVotes(total);
      setSelectedOptions(userVotes);
      setHasVoted(userVotes.length > 0);
    }
  }, [poll, currentUser]);

  const handleVote = async () => {
    if (!currentUser || !poll || selectedOptions.length === 0) return;
    
    try {
      // For multiple choice polls, we handle each option separately
      if (poll.isMultipleChoice) {
        for (const optionId of selectedOptions) {
          await voteMutation({ pollId, optionId });
        }
      } 
      // For single choice polls, just submit the first (and only) selected option
      else if (selectedOptions.length === 1) {
        await voteMutation({ pollId, optionId: selectedOptions[0] });
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const toggleOption = (optionId: Id<"pollOptions">) => {
    if (hasVoted || isExpired) return;
    
    if (poll?.isMultipleChoice) {
      // For multiple choice, toggle the selection
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      // For single choice, replace the selection
      setSelectedOptions([optionId]);
    }
  };

  if (!poll) {
    return <div className="text-gray-500">Loading poll...</div>;
  }

  const calculatePercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{poll.title}</CardTitle>
        {poll.description && <p className="text-sm text-gray-500">{poll.description}</p>}
        <div className="flex items-center text-xs text-gray-500 mt-1">
          {poll.author && (
            <div className="flex items-center mr-3">
              <User className="h-3 w-3 mr-1" />
              <span>{poll.author.name}</span>
            </div>
          )}
          {poll.expiresAt && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {isExpired 
                  ? 'Ended ' + formatDistanceToNow(poll.expiresAt, { addSuffix: true }) 
                  : 'Ends ' + formatDistanceToNow(poll.expiresAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {poll.isMultipleChoice ? (
          // Multiple choice UI (checkboxes)
          <div className="space-y-2">
            {poll.options.map(option => {
              const voteCount = typeof option.votes === 'number' 
                ? option.votes 
                : option.votes.length;
              const percentage = calculatePercentage(voteCount);
              const isSelected = selectedOptions.includes(option._id);
              
              return (
                <div key={option._id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={option._id}
                      checked={isSelected}
                      onCheckedChange={() => toggleOption(option._id)}
                      disabled={isExpired || (hasVoted && !poll.isMultipleChoice)}
                    />
                    <Label htmlFor={option._id} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                  
                  {(hasVoted || isExpired) && (
                    <div className="ml-6 space-y-1">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Single choice UI (radio buttons)
          <RadioGroup 
            value={selectedOptions[0]} 
            onValueChange={value => toggleOption(value as Id<"pollOptions">)}
            disabled={isExpired || hasVoted}
            className="space-y-2"
          >
            {poll.options.map(option => {
              const voteCount = typeof option.votes === 'number' 
                ? option.votes 
                : option.votes.length;
              const percentage = calculatePercentage(voteCount);
              
              return (
                <div key={option._id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option._id} 
                      id={option._id}
                      disabled={isExpired || hasVoted}
                    />
                    <Label htmlFor={option._id} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                  
                  {(hasVoted || isExpired) && (
                    <div className="ml-6 space-y-1">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          {poll.isAnonymous && ' • Anonymous'}
        </div>
        
        {!isExpired && !hasVoted && (
          <Button 
            onClick={handleVote} 
            disabled={selectedOptions.length === 0}
            size="sm"
          >
            Vote
          </Button>
        )}
        
        {hasVoted && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>You voted</span>
          </div>
        )}
        
        {isExpired && (
          <div className="text-sm text-gray-500">
            Poll closed
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
