"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { use } from "react";
import { MemberCard } from "./_components/member-card";
import { AddMember } from "./_components/add-member";
import { InviteMembers } from "./_components/invite-members";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserPlus, Mail } from "lucide-react";

interface MebersPageProps {
    params: Promise<{
        groupId: Id<"groups">;
    }>;
};

const MebersPage = ({
    params
}: MebersPageProps) => {
    const { groupId } = use(params);
    const members = useQuery(api.groups.getMembers, { id: groupId });
    const currentUser = useQuery(api.users.currentUser);
    const group = useQuery(api.groups.get, { id: groupId });
    
    if (members === undefined || group === undefined || currentUser === undefined) {
        return (
            <div className="flex justify-center items-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const isOwner = group?.ownerId === currentUser?._id;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Group Members</h1>
            
            <Tabs defaultValue="members" className="mb-8">
                <TabsList className="mb-4">
                    <TabsTrigger value="members">
                        <User className="h-4 w-4 mr-2" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger value="invites">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Invitations
                    </TabsTrigger>
                    {isOwner && (
                        <TabsTrigger value="add">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Members
                        </TabsTrigger>
                    )}
                </TabsList>
                
                <TabsContent value="members" className="space-y-4">
                    {members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {members.map((member) => (
                                <MemberCard key={member._id} member={member} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">No members found for this group.</p>
                        </div>
                    )}
                </TabsContent>
                
                <TabsContent value="invites">
                    <InviteMembers groupId={groupId} />
                </TabsContent>
                
                {isOwner && (
                    <TabsContent value="add">
                        <AddMember groupId={groupId} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default MebersPage;