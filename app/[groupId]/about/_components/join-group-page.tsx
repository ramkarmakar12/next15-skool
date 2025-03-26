"use client";

import { AboutSide } from "@/components/about-side";
import { Loading } from "@/components/auth/loading";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Globe, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DescriptionEditor } from "../../edit/_components/description-editor";

interface JoinGroupPageProps {
    groupId: Id<"groups">;
};

export const About = ({
    groupId
}: JoinGroupPageProps) => {
    const group = useQuery(api.groups.get, { id: groupId });
    const currentUser = useQuery(api.users.currentUser);
    const members = useQuery(api.groups.getMembers, { id: groupId });
    const joinPublicGroup = useMutation(api.groups.joinPublicGroup);
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);

    if (group === undefined || members === undefined) {
        return <Loading />;
    }

    if (group === null) {
        router.push("/");
        return null;
    }

    const handleEdit = () => {
        router.push(`/${groupId}/edit`);
    }

    const handleJoin = async () => {
        if (!group.isPublic) return;
        
        try {
            setIsJoining(true);
            const result = await joinPublicGroup({ groupId });
            
            if (result?.success) {
                toast.success("You've joined the group!");
                // Refresh to show updated UI
                router.refresh();
            } else if (result && typeof result === 'object' && 'error' in result) {
                toast.error(String(result.error));
            }
        } catch (error) {
            console.error("Error joining group:", error);
            toast.error("Failed to join the group");
        } finally {
            setIsJoining(false);
        }
    };

    const membersText = group.memberNumber === 1 ? "Member" : "Members";
    
    // Check if current user is the owner or a member
    const isOwnerOrMember = currentUser?._id && (
        group.ownerId === currentUser._id || 
        (members && members.some(member => member._id === currentUser._id))
    );

    return (
        <div className="flex flex-col md:flex-row items-start justify-center md:space-x-12 w-full">
            <div className="w-full md:max-w-[650px] bg-white p-8 rounded-lg border border-neutral-200 space-y-10">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold text-2xl">{group.name}</h1>
                    {group.isPublic ? (
                        <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm">
                            <Globe className="h-4 w-4 mr-1.5" />
                            Public Group
                        </div>
                    ) : (
                        <div className="flex items-center text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                            <Lock className="h-4 w-4 mr-1.5" />
                            Private Group
                        </div>
                    )}
                </div>
                
                {group.aboutUrl && (
                    <>
                        <iframe
                            width="560"
                            height="315"
                            src={group.aboutUrl}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="rounded-xl w-full"
                        />
                    </>
                )}
                
                <DescriptionEditor
                    editable={false}
                    groupId={groupId}
                    className=""
                    initialContent={group.description}
                />
                
                {currentUser && group.isPublic && !isOwnerOrMember && (
                    <div className="pt-4">
                        <Button 
                            onClick={handleJoin} 
                            disabled={isJoining}
                            className="w-full"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                "Join This Group"
                            )}
                        </Button>
                    </div>
                )}
            </div>
            
            <AboutSide 
                group={group} 
                currentUser={currentUser} 
                handleEdit={handleEdit} 
                membersText={membersText} 
            />
        </div>
    );
}