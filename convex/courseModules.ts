import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List all modules for a course
export const list = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        return await ctx.db.query("courseModules")
            .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
            .order("asc")
            .collect();
    }
});

// Create a new module
export const create = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const course = await ctx.db.get(args.courseId);
        if (!course) {
            return { success: false, error: "Course not found" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can add modules
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can add modules to this course" };
        }

        // Get the highest order number to place this at the end
        const existingModules = await ctx.db.query("courseModules")
            .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
            .order("asc")
            .collect();
        
        const maxOrder = existingModules.reduce((max, courseModule) => 
            Math.max(max, courseModule.order || 0), 0);
        
        const timestamp = Date.now();
        
        const moduleId: Id<"courseModules"> = await ctx.db.insert("courseModules", {
            courseId: args.courseId,
            title: args.title,
            description: args.description || "",
            order: maxOrder + 1,
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        return { success: true, moduleId };
    }
});

// Update a module
export const update = mutation({
    args: {
        moduleId: v.id("courseModules"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const courseModule = await ctx.db.get(args.moduleId);
        if (!courseModule) {
            throw new Error("Module not found");
        }

        const course = await ctx.db.get(courseModule.courseId);
        if (!course) {
            return { success: false, error: "Course not found" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can update modules
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can update modules in this course" };
        }

        // Build update object with only the fields that are provided
        const updateData: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.title !== undefined) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;

        await ctx.db.patch(args.moduleId, updateData);

        return { success: true };
    }
});

// Reorder modules in a course
export const reorder = mutation({
    args: {
        courseId: v.id("courses"),
        moduleIds: v.array(v.id("courseModules")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const course = await ctx.db.get(args.courseId);
        if (!course) {
            return { success: false, error: "Course not found" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can reorder modules
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can reorder modules in this course" };
        }

        // Update the order of each module
        for (let i = 0; i < args.moduleIds.length; i++) {
            await ctx.db.patch(args.moduleIds[i], { order: i + 1, updatedAt: Date.now() });
        }

        return { success: true };
    }
});

// Delete a module
export const remove = mutation({
    args: {
        moduleId: v.id("courseModules"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const courseModule = await ctx.db.get(args.moduleId);
        if (!courseModule) {
            throw new Error("Module not found");
        }

        const course = await ctx.db.get(courseModule.courseId);
        if (!course) {
            return { success: false, error: "Course not found" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can delete modules
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can delete modules in this course" };
        }

        // Delete all content in this module first
        const contents = await ctx.db.query("courseContents")
            .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
            .collect();
            
        for (const content of contents) {
            await ctx.db.delete(content._id);
        }
        
        // Delete the module
        await ctx.db.delete(args.moduleId);

        // Reorder remaining modules
        const remainingModules = await ctx.db.query("courseModules")
            .withIndex("by_courseId", (q) => q.eq("courseId", courseModule.courseId))
            .order("asc")
            .collect();
            
        for (let i = 0; i < remainingModules.length; i++) {
            await ctx.db.patch(remainingModules[i]._id, { order: i + 1 });
        }

        return { success: true };
    }
});
