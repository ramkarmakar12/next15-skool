import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { MediaUpload } from "@/components/media-upload";
import { EmojiPicker } from "@/components/emoji-picker";
import { GifPicker } from "@/components/gif-picker";
import { Paperclip } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CommentInputProps {
    postId: Id<"posts">;
    groupId: Id<"groups">;
}

export const CommentInput = ({
    postId,
    groupId
}: CommentInputProps) => {
    const add = useMutation(api.comments.add);
    const [comment, setComment] = useState("");
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [mediaTypes, setMediaTypes] = useState<string[]>([]);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

    const handleAdd = async () => {
        if (!comment.trim() && mediaUrls.length === 0) return;
        
        await add({ 
            postId, 
            content: comment,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            mediaTypes: mediaTypes.length > 0 ? mediaTypes : undefined
        });
        
        setComment("");
        setMediaUrls([]);
        setMediaTypes([]);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
    }

    const handleEmojiSelect = (emoji: string) => {
        setComment(prev => prev + emoji);
    }

    const handleGifSelect = (url: string) => {
        setMediaUrls([...mediaUrls, url]);
        setMediaTypes([...mediaTypes, 'gif']);
    }

    const handleMediaAdded = (urls: string[], types: string[]) => {
        setMediaUrls([...mediaUrls, ...urls]);
        setMediaTypes([...mediaTypes, ...types]);
    }

    const handleMediaRemoved = (index: number) => {
        const newUrls = [...mediaUrls];
        const newTypes = [...mediaTypes];
        newUrls.splice(index, 1);
        newTypes.splice(index, 1);
        setMediaUrls(newUrls);
        setMediaTypes(newTypes);
    }

    return (
        <div className="space-y-2 w-full">
            {mediaUrls.length > 0 && (
                <MediaUpload
                    onMediaAdded={handleMediaAdded}
                    onMediaRemoved={handleMediaRemoved}
                    existingMediaUrls={mediaUrls}
                    existingMediaTypes={mediaTypes}
                    groupId={groupId}
                    maxFiles={4}
                    className="mb-2"
                />
            )}
            <div className="flex w-full items-center gap-x-2">
                <div className="flex items-center">
                    <EmojiPicker onChange={handleEmojiSelect} />
                    <GifPicker onSelectGif={handleGifSelect} />
                    <Popover 
                        open={isMediaSelectorOpen} 
                        onOpenChange={setIsMediaSelectorOpen}
                    >
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            side="top" 
                            className="w-80 p-2"
                            align="start"
                        >
                            <MediaUpload
                                onMediaAdded={(urls, types) => {
                                    handleMediaAdded(urls, types);
                                    setIsMediaSelectorOpen(false);
                                }}
                                groupId={groupId}
                                maxFiles={4}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Input
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                />
                <Button 
                    variant={"secondary"} 
                    onClick={handleAdd}
                    disabled={!comment.trim() && mediaUrls.length === 0}
                >
                    Add comment
                </Button>
            </div>
        </div>
    );
}