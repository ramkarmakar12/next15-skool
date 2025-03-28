import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.string(),
        profileUrl: v.optional(v.string()),
        about: v.optional(v.string()),
        email: v.string(),
    })
        .index("by_token", ["tokenIdentifier"])
        .index("by_email", ["email"]),
    groups: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        shortDescription: v.optional(v.string()),
        aboutUrl: v.optional(v.string()),
        ownerId: v.id("users"),
        price: v.number(),
        memberNumber: v.number(),
        isPublic: v.optional(v.boolean()), 
        endsOn: v.optional(v.number()),
        subscriptionId: v.optional(v.string()),
        category: v.optional(v.string()), // Added category field
    })
        .index("by_name", ["name"])
        .index("by_ownerId", ["ownerId"])
        .index("by_subscriptionId", ["subscriptionId"])
        .index("by_isPublic", ["isPublic"])
        .index("by_category", ["category"]), // Added index for category
    userGroups: defineTable({
        userId: v.id("users"),
        groupId: v.id("groups"),
    })
        .index("by_userId", ["userId"])
        .index("by_groupId", ["groupId"]),
    invitations: defineTable({
        email: v.string(),
        groupId: v.id("groups"),
        groupName: v.string(),
        inviterId: v.id("users"),
        inviterName: v.string(),
        status: v.string(), 
        emailSent: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_groupId", ["groupId"])
        .index("by_status", ["status"])
        .index("by_email_groupId", ["email", "groupId"]),
    posts: defineTable({
        title: v.string(),
        content: v.string(),
        authorId: v.id("users"),
        groupId: v.id("groups"),
        lessonId: v.optional(v.id("lessons")),
        mediaUrls: v.optional(v.array(v.string())),
        mediaTypes: v.optional(v.array(v.string())), 
        pollId: v.optional(v.id("polls")),
    })
        .index("by_title", ["title"])
        .index("by_groupId", ["groupId"]),
    comments: defineTable({
        postId: v.id("posts"),
        content: v.string(),
        authorId: v.id("users"),
        mediaUrls: v.optional(v.array(v.string())),
        mediaTypes: v.optional(v.array(v.string())), 
    })
        .index("by_postId", ["postId"]),
    likes: defineTable({
        postId: v.id("posts"),
        userId: v.id("users"),
    })
        .index("by_postId", ["postId"])
        .index("by_postId_userId", ["postId", "userId"]),
    courses: defineTable({
        name: v.string(),
        description: v.string(),
        thumbnail: v.optional(v.string()),
        ownerId: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        published: v.boolean(),
        groupId: v.optional(v.id("groups")), // Optional group association
    })
        .index("by_ownerId", ["ownerId"])
        .index("by_groupId", ["groupId"]),
    modules: defineTable({
        title: v.string(),
        courseId: v.id("courses"),
    })
        .index("by_courseId", ["courseId"]),
    lessons: defineTable({
        title: v.string(),
        description: v.string(),
        moduleId: v.id("modules"),
        youtubeUrl: v.string(),
    })
        .index("by_moduleId", ["moduleId"]),
    polls: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        authorId: v.id("users"),
        groupId: v.id("groups"),
        expiresAt: v.optional(v.number()), 
        isMultipleChoice: v.boolean(), 
        isAnonymous: v.boolean(), 
    })
        .index("by_authorId", ["authorId"])
        .index("by_groupId", ["groupId"]),
    pollOptions: defineTable({
        pollId: v.id("polls"),
        text: v.string(),
        imageUrl: v.optional(v.string()),
    })
        .index("by_pollId", ["pollId"]),
    pollVotes: defineTable({
        pollId: v.id("polls"),
        optionId: v.id("pollOptions"),
        userId: v.id("users"),
    })
        .index("by_pollId", ["pollId"])
        .index("by_pollId_userId", ["pollId", "userId"])
        .index("by_optionId", ["optionId"]),
    mediaAttachments: defineTable({
        url: v.string(),
        type: v.string(), 
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        uploaderId: v.id("users"),
        groupId: v.id("groups"),
    })
        .index("by_uploaderId", ["uploaderId"])
        .index("by_groupId", ["groupId"]),
    media: defineTable({
        storageId: v.string(),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        uploaderId: v.id("users"),
        groupId: v.id("groups"),
        url: v.string(),
    })
        .index("by_uploader", ["uploaderId"])
        .index("by_group", ["groupId"])
        .index("by_storageId", ["storageId"]),
    courseModules: defineTable({
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
        order: v.number(), // For ordering modules within a course
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_courseId", ["courseId"])
        .index("by_courseId_order", ["courseId", "order"]),
    courseContents: defineTable({
        moduleId: v.id("courseModules"),
        title: v.string(),
        type: v.string(), // "video", "document", "transcript", "link", "diagram"
        order: v.number(),
        content: v.object({
            // Common fields
            description: v.optional(v.string()),
            
            // Video specific fields
            videoUrl: v.optional(v.string()),
            videoDuration: v.optional(v.number()),
            videoProvider: v.optional(v.string()), // "youtube", "vimeo", "upload"
            
            // Document & diagram specific fields
            fileUrl: v.optional(v.string()),
            fileType: v.optional(v.string()),
            
            // Transcript specific fields
            text: v.optional(v.string()),
            
            // Link specific fields
            url: v.optional(v.string()),
            thumbnailUrl: v.optional(v.string()),
        }),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_moduleId", ["moduleId"])
        .index("by_moduleId_order", ["moduleId", "order"]),
    courseEnrollments: defineTable({
        userId: v.id("users"),
        courseId: v.id("courses"),
        enrolledAt: v.number(),
        completedAt: v.optional(v.number()),
        progress: v.optional(v.number()), // percentage of completion
    })
        .index("by_userId", ["userId"])
        .index("by_courseId", ["courseId"])
        .index("by_userId_courseId", ["userId", "courseId"]),
    courseProgress: defineTable({
        userId: v.id("users"),
        contentId: v.id("courseContents"),
        moduleId: v.id("courseModules"),
        courseId: v.id("courses"),
        completed: v.boolean(),
        lastAccessedAt: v.number(),
        timeSpent: v.optional(v.number()), // in seconds
    })
        .index("by_userId_contentId", ["userId", "contentId"])
        .index("by_userId_courseId", ["userId", "courseId"]),
})