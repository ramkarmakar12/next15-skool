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

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: Id<"courses">;
}

export const CreateModuleModal = ({
  isOpen,
  onClose,
  courseId,
}: CreateModuleModalProps) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createModule = useMutation(api.courseModules.create);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!title) {
        toast.error("Module title is required");
        return;
      }

      await createModule({
        title,
        courseId,
      });

      toast.success("Module created");
      onClose();
      setTitle("");
    } catch (error) {
      toast.error("Failed to create module");
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
          <DialogTitle>Create new module</DialogTitle>
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
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};