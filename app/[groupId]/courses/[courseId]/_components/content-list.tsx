"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { ContentItem } from "./content-item";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

interface ContentListProps {
  moduleId: Id<"courseModules">;
  courseId: Id<"courses">;
}

export const ContentList = ({ moduleId, courseId }: ContentListProps) => {
  // Get content with graceful error handling
  const contents = useQuery(api.courseContents.list, { moduleId });
  const reorderContent = useMutation(api.courseContents.reorder);
  const [isReordering, setIsReordering] = useState(false);

  const onDragEnd = async (result: DropResult) => {
    if (!contents) return;
    
    // If dropped outside the list or no movement
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    try {
      setIsReordering(true);
      
      // Create a new array of content with the reordered items
      const items = Array.from(contents);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      // Extract just the IDs for the API call
      const contentIds = items.map(content => content._id);
      
      // Call the API to update the order
      const response = await reorderContent({
        moduleId,
        contentIds,
      });
      
      if (!response.success) {
        toast.error(response.error || "Failed to reorder content");
      }
    } catch (error) {
      console.error("Error reordering content:", error);
      toast.error("Something went wrong while reordering content");
    } finally {
      setIsReordering(false);
    }
  };

  if (contents === undefined) {
    return (
      <div className="h-20 flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center p-6 border rounded-md bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No content yet. Add some using the buttons below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isReordering && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-2">Reordering content...</p>
          </div>
        </div>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`content-${moduleId}`}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {contents.map((content, index) => (
                <ContentItem
                  key={content._id}
                  content={content}
                  index={index}
                  moduleId={moduleId}
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
