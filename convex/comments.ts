import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const add = mutation({
    args: {
        postId: v.id("posts"),
        content: v.string(),
        mediaUrls: v.optional(v.array(v.string())),
        mediaTypes: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return null;
        }

        // Make sure we're a member of the group to add a comment
        const post = await ctx.db.get(args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        // Check media fields are consistent
        if ((args.mediaUrls && !args.mediaTypes) || (!args.mediaUrls && args.mediaTypes)) {
            throw new Error("Both mediaUrls and mediaTypes must be provided or neither");
        }

        if (args.mediaUrls && args.mediaTypes && args.mediaUrls.length !== args.mediaTypes.length) {
            throw new Error("mediaUrls and mediaTypes must have the same length");
        }

        // Get the user object to access the correct ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        return await ctx.db.insert("comments", {
            content: args.content,
            postId: args.postId,
            authorId: user._id,
            mediaUrls: args.mediaUrls,
            mediaTypes: args.mediaTypes,
        });
    },
});

export const remove = mutation({
    args: {
        id: v.id("comments"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return null;
        }

        const comment = await ctx.db.get(args.id);

        if (!comment) {
            throw new Error("Comment not found");
        }

        // Get the user object to check ownership
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || comment.authorId !== user._id) {
            throw new Error("Not authorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return [];
        }

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_postId", (q) => q.eq("postId", args.postId))
            .order("desc")
            .collect();

        return comments;
    },
});