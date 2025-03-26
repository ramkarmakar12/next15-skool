import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { FileUp, X, Film, Paperclip } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  onMediaAdded: (urls: string[], types: string[]) => void;
  onMediaRemoved?: (index: number) => void;
  existingMediaUrls?: string[];
  existingMediaTypes?: string[];
  groupId: Id<"groups">;
  maxFiles?: number;
  className?: string;
}

export const MediaUpload = ({
  onMediaAdded,
  onMediaRemoved,
  existingMediaUrls = [],
  existingMediaTypes = [],
  groupId,
  maxFiles = 5,
  className,
}: MediaUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingMediaUrls || []);
  const [mediaTypes, setMediaTypes] = useState<string[]>(existingMediaTypes || []);
  
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMediaAttachment = useMutation(api.media.createMediaAttachment);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    if (previewUrls.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: string[] = [];
      
      for (const file of files) {
        // Determine file type
        let fileType = 'image';
        if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type === 'image/gif') fileType = 'gif';
        else if (!file.type.startsWith('image/')) fileType = 'document';
        
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        if (!uploadUrl) continue;
        
        // Upload the file
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        
        if (!result.ok) {
          throw new Error(`Failed to upload file: ${await result.text()}`);
        }
        
        // Get the URL where the file is stored
        const { storageId } = await result.json();
        
        // Create a media attachment record in the database
        void await createMediaAttachment({
          storageId,
          url: URL.createObjectURL(file), // Use the client-side URL for preview
          type: fileType,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          groupId,
        });
        
        uploadedUrls.push(URL.createObjectURL(file)); // For preview
        uploadedTypes.push(fileType);
      }

      const newUrls = [...previewUrls, ...uploadedUrls];
      const newTypes = [...mediaTypes, ...uploadedTypes];
      
      setPreviewUrls(newUrls);
      setMediaTypes(newTypes);
      onMediaAdded(uploadedUrls, uploadedTypes);
      
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [previewUrls, mediaTypes, maxFiles, generateUploadUrl, createMediaAttachment, onMediaAdded, groupId]);

  const handleRemove = (index: number) => {
    const newPreviewUrls = [...previewUrls];
    const newMediaTypes = [...mediaTypes];
    
    newPreviewUrls.splice(index, 1);
    newMediaTypes.splice(index, 1);
    
    setPreviewUrls(newPreviewUrls);
    setMediaTypes(newMediaTypes);
    
    if (onMediaRemoved) {
      onMediaRemoved(index);
    }
  };

  const renderPreview = (url: string, type: string, index: number) => {
    if (type === 'image' || type === 'gif') {
      return (
        <div key={index} className="relative group w-24 h-24 rounded-md overflow-hidden">
          <Image 
            src={url}
            alt="Media preview"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
          <button
            onClick={() => handleRemove(index)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      );
    } else if (type === 'video') {
      return (
        <div key={index} className="relative group w-24 h-24 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
          <Film className="w-10 h-10 text-gray-500" />
          <button
            onClick={() => handleRemove(index)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      );
    } else {
      return (
        <div key={index} className="relative group w-24 h-24 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
          <Paperclip className="w-10 h-10 text-gray-500" />
          <button
            onClick={() => handleRemove(index)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {previewUrls.map((url, index) => renderPreview(url, mediaTypes[index], index))}
      </div>
      
      {previewUrls.length < maxFiles && (
        <div className="flex items-center">
          <input
            type="file"
            id="media-upload"
            className="hidden"
            multiple
            onChange={handleUpload}
            accept="image/*,video/*,.gif,.pdf,.doc,.docx"
            disabled={isUploading}
          />
          <label htmlFor="media-upload">
            <Button 
              variant="outline" 
              size="sm" 
              type="button" 
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <div>
                <FileUp className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Add Media'}
              </div>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};
