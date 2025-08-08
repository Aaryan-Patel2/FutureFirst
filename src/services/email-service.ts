// This is a mock email service for demonstration purposes.
// In a real application, this would integrate with an actual email provider like SendGrid, Mailgun, etc.

'use server';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  body: string; // Can be plain text or HTML
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
    console.log('----------- MOCK EMAIL SENT -----------');
    console.log(`To: ${options.to}`);
    console.log(`From: ${options.from}`);
    console.log(`Subject: ${options.subject}`);
    console.log('---------------- BODY -----------------');
    console.log(options.body);
    console.log('---------------------------------------');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate a successful response
    return { success: true, message: `Mock email successfully sent to ${options.to}` };
}
