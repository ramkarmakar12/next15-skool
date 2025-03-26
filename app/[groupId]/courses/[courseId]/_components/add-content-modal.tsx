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

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: Id<"courseModules">;
}

export const AddContentModal = ({
  isOpen,
  onClose,
  moduleId,
}: AddContentModalProps) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createContent = useMutation(api.courseContents.create);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!title) {
        toast.error("Content title is required");
        return;
      }

      await createContent({
        title,
        moduleId,
      });

      toast.success("Content added");
      onClose();
      setTitle("");
    } catch (error) {
      toast.error("Failed to add content");
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
      <DialogContent>
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