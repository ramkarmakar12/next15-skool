"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Eye, 
  EyeOff,
  Trash
} from "lucide-react";
import { ModuleList } from "./module-list";
import { CreateModuleModal } from "./create-module-modal";
import { CourseSettingsModal } from "./course-settings-modal";
import { ConfirmModal } from "@/components/confirm-modal";

interface CourseBuilderProps {
  courseId: Id<"courses">;
  groupId: Id<"groups">;
}

export const CourseBuilder = ({
  courseId,
  groupId,
}: CourseBuilderProps) => {
  const router = useRouter();
  
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const course = useQuery(api.courses.get, { id: courseId });  // Change courseId to id
  const updateCourse = useMutation(api.courses.update);
  const deleteCourse = useMutation(api.courses.remove);

  // Handle loading state with graceful error handling
  if (course === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Handle not found state
  if (course === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Course not found</h1>
        <Button
          onClick={() => router.push(`/${groupId}/courses`)}
          variant="link"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to courses
        </Button>
      </div>
    );
  }

  const handlePublishToggle = async () => {
    try {
      setIsPublishing(true);
      const result = await updateCourse({
        id: courseId,  // Change from courseId to id to match API
        published: !course.published,
      });
  
      if (result.success) {
        toast.success(course.published ? "Course unpublished" : "Course published");
      } else {
        toast.error(result.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteCourse({
        courseId,
      });

      if (result.success) {
        toast.success("Course deleted");
        router.push(`/${groupId}/courses`);
      } else {
        toast.error(result.error || "Failed to delete course");
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Something went wrong. Please try again.");
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={() => router.push(`/${groupId}/courses`)}
              variant="ghost"
              className="mr-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold truncate">{course.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePublishToggle}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : course.published ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {course.published ? "Unpublish" : "Publish"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Course Modules</h2>
              <p className="text-sm text-muted-foreground">
                Organize your course into modules and add content
              </p>
            </div>
            <Button onClick={() => setIsCreateModuleModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
          
          <ModuleList courseId={courseId} />
        </div>
      </div>

      {/* Modals */}
      <CreateModuleModal
        isOpen={isCreateModuleModalOpen}
        onClose={() => setIsCreateModuleModalOpen(false)}
        courseId={courseId}
      />
      
      <CourseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        course={course}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Course"
        description="Are you sure you want to delete this course? This will also delete all modules and content within the course. This action cannot be undone."
      />
    </>
  );
};
