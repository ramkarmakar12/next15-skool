import { Doc, Id } from "@/convex/_generated/dataModel";
import { CommentCard } from "./comment-card";
import { CommentInput } from "./comment-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentListProps {
    post: Doc<"posts"> & {
        likes: Doc<"likes">[];
        comments: Doc<"comments">[];
        author: Doc<"users">;
    };
    groupId?: Id<"groups">;
}

export const CommentList = ({ post, groupId }: CommentListProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const commentsQuery = useQuery(api.comments.list, { postId: post._id });
    
    // Wrap comments in useMemo to prevent dependency changes on every render
    const comments = useMemo(() => commentsQuery || [], [commentsQuery]);
    
    const [isExpanded, setIsExpanded] = useState(false);
    
    useEffect(() => {
        if (isExpanded && comments.length > 0) {
            scrollToBottom();
        }
    }, [isExpanded, comments]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    const toggleExpanded = () => {
        setIsExpanded(prev => !prev);
    };
    
    // Extract groupId from the post if not provided
    const effectiveGroupId = groupId || post.groupId;

    return (
        <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between mb-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleExpanded}
                    className="flex items-center"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            <span>Hide comments ({comments.length})</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            <span>Show comments ({comments.length})</span>
                        </>
                    )}
                </Button>
            </div>
            
            {isExpanded && (
                <>
                    <CommentInput postId={post._id} groupId={effectiveGroupId} />
                    {comments.length > 0 && (
                        <ScrollArea className="max-h-[250px] border px-2 py-4 mt-2 rounded-md">
                            <div className="flex flex-col space-y-8">
                                {comments.map((comment) => (
                                    <CommentCard key={comment._id} comment={comment} author={post.author} />
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    )}
                </>
            )}
        </div>
    );
};