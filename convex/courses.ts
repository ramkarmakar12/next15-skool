import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all courses in a group
export const list = query({
    args: { groupId: v.optional(v.id("groups")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        
        if (args.groupId) {
            // Get courses for a specific group
            return await ctx.db.query("courses")
                .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
                .order("desc")
                .collect();
        } else if (identity) {
            // Get courses created by the current user if no group specified
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            
            if (!user) {
                return [];
            }
            
            return await ctx.db.query("courses")
                .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
                .order("desc")
                .collect();
        }
        
        // Return an empty array for unauthenticated requests without group
        return [];
    }
});

// Create a new course
export const create = mutation({
    args: {
        name: v.optional(v.string()),
        title: v.optional(v.string()), // Add title as an optional field
        description: v.string(),
        groupId: v.optional(v.id("groups")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const timestamp = Date.now();
        
        // Use name if provided, otherwise use title
        const courseName = args.name || args.title;
        
        if (!courseName) {
            throw new Error("Either name or title must be provided");
        }
        
        const courseId = await ctx.db.insert("courses", {
            name: courseName,
            description: args.description,
            ownerId: user._id,
            groupId: args.groupId,
            createdAt: timestamp,
            updatedAt: timestamp,
            published: false
        });

        return courseId;
    }
});

// Get a single course with all its modules and content
export const get = query({
    args: { 
        id: v.id("courses")  // Change from courseId to id to match what the validator expects
    },
    handler: async (ctx, args) => {
        const course = await ctx.db.get(args.id);  // Change from args.courseId to args.id
        if (!course) return null;
        
        // Get all modules for this course
        const modules = await ctx.db.query("courseModules")
            .withIndex("by_courseId", (q) => q.eq("courseId", args.id))  // Change from args.courseId to args.id
            .order("asc")
            .collect();
            
        // For each module, get its content items
        const modulesWithContent = await Promise.all(modules.map(async (moduleItem) => {
            const contents = await ctx.db.query("courseContents")
                .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleItem._id))
                .order("asc")
                .collect();
                
            return { ...moduleItem, contents };
        }));
        
        return { ...course, modules: modulesWithContent };
    }
});

// Update a course
export const update = mutation({
    args: {
        id: v.id("courses"),  // Changed from courseId to id
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        published: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const course = await ctx.db.get(args.id);  // Changed from args.courseId to args.id
        if (!course) {
            return { success: false, error: "Course not found" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can update the course
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can update this course" };
        }

        // Build update object with only the fields that are provided
        const updateData: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.name !== undefined) updateData.name = args.name;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.thumbnail !== undefined) updateData.thumbnail = args.thumbnail;
        if (args.published !== undefined) updateData.published = args.published;

        await ctx.db.patch(args.id, updateData);  // Changed from args.courseId to args.id

        return { success: true };
    }
});

// Delete a course and all its modules and content
export const remove = mutation({
    args: {
        courseId: v.id("courses"),
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
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Only the owner can delete the course
        if (course.ownerId !== user._id) {
            return { success: false, error: "Only the owner can delete this course" };
        }

        // Get all modules
        const modules = await ctx.db.query("courseModules")
            .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
            .collect();

        // Delete all content in each module
        for (const moduleItem of modules) {
            const contents = await ctx.db.query("courseContents")
                .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleItem._id))
                .collect();
                
            // Delete each content item
            for (const content of contents) {
                await ctx.db.delete(content._id);
            }
            
            // Delete the module
            await ctx.db.delete(moduleItem._id);
        }
        
        // Delete course enrollments
        const enrollments = await ctx.db.query("courseEnrollments")
            .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
            .collect();
            
        for (const enrollment of enrollments) {
            await ctx.db.delete(enrollment._id);
        }
        
        // Delete course progress records
        const progressRecords = await ctx.db.query("courseProgress")
            .withIndex("by_userId_courseId")
            .filter((q) => q.eq(q.field("courseId"), args.courseId))
            .collect();
            
        for (const record of progressRecords) {
            await ctx.db.delete(record._id);
        }
        
        // Finally delete the course
        await ctx.db.delete(args.courseId);

        return { success: true };
    }
});