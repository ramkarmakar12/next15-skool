"use client";

import { Id } from "@/convex/_generated/dataModel";
import { use } from "react";

import { About } from "./_components/join-group-page";

// Using React.use() to unwrap params Promise as recommended by Next.js 14
export default function GroupPage({ params }: { 
    params: { groupId: string } 
}) {
    // Properly unwrap params Promise using React.use()
    const unwrappedParams = use(params);
    const groupId = (unwrappedParams?.groupId || "") as unknown as Id<"groups">;
    
    return (
        <div className="w-full h-full bg-neutral-200 py-12">
            <About groupId={groupId} />
        </div>
    )
}