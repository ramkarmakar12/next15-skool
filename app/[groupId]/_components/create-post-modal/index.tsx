import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, BarChart } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreatePostModalProps {
    groupId: string;
}

export const CreatePostModal = ({
    groupId
}: CreatePostModalProps) => {
    const {
        mutate: createPost,
        pending: createPostPending,
    } = useApiMutation(api.posts.create);

    const {
        mutate: createPoll,
        pending: createPollPending,
    } = useApiMutation(api.polls.create);

    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");

    // Poll state
    const [showPollOptions, setShowPollOptions] = useState(false);
    const [pollTitle, setPollTitle] = useState("");
    const [pollDescription, setPollDescription] = useState("");
    const [pollOptions, setPollOptions] = useState<{ text: string; imageUrl?: string }[]>([
        { text: "" },
        { text: "" }
    ]);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);
    const [activeTab, setActiveTab] = useState("post");

    const addPollOption = () => {
        setPollOptions([...pollOptions, { text: "" }]);
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length <= 2) return; // Keep at least 2 options
        const newOptions = [...pollOptions];
        newOptions.splice(index, 1);
        setPollOptions(newOptions);
    };

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index].text = value;
        setPollOptions(newOptions);
    };

    const handlePost = async () => {
        if (title === "") return;

        try {
            // If poll options are shown and there's a valid poll title
            if (showPollOptions && pollTitle.trim() !== "") {
                // Filter out empty options
                const validOptions = pollOptions.filter(option => option.text.trim() !== "");

                // Ensure we have at least 2 valid options
                if (validOptions.length >= 2) {
                    // Create the poll first
                    const pollResult = await createPoll({
                        title: pollTitle,
                        description: pollDescription,
                        options: validOptions.map(o => o.text),
                        isAnonymous,
                        isMultipleChoice,
                        groupId,
                    });

                    // Create the post with the poll ID
                    await createPost({
                        title,
                        content,
                        groupId,
                        pollId: pollResult.pollId,
                    });
                } else {
                    // Fall back to creating just the post if poll options aren't valid
                    await createPost({
                        title,
                        content,
                        groupId,
                    });
                }
            } else {
                // Create post without poll
                await createPost({
                    title,
                    content,
                    groupId,
                });
            }
        } catch (error) {
            console.error("Error creating post or poll:", error);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handlePost();
        }
    }

    const isPending = createPostPending || createPollPending;

    return (
        <div className="w-full">
            <Dialog>
                <DialogTrigger className="flex w-full justify-start">
                    <div className="w-full shadow-[1px_1px_2px_2px_rgba(0,0,0,0.2)] p-4 text-neutral-500 rounded-md bg-white font-semibold text-md text-start px-6">Write something</div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create a post</DialogTitle>
                        <DialogDescription>
                            Share your thoughts with the community
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="post">Post</TabsTrigger>
                            <TabsTrigger value="poll" onClick={() => setShowPollOptions(true)}>
                                <BarChart className="h-4 w-4 mr-2" />
                                Poll
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="post" className="space-y-4 mt-4">
                            <Input
                                placeholder="Title"
                                className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 h-12"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <Textarea
                                placeholder="Content"
                                className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 min-h-[100px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </TabsContent>

                        <TabsContent value="poll" className="space-y-4 mt-4">
                            <Input
                                placeholder="Title"
                                className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 h-12"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />

                            <Textarea
                                placeholder="Post content (optional)"
                                className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 min-h-[60px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />

                            <Separator className="my-4" />

                            <div className="space-y-4">
                                <Input
                                    placeholder="Poll question"
                                    className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 h-12"
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                />

                                <Textarea
                                    placeholder="Poll description (optional)"
                                    className="ring-0 rounded-xl bg-inherit placeholder:text-neutral-600 min-h-[60px]"
                                    value={pollDescription}
                                    onChange={(e) => setPollDescription(e.target.value)}
                                />

                                <div className="space-y-2">
                                    <Label>Poll Options</Label>
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                placeholder={`Option ${index + 1}`}
                                                value={option.text}
                                                onChange={(e) => updatePollOption(index, e.target.value)}
                                            />
                                            {pollOptions.length > 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    onClick={() => removePollOption(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={addPollOption}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Option
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="anonymous-poll">Anonymous Poll</Label>
                                        <Switch
                                            id="anonymous-poll"
                                            checked={isAnonymous}
                                            onCheckedChange={setIsAnonymous}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="multiple-choice">Allow Multiple Choices</Label>
                                        <Switch
                                            id="multiple-choice"
                                            checked={isMultipleChoice}
                                            onCheckedChange={setIsMultipleChoice}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex pt-2">
                        <DialogClose asChild>
                            <Button
                                className="w-1/2"
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button
                                onClick={handlePost}
                                disabled={isPending || (!title.trim())}
                                className="w-1/2"
                                onKeyDown={handleKeyDown}
                            >
                                Create
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};