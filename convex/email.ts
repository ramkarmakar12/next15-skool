import { httpAction, action } from './_generated/server';
import { Resend } from 'resend';
import { v } from 'convex/values';

// Add a regular action for sending emails (can be called from mutations)
export const sendInvitationEmail = action({
  args: {
    to: v.string(),
    inviterName: v.string(),
    groupName: v.string(),
    invitationLink: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { to, inviterName, groupName, invitationLink } = args;

      // Get the Resend API key from environment variables
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.error("Missing RESEND_API_KEY environment variable");
        return { 
          success: false, 
          error: "Missing RESEND_API_KEY environment variable" 
        };
      }

      // Initialize the Resend client
      const resend = new Resend(apiKey);
      
      console.log("Attempting to send email to:", to);
      
      // Send the actual email
      console.log("[Email Action] Starting email send to:", args.to);
      
      const { data, error } = await resend.emails.send({
        from: 'Skool <onboarding@resend.dev>', // Use the default onboarding sender
        to: [to],
        subject: `You've been invited to join ${groupName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #3b82f6;">You've been invited to join ${groupName}</h2>
            <p>Hello,</p>
            <p>${inviterName} has invited you to join their group "${groupName}" on Skool.</p>
            <p>Click the button below to view this invitation and join the group:</p>
            <a href="${invitationLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Invitation</a>
            <p style="font-size: 14px; color: #666;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });

      // Check for errors from Resend
      if (error) {
        console.error("[Resend Error] Full error details:", {
          code: error.name,
          message: error.message,
          statusCode: error.statusCode
        });
        return { success: false, error: error.message };
      }

      console.log("[Email Success] Resend response:", data);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("[Email Crash] Full error stack:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
});

// Keep the HTTP action for other use cases
export const sendInvitationEmailHttp = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { to, inviterName, groupName, invitationLink } = body;

    // Get the Resend API key from environment variables
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing RESEND_API_KEY environment variable. Please set it in your Convex environment variables." 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize the Resend client
    const resend = new Resend(apiKey);
    
    // Send the actual email
    const { data, error } = await resend.emails.send({
      from: 'Skool <noreply@resend.dev>', // Replace with your verified domain once set up
      to: [to],
      subject: `You've been invited to join ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">You've been invited to join ${groupName}</h2>
          <p>Hello,</p>
          <p>${inviterName} has invited you to join their group "${groupName}" on Skool.</p>
          <p>Click the button below to view this invitation and join the group:</p>
          <a href="${invitationLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Invitation</a>
          <p style="font-size: 14px; color: #666;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    // Check for errors from Resend
    if (error) {
      console.error("Failed to send email via Resend:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Email sent successfully to:", to);
    console.log("Email ID:", data?.id);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data?.id 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in email sending:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send email" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
});
