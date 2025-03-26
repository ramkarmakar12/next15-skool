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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Doc<"courses">;
}

export const CourseSettingsModal = ({
  isOpen,
  onClose,
  course,
}: CourseSettingsModalProps) => {
  const [name, setName] = useState(course.name);
  const [description, setDescription] = useState(course.description || "");
  const [isPublished, setIsPublished] = useState(course.published || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCourse = useMutation(api.courses.update);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!name) {
        toast.error("Course name is required");
        return;
      }

      await updateCourse({
        id: course._id,
        name,
        description,
        published: isPublished,
      });

      toast.success("Course settings updated");
      onClose();
    } catch (error) {
      toast.error("Failed to update course settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Course settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Course name</Label>
            <Input
              placeholder="Course name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label>Course description</Label>
            <Textarea
              placeholder="Course description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={5}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              disabled={isSubmitting}
              id="published"
            />
            <Label htmlFor="published">Published</Label>
          </div>
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
            disabled={isSubmitting || !name}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};