import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'confirmation' | 'reminder';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientEmail, patientName, doctorName, appointmentDate, appointmentTime, type }: NotificationRequest = await req.json();

    const isConfirmation = type === 'confirmation';
    const subject = isConfirmation ? 'Appointment Confirmation - MediBook' : 'Appointment Reminder - MediBook';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">MediBook</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Healthcare Partner</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #1e40af; margin-bottom: 20px;">
            ${isConfirmation ? 'Appointment Confirmed!' : 'Appointment Reminder'}
          </h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Dear ${patientName},
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            ${isConfirmation 
              ? 'Your appointment has been successfully scheduled with our medical team.'
              : 'This is a friendly reminder about your upcoming appointment.'
            }
          </p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">Appointment Details:</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> ${appointmentTime}</p>
          </div>
          
          ${isConfirmation 
            ? `<div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;">
                  Please arrive 15 minutes early and bring your insurance card and a valid ID.
                </p>
              </div>`
            : `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: #92400e; font-weight: 500;">
                  Your appointment is in a few hours. Please don't forget!
                </p>
              </div>`
          }
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
          </p>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="tel:+15551234567" style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Call Us: (555) 123-4567
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 0;">
            Thank you for choosing MediBook for your healthcare needs.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2024 MediBook. All rights reserved.</p>
          <p>123 Medical Center Drive, Healthcare City, HC 12345</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "MediBook <appointments@medibook.com>",
      to: [patientEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log(`${type} email sent successfully to ${patientEmail}:`, emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error(`Error sending ${type} notification:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);