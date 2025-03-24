"use client";

import { Id } from "@/convex/_generated/dataModel";

import { About } from "./_components/join-group-page";

// Direct access to params with proper error handling
// This approach aligns with your project's established patterns
export default function GroupPage({ params }: { 
    params: { groupId: string } 
}) {
    // Access groupId directly but handle potential undefined or invalid values
    const groupId = (params?.groupId || "") as unknown as Id<"groups">;
    
    return (
        <div className="w-full h-full bg-neutral-200 py-12">
            <About groupId={groupId} />
        </div>
    )
}