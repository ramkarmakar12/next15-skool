"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ModuleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Doc<"courseModules">;
}

export const ModuleEditModal = ({
  isOpen,
  onClose,
  module,
}: ModuleEditModalProps) => {
  const [title, setTitle] = useState(module.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateModule = useMutation(api.courseModules.update);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!title) {
        toast.error("Module title is required");
        return;
      }

      await updateModule({
        id: module._id,
        title,
      });

      toast.success("Module updated");
      onClose();
    } catch (error) {
      toast.error("Failed to update module");
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
          <DialogTitle>Edit module</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Module title"
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
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};