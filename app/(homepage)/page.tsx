"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { GroupList } from "./_components/group-list";
import { PublicGroupsSection } from "./_components/public-groups-section";
import { PendingInvitations } from "./_components/pending-invitations";
import { useConvexAuth } from "convex/react";

export default function Home() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const store = useMutation(api.users.store);
    
    useEffect(() => {
        // Only store the user if they're authenticated
        if (isAuthenticated) {
            const storeUser = async () => {
                await store({});
            }
            storeUser();
        }
    }, [store, isAuthenticated]);
    
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24">
            {/* Public groups are shown to all users, even those who aren't logged in */}
            <PublicGroupsSection />
            
            {/* Show pending invitations to authenticated users */}
            {isAuthenticated && <PendingInvitations />}
            
            {/* Only show the regular group list to authenticated users */}
            {isAuthenticated && <GroupList />}
            
            {/* Show login message if not authenticated and not loading */}
            {!isAuthenticated && !isLoading && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8 max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Sign In to Access Your Communities</h2>
                    <p className="text-slate-600 mb-6">
                        Log in to view your personal communities, create new ones, and join other private communities.
                    </p>
                    <div className="flex flex-col items-center">
                        <p className="text-sm text-slate-500 mt-4">
                            You can browse and view public communities without logging in.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}