"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { BookCheck, Component, Fullscreen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

interface ModuleNameEditorProps {
  name: string;
}

const ModuleNameEditor = ({ name }: ModuleNameEditorProps) => {
  return <span className="font-semibold">{name}</span>;
};

// Create a properly typed error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

class CourseEditErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in course edit page:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CourseEditPageContent({ groupId, courseId }: { groupId: Id<"groups">, courseId: Id<"courses"> }) {
    // Use the course API with id parameter
    const course = useQuery(api.courses.get, { id: courseId });
    const updateCourse = useMutation(api.courses.update);
    
    const currentUser = useQuery(api.users.currentUser, {});
    const group = useQuery(api.groups.get, { id: groupId });
    const router = useRouter();
    
    // Fix: Use courseModules instead of modules
    const modules = useQuery(api.courseModules.list, { courseId });
    const addModule = useMutation(api.courseModules.create);
    const removeModule = useMutation(api.courseModules.remove);

    if (course === undefined || modules === undefined || currentUser === undefined || group === undefined) {
        return <div>Loading...</div>;
    }

    if (course === null) {
        return <div>Course not found</div>;
    }

    const handleEditClick = () => {
        router.push(`/${groupId}/classroom/${courseId}`);
    }

    const handleTitleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateCourse({ 
            id: courseId,
            name: e.target.value 
        });
    }

    const handleAddModule = () => {
        addModule({ 
            courseId: courseId,
            title: "New Module" 
        });
    }

    const handleRemoveModule = (moduleId: Id<"courseModules">) => {
        removeModule({ moduleId });
    }

    // Add a console log to debug
    console.log("Modules:", modules);
    console.log("Current user:", currentUser);
    console.log("Group:", group);
    
    // Check if user is owner or has author role in the group
    const isOwner = currentUser?._id === course.ownerId;
    const isAuthor = group?.members?.some(member => 
        member.userId === currentUser?._id && 
        (member.role === "owner" || member.role === "author")
    );

    console.log("Is owner:", isOwner);
    console.log("Is author:", isAuthor);

    const hasAccess = isOwner || isAuthor;

    if (!hasAccess) return <div>Unauthorized: You need to be the course owner or an author to edit this course</div>;

    return (
        <div className="flex flex-col md:flex-row h-full w-full gap-4 p-4">
            <div className="w-full md:w-1/4">
                {isOwner && (
                    <Button onClick={handleEditClick} variant={"secondary"} className="text-zinc-600 text-sm space-x-3 mb-10">
                        <Fullscreen className="w-4 h-4" />
                        <p>Preview</p>
                    </Button>
                )}
                <div className="flex items-center mb-6 space-x-3">
                    <BookCheck />
                    <Input value={course.name} onBlur={handleTitleUpdate} onChange={handleTitleUpdate} />
                </div>

                {modules.map((module) => (
                    <div key={module._id} className="mb-8">
                        <div className="flex items-center mb-6 space-x-3">
                            <Component />
                            <ModuleNameEditor
                                id={module._id}
                                name={module.title}
                            />
                            <Button
                                variant={"secondary"}
                                className="text-red-300"
                                onClick={() => handleRemoveModule(module._id)}
                            >
                                <Trash2 />
                            </Button>
                        </div>

                        {/* Placeholder for future content item list */}
                        <div className="text-center p-4 border rounded-md mb-2">
                            <p className="text-muted-foreground text-sm">
                                Content editing not available in this view.
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                                Please use the new course builder.
                            </p>
                        </div>

                        <Button 
                            variant={"ghost"} 
                            className="w-full mt-4 flex space-x-2"
                            onClick={() => router.push(`/${groupId}/courses/${courseId}`)}
                        >
                            <Plus className="w-4 h-4" />
                            <p>Use New Course Builder</p>
                        </Button>
                    </div>
                ))}
                <Button variant={"outline"} onClick={handleAddModule} className="w-full mt-4 flex space-x-2 p-0 border-2 text-blue-700">
                    <Plus className="w-4 h-4" />
                    <p>Add module</p>
                </Button>

                <Button 
                    variant={"default"} 
                    className="w-full mt-8"
                    onClick={() => router.push(`/${groupId}/courses/${courseId}`)}
                >
                    Go to Course Builder
                </Button>
            </div>
        </div>
    );
}

// Main component that properly unwraps params with React.use()
export default function CourseEditPage({ params }: { params: { groupId: string, courseId: string } }) {
    // Properly unwrap params with React.use()
    const unwrappedParams = React.use(params);
    const groupId = unwrappedParams.groupId as Id<"groups">;
    const courseId = unwrappedParams.courseId as Id<"courses">;
    
    return (
        <CourseEditErrorBoundary fallback={<div>Something went wrong loading the course editor. Please try again.</div>}>
            <CourseEditPageContent groupId={groupId} courseId={courseId} />
        </CourseEditErrorBoundary>
    );
}