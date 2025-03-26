import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useQuery } from "convex/react";
import {
    formatDistanceToNow
} from 'date-fns';
import { MessageSquare, PenBox, ThumbsUp, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Content } from "../../../components/content";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Define interface for vote data
interface VoteData {
    _id: Id<"pollVotes">;
    userId: Id<"users">;
    pollId: Id<"polls">;
    optionId: Id<"pollOptions">;
    _creationTime: number;
}

// Define interface for poll option with appropriate types
interface PollOption {
    _id: Id<"pollOptions">;
    _creationTime: number;
    pollId: Id<"polls">;
    text: string;
    imageUrl?: string;
    votes: number | VoteData[]; // Could be number (for anonymous) or array (for public)
}

// Define interface for poll data
interface PollData {
    _id: Id<"polls">;
    _creationTime: number;
    title: string;
    description?: string;
    authorId: Id<"users">;
    groupId: Id<"groups">;
    isMultipleChoice: boolean;
    isAnonymous: boolean;
    expiresAt?: number;
    author: Doc<"users"> | null;
    options: PollOption[];
    userVote?: Id<"pollOptions">;
}

interface PostCardProps {
    post: Doc<"posts"> & {
        likes: Doc<"likes">[];
        comments: Doc<"comments">[];
        author: Doc<"users">;
    };
    className?: string;
}

export const PostCard = ({
    post,
    className,
}: PostCardProps) => {
    const currentUser = useQuery(api.users.currentUser, {});
    const timeAgo = formatDistanceToNow(post._creationTime);
    const likeCount = post.likes.length;
    const commentCount = post.comments.length;
    const [isContentExpanded, setIsContentExpanded] = useState(true);
    const [isPollVisible, setIsPollVisible] = useState(true);
    
    // Only query for poll data if the post has a pollId
    const pollId = post.pollId;
    const rawPollData = useQuery(
        api.polls.get, 
        pollId ? { pollId } : "skip"
    );
    
    // Improved poll data detection - handle pending state properly
    const hasPoll = Boolean(post.pollId);
    const isPollLoaded = rawPollData !== undefined;
    
    // Create a safer typed version of the poll data
    const pollData = isPollLoaded ? rawPollData as unknown as PollData : null;
    
    const {
        mutate: like
    } = useApiMutation(api.likes.add);
    const {
        mutate: remove
    } = useApiMutation(api.posts.remove);
    
    const {
        mutate: vote,
        pending: votePending
    } = useApiMutation(api.polls.vote);

    const handleLike = () => {
        like({ postId: post._id });
    }

    const handleRemove = () => {
        remove({ id: post._id })
    }

    const handleAttackToLesson = () => {
        <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    }
    
    const handleVote = (optionId: Id<"pollOptions">) => {
        if (post.pollId && !votePending) {
            vote({
                pollId: post.pollId,
                optionId
            });
        }
    }
    
    const togglePoll = () => {
        setIsPollVisible(prev => !prev);
    }
    
    const toggleContent = () => {
        setIsContentExpanded(prev => !prev);
    }

    const isOwner = post.author._id === currentUser?._id;
    const hasVoted = pollData ? pollData.userVote !== undefined : false;

    return (
        <div className={cn("space-y-6 p-4 rounded-xl relative border", className)}>
            {(isOwner &&
                <div className="absolute top-14 right-2 cursor-pointer flex gap-x-2">
                    <Trash2 onClick={handleRemove} className="text-neutral-300" />
                    <PenBox onClick={handleAttackToLesson} className="text-neutral-300" />
                </div>
            )}
            <div className="flex items-center">
                <Avatar>
                    <AvatarImage src={post.author.profileUrl} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.author.name}</p>
                    <p className="text-neutral-400">{timeAgo}</p>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex space-x-3 items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <h2 className="font-semibold text-xl">{post.title}</h2>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleContent}
                    className="flex items-center"
                >
                    {isContentExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
            
            {isContentExpanded && (
                <ScrollArea className="max-h-[450px] h-fit overflow-auto">
                    {/* Only show content if it's not a poll-only post or if it has actual content */}
                    {(!hasPoll || (post.content && post.content !== "null" && post.content !== "{}")) && (
                        <Content
                            postId={post._id}
                            initialContent={post.content}
                            editable={isOwner && true}
                            className="text-wrap max-w-screen-md my-2"
                        />
                    )}
                    
                    {/* Display Poll if available */}
                    {hasPoll && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-lg">{isPollLoaded && pollData ? pollData.title : "Loading poll..."}</h3>
                                {isPollLoaded && pollData && (
                                    <button 
                                        onClick={togglePoll}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {isPollVisible ? "Hide poll" : "Show poll"}
                                    </button>
                                )}
                            </div>
                            
                            {isPollLoaded && pollData && isPollVisible && (
                                <>
                                    {pollData.description && (
                                        <p className="text-gray-600 mb-4">{pollData.description}</p>
                                    )}
                                    
                                    <div className="space-y-2">
                                        {pollData.options.map((option) => {
                                            // Calculate votes and percentages
                                            let totalVotes = 0;
                                            let optionVotes = 0;
                                            
                                            // Check if option has votes property
                                            if ('votes' in option) {
                                                if (typeof option.votes === 'number') {
                                                    optionVotes = option.votes;
                                                    // Sum up votes from all options
                                                    totalVotes = pollData.options.reduce((sum, opt) => 
                                                        sum + (typeof opt.votes === 'number' ? opt.votes : 0), 0);
                                                } else if (Array.isArray(option.votes)) {
                                                    optionVotes = option.votes.length;
                                                    // Sum up votes from all options
                                                    totalVotes = pollData.options.reduce((sum, opt) => 
                                                        sum + (Array.isArray(opt.votes) ? opt.votes.length : 0), 0);
                                                }
                                            }
                                            
                                            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                                            
                                            // Check if the current user voted for this option
                                            const isSelected = hasVoted && pollData.userVote === option._id;
                                            
                                            return (
                                                <div 
                                                    key={option._id}
                                                    onClick={() => !hasVoted && handleVote(option._id)}
                                                    className={cn(
                                                        "p-3 border rounded cursor-pointer relative overflow-hidden transition-all",
                                                        hasVoted ? "cursor-default" : "hover:bg-gray-100",
                                                        isSelected ? "border-blue-500 bg-blue-50" : ""
                                                    )}
                                                >
                                                    {/* Vote percentage background */}
                                                    {hasVoted && (
                                                        <div 
                                                            className="absolute top-0 left-0 bottom-0 bg-blue-100 z-0"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    )}
                                                    
                                                    <div className="flex justify-between items-center relative z-10">
                                                        <span>{option.text}</span>
                                                        {hasVoted && (
                                                            <span className="text-sm font-medium">
                                                                {optionVotes} vote{optionVotes !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Display image if available */}
                                                    {option.imageUrl && (
                                                        <div className="mt-2 relative w-full h-40">
                                                            <Image 
                                                                src={option.imageUrl} 
                                                                alt={option.text}
                                                                fill
                                                                className="rounded object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-3 text-sm text-gray-500">
                                        {/* Display vote count and poll type */}
                                        {(() => {
                                            // Calculate total votes
                                            let totalVotes = 0;
                                            
                                            if (pollData.options) {
                                                pollData.options.forEach(option => {
                                                    if ('votes' in option) {
                                                        if (typeof option.votes === 'number') {
                                                            totalVotes += option.votes;
                                                        } else if (Array.isArray(option.votes)) {
                                                            totalVotes += option.votes.length;
                                                        }
                                                    }
                                                });
                                            }
                                            
                                            return (
                                                <p>
                                                    {totalVotes > 0 
                                                        ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} • `
                                                        : 'No votes yet • '
                                                    }
                                                    {pollData.isAnonymous ? 'Anonymous poll' : 'Public poll'}
                                                </p>
                                            );
                                        })()}
                                        
                                        {pollData.expiresAt && new Date(pollData.expiresAt) > new Date() && (
                                            <p className="mt-1">
                                                Expires {formatDistanceToNow(pollData.expiresAt, { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>
            )}
            
            <div className="flex space-x-4">
                <div className="flex items-center space-x-3 select-none">
                    <ThumbsUp className="cursor-pointer" onClick={handleLike} size={20} />
                    <p>{likeCount}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <MessageSquare className="cursor-pointer" size={20} />
                    <p>{commentCount}</p>
                </div>
            </div>
            <Separator />
        </div>
    );
};