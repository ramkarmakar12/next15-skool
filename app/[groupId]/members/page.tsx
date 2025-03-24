"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { use } from 'react';
import { MemberCard } from "./_components/member-card";
import { AddMember } from "./_components/add-member";

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
    const currentUser = useQuery(api.users.currentUser, {});
    const group = useQuery(api.groups.get, { id: groupId });
    if (members === undefined) {
        return <div>Loading...</div>;
    }

    if (group === undefined) {
        return <div>Loading...</div>;
    }

    if (currentUser === undefined) {
        return <div>Loading...</div>;
    }

    const isOwner = group?.ownerId === currentUser?._id;

    return (
        <div>
            {(isOwner &&
                <AddMember groupId={groupId} />
            )}
            {members.map((member) => (
                <MemberCard key={member._id} member={member} />
            ))}
        </div>
    )
}
export default MebersPage;