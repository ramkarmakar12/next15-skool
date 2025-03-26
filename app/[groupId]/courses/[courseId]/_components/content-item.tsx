"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Grip, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

interface ContentItemProps {
  content: Doc<"courseContents">;
  index: number;
  moduleId: string;
}

export const ContentItem = ({
  content,
  index,
  moduleId
}: ContentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(content.title);
  
  const updateContent = useMutation(api.courseContents.update);
  const deleteContent = useMutation(api.courseContents.remove);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(content.title);
  };

  const handleSave = async () => {
    try {
      await updateContent({
        id: content._id,
        title
      });
      
      setIsEditing(false);
      toast.success("Content updated");
    } catch (error) {
      toast.error("Failed to update content");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContent({
        id: content._id
      });
      
      toast.success("Content deleted");
    } catch (error) {
      toast.error("Failed to delete content");
    }
  };

  return (
    <Draggable
      draggableId={content._id}
      index={index}
    >
      {(provided) => (
        <div
          className={cn(
            "flex items-center gap-x-2 bg-slate-100 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
            isEditing && "bg-slate-200"
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div
            className="px-2 py-3 hover:bg-slate-200 rounded-l-md transition"
            {...provided.dragHandleProps}
          >
            <Grip className="h-5 w-5" />
          </div>
          {isEditing ? (
            <div className="flex-1 flex items-center gap-x-2">
              <input
                className="flex-1 bg-transparent px-2 py-1 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex items-center gap-x-2 mr-2">
                <button 
                  onClick={handleSave}
                  className="text-xs bg-sky-700 text-white py-1 px-2 rounded-md hover:bg-sky-800 transition"
                >
                  Save
                </button>
                <button 
                  onClick={handleCancel}
                  className="text-xs bg-slate-600 text-white py-1 px-2 rounded-md hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 px-2 py-3">
                {content.title}
              </div>
              <div className="flex items-center gap-x-2 mr-2">
                <button 
                  onClick={handleEdit}
                  className="hover:opacity-75 transition"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="hover:opacity-75 transition text-rose-500"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
};