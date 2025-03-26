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
import { Loader2 } from "lucide-react";

const Create = () => {
    const router = useRouter();
    const createGroup = useMutation(api.groups.create);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name || isCreating) return;
        
        try {
            setIsCreating(true);
            const groupId = await createGroup({ 
                name,
                description: description || undefined,
                isPublic 
            });
            
            if (groupId) {
                router.push(`/${groupId}`);
            }
        } catch (error) {
            console.error("Failed to create group:", error);
        } finally {
            setIsCreating(false);
        }
    }
    
    return (
        <div className="flex flex-col md:flex-row h-full items-center justify-center p-4 md:p-8">
            <div className="flex flex-col max-w-[550px] p-6 md:p-10 mb-8 md:mb-0 md:mr-8">
                <Logo />
                <h2 className="font-bold text-2xl mt-8 mb-4">🌟 Create Your Community</h2>
                <p className="text-slate-600 mb-6">Connect with others and build your community today.</p>
                <div className="space-y-2 text-slate-700">
                    <p className="flex items-center">🚀 <span className="ml-2">Drive exceptional engagement</span></p>
                    <p className="flex items-center">💖 <span className="ml-2">Set up seamlessly</span></p>
                    <p className="flex items-center">😄 <span className="ml-2">Enjoy a delightful user experience</span></p>
                    <p className="flex items-center">💸 <span className="ml-2">Monetize through membership fees</span></p>
                    <p className="flex items-center">📱 <span className="ml-2">Accessible via iOS and Android apps</span></p>
                    <p className="flex items-center">🌍 <span className="ml-2">Connect with millions of daily users</span></p>
                </div>
            </div>

            <div className="flex flex-col rounded-lg shadow-xl max-w-[550px] w-full p-6 md:p-10">
                <h2 className="font-bold text-2xl mb-6">
                    Create a Community
                </h2>
                
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
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your community"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="isPublic" 
                            checked={isPublic}
                            onCheckedChange={(checked: boolean | "indeterminate") => setIsPublic(checked === true)}
                        />
                        <Label 
                            htmlFor="isPublic" 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Make this community public
                        </Label>
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-xs text-slate-500 mb-4">
                            {isPublic ? 
                                "Public communities are visible to everyone and can be joined without an invitation." : 
                                "Private communities require an invitation to join."}
                        </p>
                    </div>
                    
                    <Button 
                        onClick={handleCreate}
                        disabled={!name || isCreating}
                        className="w-full"
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
    );
}

export default Create;