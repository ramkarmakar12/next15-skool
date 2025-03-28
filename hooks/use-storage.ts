import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const storeFileMetadata = useMutation(api.files.storeFileMetadata);

  const uploadImage = async (file: File, groupId: Id<"groups">): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      
      // Get a presigned URL from the backend
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          fileType: file.type,
          groupId
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { uploadUrl } = await response.json();
      
      // Upload the file directly to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }
      
      // Get the storage ID from the upload response
      const { storageId } = await uploadResponse.json();
      
      // Store the file metadata in the database
      const { url } = await storeFileMetadata({
        storageId,
        fileName,
        fileType: file.type,
        fileSize: file.size,
        groupId,
      });
      
      setIsUploading(false);
      return url;
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
      throw error;
    }
  };

  return {
    uploadImage,
    isUploading,
  };
};