"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { CreatePostModal } from "./_components/create-post-modal";
import { AboutSide } from "@/components/about-side";
import { Post } from "./_components/post-modal";
import React, { useEffect, useState } from "react";
import { use } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

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

// Create an error boundary component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
  
    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }
  
    render() {
        if (this.state.hasError) {
            return <div>Something went wrong. Please try again.</div>;
        }
  
        return this.props.children;
    }
}

const CommunityContent = ({ groupId }) => {
    const router = useRouter();
    
    // Only validate the ID format
    const isIdValid = isValidConvexId(groupId as string);
    
    // Always query for data regardless of ID format
    const group = useQuery(api.groups.get, { id: groupId });
    const currentUser = useQuery(api.users.currentUser, {});
    const posts = useQuery(api.posts.list, { groupId });
    
    // Show loading state while data is being fetched
    if (group === undefined) {
        return <div>Loading group data...</div>;
    }

    // If group doesn't exist, show a message but don't redirect
    if (group === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Group Not Found</h2>
                    <p className="mb-6">This group doesn't exist or has been deleted.</p>
                    <button 
                        onClick={() => router.push("/")}
                        className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const handleEdit = () => {
        router.push(`/${groupId}/edit`);
    }

    const membersText = group.memberNumber === 1 ? "Member" : "Members";

    return (
        <div className="flex w-full h-full py-12 space-x-5">
            <div className="w-full">
                <CreatePostModal groupId={groupId} />
                <div className="space-y-12 flex flex-col">
                    {posts && posts.map((post) => (
                        <Post key={post._id} post={post} />
                    ))}
                </div>
            </div>
            <AboutSide handleEdit={handleEdit} group={group} membersText={membersText} currentUser={currentUser} />
        </div>
    );
}

const Community = ({ params }: ChatPageProps) => {
    // Unwrap params using React.use() instead of accessing directly
    const { groupId } = use(params);
    
    return (
        <ErrorBoundary>
            <CommunityContent groupId={groupId} />
        </ErrorBoundary>
    );
};

export default Community;
