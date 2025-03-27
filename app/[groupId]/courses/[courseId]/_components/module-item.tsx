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
  MessageSquare,
  ChevronDown,
  ChevronRight
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
  
  // Add this at the top with other useMutation calls
  const deleteContent = useMutation(api.courseContents.deleteContent);
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

  // Inside the ModuleItem component
  const [expandedContentId, setExpandedContentId] = useState<Id<"courseContents"> | null>(null);
  
  // Add this function to toggle content expansion
  const toggleContentExpand = (contentId: Id<"courseContents">) => {
    if (expandedContentId === contentId) {
      setExpandedContentId(null);
    } else {
      setExpandedContentId(contentId);
    }
  };
  
  // Fix the delete content function
  const handleDeleteContent = async (contentId: Id<"courseContents">) => {
    try {
      const result = await deleteContent({
        contentId
      });
      
      if (result.success) {
        toast.success("Content deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete content");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Something went wrong. Please try again.");
    }
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
                  
                  {/* Content List with expanded view */}
                  <div className="space-y-2">
                    {contents && contents.map((content, index) => (
                      <div key={content._id} className="pl-6 mt-2">
                        <div className="flex items-center group relative">
                          <div className="flex items-center flex-1">
                            <GripVertical className="h-5 w-5 text-slate-500 cursor-grab" />
                            <div className="ml-2 text-sm flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">{content.title}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-2 h-6 w-6 p-0"
                                  onClick={() => toggleContentExpand(content._id)}
                                >
                                  {expandedContentId === content._id ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                </Button>
                              </div>
                              {expandedContentId === content._id && (
                                <div className="mt-2 pl-2 border-l-2 border-slate-200 text-slate-600">
                                  {content.type === "video" && (
                                    <div className="space-y-1">
                                      <p>Video: {content.content.videoUrl}</p>
                                      {content.content.description && <p>Description: {content.content.description}</p>}
                                    </div>
                                  )}
                                  {content.type === "document" && (
                                    <div className="space-y-1">
                                      <p>Document: {content.content.fileUrl}</p>
                                      {content.content.fileType && <p>Type: {content.content.fileType}</p>}
                                    </div>
                                  )}
                                  {content.type === "text" && (
                                    <div className="space-y-1">
                                      <p>{content.content.text}</p>
                                    </div>
                                  )}
                                  {content.type === "link" && (
                                    <div className="space-y-1">
                                      <p>Link: {content.content.url}</p>
                                      {content.content.description && <p>Description: {content.content.description}</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-x-2 opacity-0 group-hover:opacity-100">
                            <Button 
                              onClick={() => handleDeleteContent(content._id)} 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
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
