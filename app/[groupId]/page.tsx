"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { CreatePostModal } from "./_components/create-post-modal";
import { AboutSide } from "@/components/about-side";
import { Post } from "./_components/post-modal";
import React, { useEffect } from "react";

interface ChatPageProps {
    params: {
        groupId: Id<"groups">;
    }
}

// Helper function to validate if a string looks like a valid Convex ID
const isValidConvexId = (id: string): boolean => {
    // Convex IDs typically look like this: "abc123def456ghi789"
    // They're alphanumeric and typically around 17 characters
    return /^[a-zA-Z0-9]{16,24}$/.test(id);
};

const Community = ({ params }: ChatPageProps) => {
    const router = useRouter();
    // Properly type the unwrapped params
    const unwrappedParams = React.use(params) as ChatPageProps['params'];
    const groupId = unwrappedParams.groupId;
    
    // Validate if the ID appears to be in the correct format
    const isIdValid = isValidConvexId(groupId as string);
    
    // Always call hooks unconditionally, but pass a dummy id if the real one is invalid
    // This avoids the validation error while still respecting React hook rules
    const dummyId = isIdValid ? groupId : undefined;
    
    const group = useQuery(api.groups.get, { id: dummyId });
    const currentUser = useQuery(api.users.currentUser, {});
    const posts = useQuery(api.posts.list, { groupId: dummyId });
    
    // Redirect if ID is invalid
    useEffect(() => {
        if (!isIdValid) {
            router.push("/");
        }
    }, [isIdValid, router]);
    
    // Handle redirect for unauthenticated users
    useEffect(() => {
        if (currentUser === null && typeof window !== "undefined" && isIdValid) {
            router.push("/sign-in?redirect=" + encodeURIComponent("/" + groupId));
        }
    }, [currentUser, groupId, router, isIdValid]);

    // If ID is invalid, show loading while redirecting
    if (!isIdValid) {
        return <div>Redirecting...</div>;
    }
    
    if (group === undefined || currentUser === undefined) {
        return <div>Loading...</div>;
    }

    // If no authenticated user, show authentication required message
    if (currentUser === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                    <p className="mb-6">Please sign in to access this group.</p>
                    <button 
                        onClick={() => router.push("/sign-in?redirect=" + encodeURIComponent("/" + groupId))}
                        className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (group === null) {
        router.push("/");
        return null;
    }

    const handleEdit = () => {
        router.push(`/${groupId}/edit`);
    }

    const membersText = group.memberNumber === 1 ? "Member" : "Members";

    if (posts === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex w-full h-full py-12 space-x-5">
            <div className="w-full">
                <CreatePostModal groupId={groupId} />
                <div className="space-y-12 flex flex-col">
                    {posts.map((post) => (
                        <Post key={post._id} post={post} />
                    ))}
                </div>
            </div>
            <AboutSide handleEdit={handleEdit} group={group} membersText={membersText} currentUser={currentUser} />
        </div>
    )
}

export default Community;