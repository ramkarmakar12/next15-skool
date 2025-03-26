import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upload media and store metadata
export const createMediaAttachment = mutation({
  args: {
    storageId: v.id("_storage"),
    url: v.string(),
    type: v.string(), // "image", "video", "gif", "document"
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    // Create media attachment record
    const mediaId = await ctx.db.insert("mediaAttachments", {
      url: args.url,
      type: args.type,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploaderId: user._id,
      groupId: args.groupId,
    });

    return { mediaId };
  },
});

// Generate upload URL for client-side upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Generate a storage ID for the file
    const storageId = await ctx.storage.generateUploadUrl();
    return storageId;
  },
});

// List media attachments for a group
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const mediaAttachments = await ctx.db
      .query("mediaAttachments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const mediaWithUploaders = await Promise.all(
      mediaAttachments.map(async (media) => {
        const uploader = await ctx.db.get(media.uploaderId);
        return {
          ...media,
          uploader,
        };
      })
    );

    return mediaWithUploaders;
  },
});

// Get media attachment by ID
export const getById = query({
  args: { mediaId: v.id("mediaAttachments") },
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.mediaId);
    if (!media) {
      return null;
    }

    const uploader = await ctx.db.get(media.uploaderId);
    return {
      ...media,
      uploader,
    };
  },
});

// Delete media attachment
export const remove = mutation({
  args: { mediaId: v.id("mediaAttachments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    const media = await ctx.db.get(args.mediaId);
    if (!media) {
      return null;
    }

    // Check if user is the uploader
    if (media.uploaderId !== user._id) {
      throw new Error("You don't have permission to delete this media");
    }

    // Delete the media
    await ctx.db.delete(args.mediaId);

    return { success: true };
  },
});
