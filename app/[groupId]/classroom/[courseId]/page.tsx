"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Curriculum } from "./_components/curriculam";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from 'react';

interface CourseProps {
    params: Promise<{
        groupId: Id<"groups">;
        courseId: Id<"courses">;
    }>;
};

const CoursePage = ({
    params
}: CourseProps) => {
    const { courseId, groupId } = use(params);
    const course = useQuery(api.courses.get, { id: courseId });
    if (!course || Array.isArray(course)) return <div>Loading...</div>;
    return (
        <Curriculum course={course} groupId={groupId} />
    )
};

export default CoursePage;