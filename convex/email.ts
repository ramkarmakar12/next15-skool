import { httpAction } from './_generated/server';
import { Resend } from 'resend';

// Define email sending action using Convex HTTP action
export const sendInvitationEmail = httpAction(async (ctx, request) => {
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
