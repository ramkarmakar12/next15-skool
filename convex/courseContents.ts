import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx, DatabaseReader } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Define proper types for context and database
interface ConvexContext {
  auth: { 
    getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> 
  };
  db: DatabaseReader;
}

// Define types for data models
export type User = {
  _id: Id<"users">;
  tokenIdentifier: string;
  name: string;
  email: string;
};

export type CourseModule = {
  _id: Id<"courseModules">;
  courseId: Id<"courses">;
  title: string;
  description: string;
  order: number;
};

export type Course = {
  _id: Id<"courses">;
  title: string;
  ownerId: Id<"users">;
};

// Fix the CourseContent type to make fields optional
export type CourseContent = {
  _id: Id<"courseContents">;
  moduleId: Id<"courseModules">;
  title: string;
  type: string;
  order: number;
  content: {
    description?: string;
    videoUrl?: string;
    videoDuration?: number | null;
    videoProvider?: string | null;
    fileUrl?: string;
    fileType?: string;
    text?: string;
    url?: string;
    thumbnailUrl?: string | null;
  };
  createdAt: number;
  updatedAt: number;
};

// Constants for content types
export const CONTENT_TYPES = {
    VIDEO: "video",
    DOCUMENT: "document",
    DIAGRAM: "diagram",
    TRANSCRIPT: "transcript",
    LINK: "link",
};

// List all content for a module
export const list = query({
    args: { moduleId: v.id("courseModules") },
    handler: async (ctx: QueryCtx, args: { moduleId: Id<"courseModules"> }) => {
        return await ctx.db.query("courseContents")
            .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
            .order("asc")
            .collect();
    }
});

// Get a single content item
export const get = query({
    args: { contentId: v.id("courseContents") },
    handler: async (ctx: QueryCtx, args: { contentId: Id<"courseContents"> }) => {
        return await ctx.db.get(args.contentId);
    }
});

// Helper function to get the maximum order number for content in a module
async function getMaxContentOrder(ctx: any, moduleId: Id<"courseModules">) {
    const existingContent = await ctx.db.query("courseContents")
        .withIndex("by_moduleId", (q: any) => q.eq("moduleId", moduleId))
        .collect();
    
    // Fix the reduce function to properly handle the order
    return existingContent.reduce((max: number, content: any) =>
        Math.max(max, content.order || 0), 0);
}

// Helper function to authenticate and authorize the user
async function authenticateAndAuthorize(ctx: any, moduleId: Id<"courseModules">) {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
        return { success: false, error: "Authentication required" };
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();

    if (!user) {
        return { success: false, error: "User not found" };
    }

    // Get module to check permissions
    const courseModule = await ctx.db.get(moduleId);
    
    if (!courseModule) {
        return { success: false, error: "Module not found" };
    }

    const course = await ctx.db.get(courseModule.courseId);
    if (!course) {
        return { success: false, error: "Course not found" };
    }

    // Only the owner can modify content
    if (course.ownerId !== user._id) {
        return { success: false, error: "Only the owner can modify content in this course" };
    }

    return { success: true, user, course, courseModule };
}

// Create a new video content
export const createVideo = mutation({
    args: {
        moduleId: v.id("courseModules"),
        title: v.string(),
        description: v.optional(v.string()),
        videoUrl: v.string(),
        videoDuration: v.optional(v.number()),
        videoProvider: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            // Authenticate and authorize the user
            await authenticateAndAuthorize(ctx, args.moduleId);
            
            // Get the highest order number to place this at the end
            const maxOrder = await getMaxContentOrder(ctx, args.moduleId);
            
            const timestamp = Date.now();
            
            // Fix the videoDuration type
            const contentId = await ctx.db.insert("courseContents", {
                moduleId: args.moduleId,
                title: args.title,
                type: CONTENT_TYPES.VIDEO,
                order: maxOrder + 1,
                content: {
                    description: args.description || "",
                    videoUrl: args.videoUrl,
                    videoDuration: args.videoDuration, // Remove the null fallback
                    videoProvider: args.videoProvider || "youtube",
                },
                createdAt: timestamp,
                updatedAt: timestamp,
            });
            
            return { success: true, contentId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
});

// Create a new document/diagram content
export const createDocument = mutation({
    args: {
        moduleId: v.id("courseModules"),
        title: v.string(),
        description: v.optional(v.string()),
        fileUrl: v.string(),
        fileType: v.string(), // "document" or "diagram"
    },
    handler: async (ctx: MutationCtx, args: {
        moduleId: Id<"courseModules">,
        title: string,
        description: string | undefined,
        fileUrl: string,
        fileType: string,
    }) => {
        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, args.moduleId);
        if (!result.success) {
            return result;
        }

        // Get the highest order number to place this at the end
        const maxOrder = await getMaxContentOrder(ctx, args.moduleId);
        
        const timestamp = Date.now();
        
        // Set the correct content type based on fileType
        const contentType = args.fileType === "diagram" 
            ? CONTENT_TYPES.DIAGRAM 
            : CONTENT_TYPES.DOCUMENT;
        
        const contentId = await ctx.db.insert("courseContents", {
            moduleId: args.moduleId,
            title: args.title,
            type: contentType,
            order: maxOrder + 1,
            content: {
                description: args.description || "",
                fileUrl: args.fileUrl,
                fileType: args.fileType,
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return { success: true, contentId };
    }
});

// Create a new transcript content
export const createTranscript = mutation({
    args: {
        moduleId: v.id("courseModules"),
        title: v.string(),
        description: v.optional(v.string()),
        text: v.string(),
    },
    handler: async (ctx: MutationCtx, args: {
        moduleId: Id<"courseModules">,
        title: string,
        description: string | undefined,
        text: string,
    }) => {
        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, args.moduleId);
        if (!result.success) {
            return result;
        }

        // Get the highest order number to place this at the end
        const maxOrder = await getMaxContentOrder(ctx, args.moduleId);
        
        const timestamp = Date.now();
        
        const contentId = await ctx.db.insert("courseContents", {
            moduleId: args.moduleId,
            title: args.title,
            type: CONTENT_TYPES.TRANSCRIPT,
            order: maxOrder + 1,
            content: {
                description: args.description || "",
                text: args.text,
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return { success: true, contentId };
    }
});

// Create a new link content
export const createLink = mutation({
    args: {
        moduleId: v.id("courseModules"),
        title: v.string(),
        description: v.optional(v.string()),
        url: v.string(),
        thumbnailUrl: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: {
        moduleId: Id<"courseModules">,
        title: string,
        description: string | undefined,
        url: string,
        thumbnailUrl: string | undefined,
    }) => {
        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, args.moduleId);
        if (!result.success) {
            return result;
        }

        // Get the highest order number to place this at the end
        const maxOrder = await getMaxContentOrder(ctx, args.moduleId);
        
        const timestamp = Date.now();
        
        const contentId = await ctx.db.insert("courseContents", {
            moduleId: args.moduleId,
            title: args.title,
            type: CONTENT_TYPES.LINK,
            order: maxOrder + 1,
            content: {
                description: args.description || "",
                url: args.url,
                thumbnailUrl: args.thumbnailUrl,
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return { success: true, contentId };
    }
});

// Update content (common fields)
export const update = mutation({
    args: {
        contentId: v.id("courseContents"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: {
        contentId: Id<"courseContents">,
        title: string | undefined,
        description: string | undefined,
    }) => {
        const content = await ctx.db.get(args.contentId);
        if (!content) {
            return { success: false, error: "Content not found" };
        }

        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, content.moduleId);
        if (!result.success) {
            return result;
        }

        const updateData: Record<string, unknown> = { updatedAt: Date.now() };
        const contentUpdate: Record<string, unknown> = { ...content.content };
        
        // Update main title if provided
        if (args.title !== undefined) {
            updateData.title = args.title;
        }
        
        // Update description if provided
        if (args.description !== undefined) {
            contentUpdate.description = args.description;
            updateData.content = contentUpdate;
        }

        await ctx.db.patch(args.contentId, updateData);

        return { success: true };
    }
});

// Update video content specific fields
export const updateVideo = mutation({
    args: {
        contentId: v.id("courseContents"),
        videoUrl: v.optional(v.string()),
        videoDuration: v.optional(v.number()),
        videoProvider: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: {
        contentId: Id<"courseContents">,
        videoUrl: string | undefined,
        videoDuration: number | undefined,
        videoProvider: string | undefined,
    }) => {
        const content = await ctx.db.get(args.contentId);
        if (!content) {
            return { success: false, error: "Content not found" };
        }

        // Check if this is a video content
        if (content.type !== CONTENT_TYPES.VIDEO) {
            return { success: false, error: "This content is not a video" };
        }

        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, content.moduleId);
        if (!result.success) {
            return result;
        }

        const contentUpdate: Record<string, unknown> = { ...content.content };
        
        // Update fields if provided
        if (args.videoUrl !== undefined) contentUpdate.videoUrl = args.videoUrl;
        if (args.videoDuration !== undefined) contentUpdate.videoDuration = args.videoDuration;
        if (args.videoProvider !== undefined) contentUpdate.videoProvider = args.videoProvider;

        await ctx.db.patch(args.contentId, { 
            content: contentUpdate,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

// Update document content specific fields
export const updateDocument = mutation({
    args: {
        contentId: v.id("courseContents"),
        fileUrl: v.optional(v.string()),
        fileType: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: {
        contentId: Id<"courseContents">,
        fileUrl: string | undefined,
        fileType: string | undefined,
    }) => {
        const content = await ctx.db.get(args.contentId);
        if (!content) {
            return { success: false, error: "Content not found" };
        }

        // Check if this is a document or diagram content
        if (content.type !== CONTENT_TYPES.DOCUMENT && content.type !== CONTENT_TYPES.DIAGRAM) {
            return { success: false, error: "This content is not a document or diagram" };
        }

        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, content.moduleId);
        if (!result.success) {
            return result;
        }

        const contentUpdate: Record<string, unknown> = { ...content.content };
        
        // Update fields if provided
        if (args.fileUrl !== undefined) contentUpdate.fileUrl = args.fileUrl;
        if (args.fileType !== undefined) {
            contentUpdate.fileType = args.fileType;
            // Update content type if file type changed to diagram
            if (args.fileType === "diagram" && content.type !== CONTENT_TYPES.DIAGRAM) {
                await ctx.db.patch(args.contentId, { type: CONTENT_TYPES.DIAGRAM });
            } 
            // Update content type if file type changed to document
            else if (args.fileType !== "diagram" && content.type !== CONTENT_TYPES.DOCUMENT) {
                await ctx.db.patch(args.contentId, { type: CONTENT_TYPES.DOCUMENT });
            }
        }

        await ctx.db.patch(args.contentId, { 
            content: contentUpdate,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

// Update transcript content specific fields
export const updateTranscript = mutation({
    args: {
        contentId: v.id("courseContents"),
        text: v.string(),
    },
    handler: async (ctx: MutationCtx, args: {
        contentId: Id<"courseContents">,
        text: string,
    }) => {
        const content = await ctx.db.get(args.contentId);
        if (!content) {
            return { success: false, error: "Content not found" };
        }

        // Check if this is a transcript content
        if (content.type !== CONTENT_TYPES.TRANSCRIPT) {
            return { success: false, error: "This content is not a transcript" };
        }

        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, content.moduleId);
        if (!result.success) {
            return result;
        }

        const contentUpdate: Record<string, unknown> = { ...content.content };
        contentUpdate.text = args.text;

        await ctx.db.patch(args.contentId, { 
            content: contentUpdate,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

// Update link content specific fields
export const updateLink = mutation({
    args: {
        contentId: v.id("courseContents"),
        url: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
    },
    handler: async (ctx: MutationCtx, args: {
        contentId: Id<"courseContents">,
        url: string | undefined,
        thumbnailUrl: string | undefined,
    }) => {
        const content = await ctx.db.get(args.contentId);
        if (!content) {
            return { success: false, error: "Content not found" };
        }

        // Check if this is a link content
        if (content.type !== CONTENT_TYPES.LINK) {
            return { success: false, error: "This content is not a link" };
        }

        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, content.moduleId);
        if (!result.success) {
            return result;
        }

        const contentUpdate: Record<string, unknown> = { ...content.content };
        
        // Update fields if provided
        if (args.url !== undefined) contentUpdate.url = args.url;
        if (args.thumbnailUrl !== undefined) contentUpdate.thumbnailUrl = args.thumbnailUrl;

        await ctx.db.patch(args.contentId, { 
            content: contentUpdate,
            updatedAt: Date.now()
        });

        return { success: true };
    }
});

// Reorder content in a module
export const reorder = mutation({
    args: {
        moduleId: v.id("courseModules"),
        contentIds: v.array(v.id("courseContents")),
    },
    handler: async (ctx: MutationCtx, args: {
        moduleId: Id<"courseModules">,
        contentIds: Id<"courseContents">[],
    }) => {
        // Authenticate and authorize the user
        const result = await authenticateAndAuthorize(ctx, args.moduleId);
        if (!result.success) {
            return result;
        }

        // Update the order of each content item
        for (let i = 0; i < args.contentIds.length; i++) {
            await ctx.db.patch(args.contentIds[i], { 
                order: i + 1,
                updatedAt: Date.now()
            });
        }

        return { success: true };
    }
});

// Delete content
// Add this mutation to your courseContents.ts file if it doesn't exist

export const deleteContent = mutation({
  args: { contentId: v.id("courseContents") },
  handler: async (ctx, args) => {
    try {
      const content = await ctx.db.get(args.contentId);
      
      if (!content) {
        return { success: false, error: "Content not found" };
      }
      
      // Get the module to check permissions
      const module = await ctx.db.get(content.moduleId);
      if (!module) {
        return { success: false, error: "Module not found" };
      }
      
      // Authenticate and authorize the user
      const auth = await authenticateAndAuthorize(ctx, content.moduleId);
      if (!auth.success) {
        return { success: false, error: auth.error };
      }
      
      // Delete the content
      await ctx.db.delete(args.contentId);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
});

// Remove the duplicate reorder function at the end of the file
// Add a general create function that can handle different content types

export const create = mutation({
  args: {
    moduleId: v.id("courseModules"),
    title: v.string(),
    type: v.string(),
    content: v.object({
      description: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      videoDuration: v.optional(v.number()),
      videoProvider: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      fileType: v.optional(v.string()),
      text: v.optional(v.string()),
      url: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Authenticate and authorize the user
      const auth = await authenticateAndAuthorize(ctx, args.moduleId);
      if (!auth.success) {
        return { success: false, error: auth.error };
      }
      
      // Get the highest order number to place this at the end
      const maxOrder = await getMaxContentOrder(ctx, args.moduleId);
      
      const timestamp = Date.now();
      
      const contentId = await ctx.db.insert("courseContents", {
        moduleId: args.moduleId,
        title: args.title,
        type: args.type,
        order: maxOrder + 1,
        content: args.content,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      
      return { success: true, contentId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
});

// Get all content items for a course
export const listAll = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // First get all modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
    
    // Get all moduleIds
    const moduleIds = modules.map(module => module._id);
    
    // If no modules found, return empty array
    if (moduleIds.length === 0) {
      return [];
    }
    
    // Then get all content items for these modules
    // We'll fetch content for each module separately and combine results
    let contents: CourseContent[] = [];
    
    for (const moduleId of moduleIds) {
      const moduleContents = await ctx.db
        .query("courseContents")
        .filter((q) => q.eq(q.field("moduleId"), moduleId))
        .order("asc")
        .collect();
      
      contents = [...contents, ...moduleContents];
    }
    
    return contents;
  },
});
