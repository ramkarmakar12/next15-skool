import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new poll
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    groupId: v.id("groups"),
    options: v.array(
      v.object({
        text: v.string(),
        imageUrl: v.optional(v.string()),
      })
    ),
    isMultipleChoice: v.boolean(),
    isAnonymous: v.boolean(),
    expiresAt: v.optional(v.number()),
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

    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      authorId: user._id,
      groupId: args.groupId,
      isMultipleChoice: args.isMultipleChoice,
      isAnonymous: args.isAnonymous,
      expiresAt: args.expiresAt,
    });

    // Create poll options
    const optionIds = await Promise.all(
      args.options.map(async (option) => {
        return await ctx.db.insert("pollOptions", {
          pollId,
          text: option.text,
          imageUrl: option.imageUrl,
        });
      })
    );

    return { pollId, optionIds };
  },
});

// Get a specific poll with options and votes
export const get = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      return null;
    }

    const author = await ctx.db.get(poll.authorId);

    // Get poll options
    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Get votes for each option
    const optionsWithVotes = await Promise.all(
      options.map(async (option) => {
        const votes = await ctx.db
          .query("pollVotes")
          .withIndex("by_optionId", (q) => q.eq("optionId", option._id))
          .collect();

        // If it's an anonymous poll, just count the votes
        if (poll.isAnonymous) {
          return {
            ...option,
            votes: votes.length,
          };
        } else {
          // For non-anonymous polls, include voter information
          const votesWithUsers = await Promise.all(
            votes.map(async (vote) => {
              const user = await ctx.db.get(vote.userId);
              return {
                ...vote,
                user,
              };
            })
          );

          return {
            ...option,
            votes: votesWithUsers,
          };
        }
      })
    );

    return {
      ...poll,
      author,
      options: optionsWithVotes,
    };
  },
});

// List polls for a group
export const list = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const pollsWithDetails = await Promise.all(
      polls.map(async (poll) => {
        const author = await ctx.db.get(poll.authorId);
        
        // Get poll options
        const options = await ctx.db
          .query("pollOptions")
          .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
          .collect();

        // Count total votes
        let totalVotes = 0;
        await Promise.all(
          options.map(async (option) => {
            const votes = await ctx.db
              .query("pollVotes")
              .withIndex("by_optionId", (q) => q.eq("optionId", option._id))
              .collect();
            
            totalVotes += votes.length;
          })
        );

        return {
          ...poll,
          author,
          optionsCount: options.length,
          totalVotes,
        };
      })
    );

    return pollsWithDetails;
  },
});

// Vote in a poll
export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionId: v.id("pollOptions"),
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

    // Get the poll to check if it's multiple choice
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      return null;
    }

    // Check if poll has expired
    if (poll.expiresAt && poll.expiresAt < Date.now()) {
      throw new Error("This poll has expired");
    }

    // If it's not multiple choice, remove any existing votes by this user
    if (!poll.isMultipleChoice) {
      const existingVotes = await ctx.db
        .query("pollVotes")
        .withIndex("by_pollId_userId", (q) => 
          q.eq("pollId", args.pollId).eq("userId", user._id)
        )
        .collect();

      // Delete existing votes if this is a single-choice poll
      await Promise.all(
        existingVotes.map(async (vote) => {
          await ctx.db.delete(vote._id);
        })
      );
    } else {
      // If multiple choice, check if user already voted for this option
      const existingVote = await ctx.db
        .query("pollVotes")
        .withIndex("by_pollId_userId", (q) => 
          q.eq("pollId", args.pollId).eq("userId", user._id)
        )
        .filter((q) => q.eq(q.field("optionId"), args.optionId))
        .first();

      // If user already voted for this option, remove the vote (toggle behavior)
      if (existingVote) {
        await ctx.db.delete(existingVote._id);
        return { action: "removed" };
      }
    }

    // Add the new vote
    const voteId = await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      optionId: args.optionId,
      userId: user._id,
    });

    return { voteId, action: "added" };
  },
});

// Delete a poll and its associated options and votes
export const remove = mutation({
  args: { pollId: v.id("polls") },
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

    // Get the poll
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      return null;
    }

    // Check if the user is the author of the poll
    if (poll.authorId !== user._id) {
      throw new Error("You don't have permission to delete this poll");
    }

    // Delete all votes for this poll
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .collect();

    await Promise.all(
      votes.map(async (vote) => {
        await ctx.db.delete(vote._id);
      })
    );

    // Delete all options for this poll
    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .collect();

    await Promise.all(
      options.map(async (option) => {
        await ctx.db.delete(option._id);
      })
    );

    // Delete the poll itself
    await ctx.db.delete(args.pollId);

    return { success: true };
  },
});
