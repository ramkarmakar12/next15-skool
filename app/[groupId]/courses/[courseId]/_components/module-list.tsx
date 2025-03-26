"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { ModuleItem } from "./module-item";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useMutation } from "convex/react";
import { toast } from "sonner";

interface ModuleListProps {
  courseId: Id<"courses">;
}

export const ModuleList = ({ courseId }: ModuleListProps) => {
  // Get course modules with proper error handling
  const modules = useQuery(api.courseModules.list, { courseId });
  const reorderModules = useMutation(api.courseModules.reorder);
  const [isReordering, setIsReordering] = useState(false);

  const onDragEnd = async (result: DropResult) => {
    if (!modules) return;
    
    // If dropped outside the list or no movement
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    try {
      setIsReordering(true);
      
      // Create a new array of modules with the reordered modules
      const items = Array.from(modules);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      // Extract just the IDs for the API call
      const moduleIds = items.map(module => module._id);
      
      // Call the API to update the order
      const response = await reorderModules({
        courseId,
        moduleIds,
      });
      
      if (!response.success) {
        toast.error(response.error || "Failed to reorder modules");
      }
    } catch (error) {
      console.error("Error reordering modules:", error);
      toast.error("Something went wrong while reordering modules");
    } finally {
      setIsReordering(false);
    }
  };

  if (modules === undefined) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center p-12 border rounded-md">
        <h3 className="text-lg font-medium mb-2">No modules yet</h3>
        <p className="text-muted-foreground">
          Add your first module to get started building your course
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isReordering && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-2">Reordering modules...</p>
          </div>
        </div>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="modules">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {modules.map((module, index) => (
                <ModuleItem
                  key={module._id}
                  module={module}
                  index={index}
                  courseId={courseId}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
