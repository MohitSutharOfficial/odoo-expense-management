import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const template: EmailTemplate = {
        to: userEmail,
        subject: 'Welcome to Odoo Expense Manager! 🎉',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Odoo Expense Manager!</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>We're excited to have you on board! 🚀</p>
            <p>Odoo Expense Manager helps you track, manage, and approve expenses with ease.</p>
            <ul>
                <li>📝 Submit expenses with receipt uploads</li>
                <li>✅ Get instant approval notifications</li>
                <li>📊 Track spending with detailed reports</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
        </div>
        <div class="footer">
            <p>© 2025 Odoo Expense Manager</p>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Send expense submission notification
 */
export async function sendExpenseSubmittedEmail(
    managerEmail: string,
    managerName: string,
    employeeName: string,
    expenseTitle: string,
    expenseAmount: number,
    expenseId: string
): Promise<void> {
    const template: EmailTemplate = {
        to: managerEmail,
        subject: `New Expense Awaiting Approval: ${expenseTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .expense-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 6px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ New Expense Awaiting Approval</h1>
        </div>
        <div class="content">
            <p>Hi ${managerName},</p>
            <p><strong>${employeeName}</strong> has submitted a new expense:</p>
            <div class="expense-box">
                <h3>${expenseTitle}</h3>
                <p><strong>Amount:</strong> $${expenseAmount.toFixed(2)}</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/expenses/${expenseId}" class="button">Review Expense</a>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Send expense approval notification
 */
export async function sendExpenseApprovedEmail(
    employeeEmail: string,
    employeeName: string,
    expenseTitle: string,
    expenseAmount: number
): Promise<void> {
    const template: EmailTemplate = {
        to: employeeEmail,
        subject: `✅ Expense Approved: ${expenseTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .expense-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Expense Approved!</h1>
        </div>
        <div class="content">
            <p>Hi ${employeeName},</p>
            <p>Great news! Your expense has been approved.</p>
            <div class="expense-box">
                <h3>${expenseTitle}</h3>
                <p><strong>Amount:</strong> $${expenseAmount.toFixed(2)}</p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Send expense rejection notification
 */
export async function sendExpenseRejectedEmail(
    employeeEmail: string,
    employeeName: string,
    expenseTitle: string,
    comments?: string
): Promise<void> {
    const template: EmailTemplate = {
        to: employeeEmail,
        subject: `❌ Expense Rejected: ${expenseTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .expense-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Expense Rejected</h1>
        </div>
        <div class="content">
            <p>Hi ${employeeName},</p>
            <p>Your expense has been rejected.</p>
            <div class="expense-box">
                <h3>${expenseTitle}</h3>
                ${comments ? `<p><strong>Reason:</strong> ${comments}</p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
): Promise<void> {
    const template: EmailTemplate = {
        to: userEmail,
        subject: 'Reset Your Password',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>Click the button below to reset your password:</p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" class="button">Reset Password</a>
            <p>This link expires in 1 hour.</p>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Send weekly expense digest
 */
export async function sendWeeklySummaryEmail(
    userEmail: string,
    userName: string,
    weeklyStats: {
        totalExpenses: number;
        totalAmount: number;
        approved: number;
        pending: number;
    }
): Promise<void> {
    const template: EmailTemplate = {
        to: userEmail,
        subject: '📊 Your Weekly Expense Summary',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Weekly Summary</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>Here's your expense activity for the past week:</p>
            <div class="stats">
                <p><strong>Total Expenses:</strong> ${weeklyStats.totalExpenses}</p>
                <p><strong>Total Amount:</strong> $${weeklyStats.totalAmount.toFixed(2)}</p>
                <p><strong>Approved:</strong> ${weeklyStats.approved}</p>
                <p><strong>Pending:</strong> ${weeklyStats.pending}</p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
    };

    await sendEmail(template);
}

/**
 * Legacy function for backwards compatibility
 */
export async function sendApprovalEmail(to: string, expenseTitle: string) {
    await resend.emails.send({
        from: 'Expense Manager <onboarding@resend.dev>',
        to: [to],
        subject: 'New Expense Awaiting Approval',
        html: `<p>You have a new expense "${expenseTitle}" pending approval.</p>`
    });
}

/**
 * Generic email sender
 */
async function sendEmail(template: EmailTemplate): Promise<void> {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Odoo Expense <noreply@odooexpense.com>',
            to: template.to,
            subject: template.subject,
            html: template.html,
        });
        console.log(`Email sent successfully to ${template.to}`);
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

export default {
    sendWelcomeEmail,
    sendExpenseSubmittedEmail,
    sendExpenseApprovedEmail,
    sendExpenseRejectedEmail,
    sendPasswordResetEmail,
    sendWeeklySummaryEmail,
    sendApprovalEmail,
};