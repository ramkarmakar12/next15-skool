"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: Id<"courseModules">;
}

// Define content types
const CONTENT_TYPES = {
  VIDEO: "video",
  DOCUMENT: "document",
  TEXT: "text",
  LINK: "link",
};

export const AddContentModal = ({
  isOpen,
  onClose,
  moduleId,
}: AddContentModalProps) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add content type state
  const [contentType, setContentType] = useState(CONTENT_TYPES.TEXT);
  
  // Add content-specific fields
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const createContent = useMutation(api.courseContents.create);
  
  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
  
      if (!title) {
        toast.error("Content title is required");
        return;
      }
      
      // Validate content based on type
      if (contentType === CONTENT_TYPES.VIDEO && !videoUrl) {
        toast.error("Video URL is required");
        return;
      }
      
      if (contentType === CONTENT_TYPES.LINK && !url) {
        toast.error("URL is required");
        return;
      }
  
      // Create the content with the appropriate type and data
      const result = await createContent({
        moduleId,
        title,
        type: contentType,
        content: {
          description: description || "",
          videoUrl: videoUrl || "",
          fileUrl: fileUrl || "",
          fileType: fileType || "",
          text: text || "",
          url: url || "",
        },
      });
  
      if (result.success) {
        toast.success("Content added successfully");
        onClose();
        
        // Reset form
        setTitle("");
        setDescription("");
        setVideoUrl("");
        setFileUrl("");
        setFileType("");
        setText("");
        setUrl("");
      } else {
        toast.error(result.error || "Failed to add content");
      }
    } catch (error) {
      console.error("Error adding content:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add content</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Content title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
          
          <Tabs defaultValue={CONTENT_TYPES.TEXT} onValueChange={(value) => setContentType(value)}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value={CONTENT_TYPES.TEXT}>Text</TabsTrigger>
              <TabsTrigger value={CONTENT_TYPES.VIDEO}>Video</TabsTrigger>
              <TabsTrigger value={CONTENT_TYPES.DOCUMENT}>Document</TabsTrigger>
              <TabsTrigger value={CONTENT_TYPES.LINK}>Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value={CONTENT_TYPES.TEXT}>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  placeholder="Enter text content here..." 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                />
              </div>
            </TabsContent>
            
            <TabsContent value={CONTENT_TYPES.VIDEO}>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Label>Description (optional)</Label>
                <Textarea 
                  placeholder="Video description..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value={CONTENT_TYPES.DOCUMENT}>
              <div className="space-y-2">
                <Label>Document URL</Label>
                <Input 
                  placeholder="https://docs.google.com/..." 
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <Label>Document Type</Label>
                <Input 
                  placeholder="PDF, DOCX, etc." 
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value={CONTENT_TYPES.LINK}>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input 
                  placeholder="https://..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Label>Description (optional)</Label>
                <Textarea 
                  placeholder="Link description..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !title}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};