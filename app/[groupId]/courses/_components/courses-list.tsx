"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Spinner } from "@/components/spinner";
import { Plus } from "lucide-react";
import { CourseCard } from "./course-card";
import { CreateCourseModal } from "./create-course-modal";
import { Id } from "@/convex/_generated/dataModel";

interface CoursesListProps {
  groupId: Id<"groups">;
}

export const CoursesList = ({
  groupId
}: CoursesListProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Get courses with graceful error handling (returns [] if not authenticated)
  const courses = useQuery(api.courses.list, { groupId });

  if (courses === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your courses</h2>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>
      
      {courses.length === 0 ? (
        <div className="text-center p-12 border rounded-md">
          <h3 className="text-lg font-medium mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">Create your first course to get started</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              groupId={groupId}
            />
          ))}
        </div>
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        groupId={groupId}
      />
    </div>
  );
};
