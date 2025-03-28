"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/navbar";

// Import the same categories from the homepage
const categories = [
  { id: "all", name: "All", icon: "🌐" },
  { id: "hobbies", name: "Hobbies", icon: "🎨" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "money", name: "Money", icon: "💰" },
  { id: "spirituality", name: "Spirituality", icon: "🧘" },
  { id: "tech", name: "Tech", icon: "💻" },
  { id: "health", name: "Health", icon: "🏥" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "self-improvement", name: "Self-improvement", icon: "📈" },
];

const Create = () => {
    const router = useRouter();
    const createGroup = useMutation(api.groups.create);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name || isCreating) return;
        
        try {
            setIsCreating(true);
            
            // Use custom category if selected, otherwise use the selected category
            const finalCategory = showCustomCategory ? customCategory : category;
            
            const groupId = await createGroup({
                name,
                description,
                isPublic,
                category: finalCategory || "General",
                price: 0,
                memberNumber: 1
            });
            
            router.push(`/${groupId}`);
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col max-w-[550px] p-6 md:p-10 mb-8 md:mb-0 md:mr-8">
                    <Logo />
                    <h2 className="font-bold text-2xl mt-8 mb-4">🌟 Create Your Community</h2>
                    <p className="text-slate-600 mb-6">Connect with others and build your community today.</p>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Community Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter community name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="What is your community about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            {!showCustomCategory ? (
                                <>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.slice(1).map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    <span className="mr-2">{cat.icon}</span> {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-sm"
                                        onClick={() => setShowCustomCategory(true)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add custom category
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Input
                                        placeholder="Enter custom category"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                    />
                                    <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-sm"
                                        onClick={() => {
                                            setShowCustomCategory(false);
                                            setCustomCategory("");
                                        }}
                                    >
                                        Use predefined category
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="public"
                                checked={isPublic}
                                onCheckedChange={(checked) => setIsPublic(!!checked)}
                            />
                            <Label htmlFor="public">Make this community public</Label>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="w-full"
                            disabled={!name || isCreating || (showCustomCategory && !customCategory)}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Community"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Create;
