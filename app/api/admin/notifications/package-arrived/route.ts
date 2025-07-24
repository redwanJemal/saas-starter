// // app/api/admin/notifications/package-arrived/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { db } from '@/lib/db/drizzle'
// import { 
//   customerProfiles, 
//   incomingShipmentItems, 
//   notificationLogs,
//   users 
// } from '@/lib/db/schema'
// import { eq } from 'drizzle-orm'
// import { requirePermission } from '@/lib/auth/admin'

// // Send package arrival notification to customer
// export async function POST(request: NextRequest) {
//   try {
//     // Check permission
//     const adminUser = await requirePermission('packages.manage')

//     const body = await request.json()
//     const { customerId, itemId } = body

//     if (!customerId || !itemId) {
//       return NextResponse.json(
//         { error: 'Customer ID and item ID are required' },
//         { status: 400 }
//       )
//     }

//     // Get customer details
//     const [customer] = await db
//       .select({
//         id: customerProfiles.id,
//         customerId: customerProfiles.customerId,
//         firstName: customerProfiles.firstName,
//         lastName: customerProfiles.lastName,
//         email: customerProfiles.email,
//         phone: customerProfiles.phone,
//         userId: customerProfiles.userId,
//       })
//       .from(customerProfiles)
//       .where(eq(customerProfiles.id, customerId))
//       .limit(1)

//     if (!customer) {
//       return NextResponse.json(
//         { error: 'Customer not found' },
//         { status: 404 }
//       )
//     }

//     // Get user email if customer profile doesn't have direct email
//     let customerEmail = customer.email
//     if (!customerEmail && customer.userId) {
//       const [user] = await db
//         .select({ email: users.email })
//         .from(users)
//         .where(eq(users.id, customer.userId))
//         .limit(1)
      
//       if (user) {
//         customerEmail = user.email
//       }
//     }

//     // Get tracking item details
//     const [trackingItem] = await db
//       .select({
//         id: incomingShipmentItems.id,
//         trackingNumber: incomingShipmentItems.trackingNumber,
//         courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
//       })
//       .from(incomingShipmentItems)
//       .where(eq(incomingShipmentItems.id, itemId))
//       .limit(1)

//     if (!trackingItem) {
//       return NextResponse.json(
//         { error: 'Tracking item not found' },
//         { status: 404 }
//       )
//     }

//     // Prepare notification data
//     const notificationData = {
//       customerName: `${customer.firstName} ${customer.lastName}`.trim() || 'Valued Customer',
//       customerId: customer.customerId,
//       trackingNumber: trackingItem.trackingNumber,
//       courierTrackingUrl: trackingItem.courierTrackingUrl,
//       portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com',
//     }

//     // Send email notification (you would integrate with your email service here)
//     const emailSent = await sendPackageArrivedEmail(customerEmail, notificationData)

//     // Send SMS notification if phone number exists (optional)
//     let smsSent = false
//     if (customer.phone) {
//       smsSent = await sendPackageArrivedSMS(customer.phone, notificationData)
//     }

//     // Log notification
//     await db.insert(notificationLogs).values({
//       tenantId: adminUser.tenantId,
//       recipientType: 'customer',
//       recipientId: customer.id,
//       recipientEmail: customerEmail,
//       recipientPhone: customer.phone,
//       notificationType: 'package_arrived',
//       subject: 'Your Package Has Arrived',
//       message: `Your package with tracking number ${trackingItem.trackingNumber} has arrived at our facility and is being processed.`,
//       emailSent,
//       smsSent,
//       metadata: {
//         trackingNumber: trackingItem.trackingNumber,
//         itemId: trackingItem.id,
//         adminUserId: adminUser.id,
//       },
//       sentBy: adminUser.id,
//     })

//     return NextResponse.json({
//       message: 'Notification sent successfully',
//       emailSent,
//       smsSent,
//       customerEmail,
//       trackingNumber: trackingItem.trackingNumber,
//     })
//   } catch (error) {
//     console.error('Error sending package arrival notification:', error)
//     return NextResponse.json(
//       { error: 'Failed to send notification' },
//       { status: 500 }
//     )
//   }
// }

// // Email service integration (implement with your email provider)
// async function sendPackageArrivedEmail(
//   email: string,
//   data: {
//     customerName: string
//     customerId: string
//     trackingNumber: string
//     courierTrackingUrl?: string
//     portalUrl: string
//   }
// ): Promise<boolean> {
//   try {
//     // This is where you would integrate with your email service
//     // Examples: SendGrid, AWS SES, Postmark, etc.
    
//     const emailTemplate = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #f97316;">📦 Your Package Has Arrived!</h2>
        
//         <p>Dear ${data.customerName},</p>
        
//         <p>Great news! Your package with tracking number <strong>${data.trackingNumber}</strong> has arrived at our facility and is currently being processed.</p>
        
//         <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="margin-top: 0;">What happens next?</h3>
//           <ul style="margin: 0; padding-left: 20px;">
//             <li>Our team will process your package within 1-2 business days</li>
//             <li>You'll receive detailed photos and measurements</li>
//             <li>You can then choose your shipping options</li>
//           </ul>
//         </div>
        
//         ${data.courierTrackingUrl ? `
//           <p>You can track the original shipment here: 
//             <a href="${data.courierTrackingUrl}" style="color: #f97316;">Track Package</a>
//           </p>
//         ` : ''}
        
//         <p>View your packages and manage your account:</p>
//         <a href="${data.portalUrl}/dashboard/packages" 
//            style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
//           View My Packages
//         </a>
        
//         <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
//           Best regards,<br>
//           Your Package Forwarding Team
//         </p>
//       </div>
//     `

//     // Mock email sending - replace with actual email service
//     console.log(`📧 Sending email to ${email}:`, emailTemplate)
    
//     // For production, implement with your email service:
//     /*
//     const result = await emailService.send({
//       to: email,
//       subject: 'Your Package Has Arrived - Ready for Processing',
//       html: emailTemplate,
//     })
//     return result.success
//     */
    
//     return true // Mock success
//   } catch (error) {
//     console.error('Error sending email:', error)
//     return false
//   }
// }

// // SMS service integration (implement with your SMS provider)
// async function sendPackageArrivedSMS(
//   phone: string,
//   data: {
//     trackingNumber: string
//     portalUrl: string
//   }
// ): Promise<boolean> {
//   try {
//     const message = `📦 Your package ${data.trackingNumber} has arrived! We're processing it now. Track progress: ${data.portalUrl}/dashboard/packages`

//     // Mock SMS sending - replace with actual SMS service
//     console.log(`📱 Sending SMS to ${phone}:`, message)
    
//     // For production, implement with your SMS service:
//     /*
//     const result = await smsService.send({
//       to: phone,
//       message,
//     })
//     return result.success
//     */
    
//     return true // Mock success
//   } catch (error) {
//     console.error('Error sending SMS:', error)
//     return false
//   }
// }