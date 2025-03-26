"use client";

import { Id } from "@/convex/_generated/dataModel";
import { BookCheck, Component, Fullscreen, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// ModuleNameEditor needs to be updated to work with courseModules
interface ModuleNameEditorProps {
  name: string;
}

// Simple placeholder component until the proper editor is updated
const ModuleNameEditor = ({ name }: ModuleNameEditorProps) => {
  return <span className="font-semibold">{name}</span>;
};

// Create a client component wrapper to handle the params
function CourseEditPageContent({ groupId, courseId }: { groupId: string, courseId: string }) {
    // Cast the parameters to the correct types
    const typedCourseId = courseId as unknown as Id<"courses">;
    const typedGroupId = groupId as unknown as Id<"groups">;
    
    // Use the new course API with courseId parameter
    const course = useQuery(api.courses.get, { courseId: typedCourseId });
    const updateCourse = useMutation(api.courses.update);
    
    const currentUser = useQuery(api.users.currentUser, {});
    const group = useQuery(api.groups.get, { id: typedGroupId });
    const router = useRouter();
    
    // Use the new course modules API
    const modules = useQuery(api.courseModules.list, { courseId: typedCourseId });
    const addModule = useMutation(api.courseModules.create);
    const removeModule = useMutation(api.courseModules.remove);

    if (course === undefined || modules === undefined) {
        return <div>Loading...</div>;
    }

    if (course === null) {
        return <div>Course not found</div>;
    }

    const handleEditClick = () => {
        router.push(`/${typedGroupId}/classroom/${typedCourseId}`);
    }

    const handleTitleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateCourse({ 
            courseId: typedCourseId,
            name: e.target.value 
        });
    }

    const handleAddModule = () => {
        addModule({ 
            courseId: typedCourseId,
            title: "New Module" 
        });
    }

    const handleRemoveModule = (moduleId: Id<"courseModules">) => {
        removeModule({ moduleId });
    }

    const isOwner = currentUser?._id === group?.ownerId;

    if (!isOwner) return <div>Unauthorized</div>;

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
                                name={module.title}
                                key={module._id}
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
                            onClick={() => router.push(`/${typedGroupId}/courses/${typedCourseId}`)}
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
                    onClick={() => router.push(`/${typedGroupId}/courses/${typedCourseId}`)}
                >
                    Go to New Course Builder
                </Button>
            </div>
            <div className="flex-grow md:w-3/4 rounded-xl bg-gray-50 shadow-md p-4">
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                        Content editing has moved to the new course builder. Please click on &quot;Go to New Course Builder&quot; to use the updated interface.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Use the Next.js 14 pattern with React.use() as recommended
export default function CourseEditPage(props: { 
    params: { groupId: string; courseId: string; }
}) {
    // We need to use this try-catch pattern to handle the params Promise properly
    try {
        // This handles the Promise nature of params in Next.js 14
        const resolvedParams = React.use(props.params);
        return <CourseEditPageContent 
            groupId={resolvedParams.groupId} 
            courseId={resolvedParams.courseId} 
        />;
    } catch (error) {
        // This handles any error during params resolution
        console.error("Error resolving params:", error);
        return <div>Error loading page parameters</div>;
    }
}