"use client";

import { Id } from "@/convex/_generated/dataModel";
import { CourseList } from "./_components/course-list";
import { use } from 'react';

interface ClassroomProps {
    params: Promise<{
        groupId: Id<"groups">;
    }>;
};

const ClassroomPage = ({
    params
}: ClassroomProps) => {
    const { groupId } = use(params);
    return (
        <div className="py-6">
            <CourseList groupId={groupId} />
        </div>
    )
};

export default ClassroomPage;