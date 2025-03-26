"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Draggable } from "@hello-pangea/dnd";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { 
  GripVertical, 
  Pencil, 
  Plus, 
  Trash,
  Video,
  FileText,
  ExternalLink,
  FileCode,
  MessageSquare
} from "lucide-react";
import { ModuleEditModal } from "./module-edit-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { ContentList } from "./content-list";
import { AddContentModal } from "./add-content-modal";

interface ModuleItemProps {
  module: Doc<"courseModules">;
  index: number;
  courseId: Id<"courses">;
}

export const ModuleItem = ({
  module,
  index,
  courseId,
}: ModuleItemProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [contentType, setContentType] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteModule = useMutation(api.courseModules.remove);
  
  // Get the content items for this module
  const contents = useQuery(api.courseContents.list, {
    moduleId: module._id,
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteModule({
        moduleId: module._id,
      });

      if (result.success) {
        toast.success("Module deleted");
      } else {
        toast.error(result.error || "Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddContent = (type: string) => {
    setContentType(type);
    setIsAddContentModalOpen(true);
  };

  return (
    <>
      <Draggable draggableId={module._id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="bg-white rounded-lg border shadow-sm"
          >
            <AccordionItem value={module._id} className="border-0">
              <div className="flex items-center px-4 py-2">
                <div
                  className="px-2 py-4 cursor-grab"
                  {...provided.dragHandleProps}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <AccordionTrigger className="flex-1 text-left no-underline hover:no-underline py-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{module.title}</span>
                    {contents === undefined ? (
                      <Spinner size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {contents.length} {contents.length === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <AccordionContent className="pb-4 pt-0">
                <div className="p-4 space-y-4">
                  {module.description && (
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  )}
                  
                  {/* Content List */}
                  <ContentList 
                    moduleId={module._id} 
                    courseId={courseId}
                  />
                  
                  {/* Add Content Options */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContent("video")}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContent("document")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContent("diagram")}
                    >
                      <FileCode className="h-4 w-4 mr-2" />
                      Add Diagram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContent("transcript")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Transcript
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContent("link")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        )}
      </Draggable>
      
      <ModuleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        module={module}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Module"
        description="Are you sure you want to delete this module? This will also delete all content within this module. This action cannot be undone."
      />
      
      <AddContentModal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        moduleId={module._id}
        courseId={courseId}
        contentType={contentType}
      />
    </>
  );
};
