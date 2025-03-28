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
import { Loader2, Plus, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { useStorage } from "@/hooks/use-storage";
import Image from "next/image";

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
    const { uploadImage } = useStorage();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Image upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            
            // Create a preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleCreate = async () => {
        if (!name || isCreating) return;
        
        try {
            setIsCreating(true);
            
            // In the handleCreate function, update the uploadImage call:
            
            // Upload image if selected
            let imageUrl = undefined;
            if (imageFile) {
              setIsUploading(true);
              try {
                // First create the group to get the ID
                const groupId = await createGroup({
                  name,
                  description,
                  isPublic,
                  category: finalCategory || "General",
                  price: 0,
                  memberNumber: 1,
                });
                
                // Then upload the image with the group ID
                imageUrl = await uploadImage(imageFile, groupId);
                
                // Update the group with the image URL
                await updateGroup({
                  id: groupId,
                  imageUrl,
                });
                
                setIsUploading(false);
                router.push(`/${groupId}`);
              } catch (error) {
                console.error(error);
                setIsUploading(false);
                setIsCreating(false);
              }
            } else {
              // Create group without image
              const groupId = await createGroup({
                name,
                description,
                isPublic,
                category: finalCategory || "General",
                price: 0,
                memberNumber: 1,
              });
              
              router.push(`/${groupId}`);
            }
            
            // Use custom category if selected, otherwise use the selected category
            const finalCategory = showCustomCategory ? customCategory : category;
            
            const groupId = await createGroup({
                name,
                description,
                isPublic,
                category: finalCategory || "General",
                price: 0,
                memberNumber: 1,
                imageUrl
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
                        {/* Group Image Upload */}
                        <div className="space-y-2">
                            <Label>Community Image</Label>
                            <div className="flex items-center space-x-4">
                                {imagePreview ? (
                                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                                        <Image 
                                            src={imagePreview} 
                                            alt="Group preview" 
                                            fill 
                                            className="object-cover" 
                                        />
                                        <button 
                                            onClick={removeImage}
                                            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
                                        >
                                            <X className="h-4 w-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500">
                                        <Upload className="h-6 w-6 mb-1" />
                                        <span className="text-xs">Upload</span>
                                    </div>
                                )}
                                <div>
                                    <Input
                                        id="groupImage"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                    <Label 
                                        htmlFor="groupImage" 
                                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                                    >
                                        Choose Image
                                    </Label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Recommended: 400x400px or larger
                                    </p>
                                </div>
                            </div>
                        </div>

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
                            disabled={!name || isCreating || isUploading || (showCustomCategory && !customCategory)}
                        >
                            {isCreating || isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isUploading ? "Uploading..." : "Creating..."}
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
