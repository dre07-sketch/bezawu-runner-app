const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function logToFile(msg) {
    try {
        const logPath = path.join(__dirname, '../email_debug.log');
        const timestamp = new Date().toISOString();
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, '', { flag: 'w' });
        }
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (err) {
        console.error('Logging to file failed:', err.message);
    }
}

const primaryTransporter = nodemailer.createTransport({
    host: process.env.SUPPORT_EMAIL_HOST || 'mail.bezawcurbside.com',
    port: parseInt(process.env.SUPPORT_EMAIL_PORT) || 465,
    secure: parseInt(process.env.SUPPORT_EMAIL_PORT) === 465,
    auth: {
        user: process.env.SUPPORT_EMAIL_USER,
        pass: process.env.SUPPORT_EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    tls: { rejectUnauthorized: false }
});

const fallbackTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a transactional email to a customer for order status.
 */
async function sendStatusEmail(to, subject, title, message, orderId, details = {}) {
    if (!to) {
        logToFile(`❌ [Email Error] Recipient email is missing for Order #${orderId}`);
        return false;
    }

    const { vendor, branch, location, waitTime, vehicle, paymentMethod, items, totalPrice } = details;
    
    // Attempt to find logo
    const possiblePaths = [
        path.join(__dirname, '../../assets/bezaw logo.png'),
        path.join(process.cwd(), 'assets/bezaw logo.png'),
        path.join(__dirname, '../public/logo.png')
    ];
    let finalLogoPath = possiblePaths.find(p => fs.existsSync(p));
    
    const attachments = [];
    if (finalLogoPath) {
        attachments.push({ filename: 'logo.png', path: finalLogoPath, cid: 'bezawlogo' });
    }

    const secureHash = Buffer.from(`${orderId}-${new Date().getTime()}`).toString('base64').slice(0, 16).toUpperCase();
    const downloadLink = `https://superapi.bezawcurbside.com/api/orders/${orderId}/receipt`;

    const mailOptions = {
        from: `"Bezaw Curbside" <${process.env.SUPPORT_EMAIL_USER || process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        attachments: attachments,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    .receipt-card { position: relative; max-width: 600px; margin: 20px auto; background: #fff; border-radius: 28px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 45px 20px; text-align: center; color: #fff; }
                    .content { position: relative; padding: 40px; z-index: 1; }
                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg); width: 80%; opacity: 0.03; z-index: 0; pointer-events: none; }
                    .info-grid { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
                    .label { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
                    .value { font-size: 14px; font-weight: 700; color: #0f172a; }
                    .item-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .item-table th { text-align: left; font-size: 12px; color: #10b981; text-transform: uppercase; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
                    .item-table td { padding: 15px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .total-section { text-align: right; margin-top: 25px; padding-top: 20px; border-top: 2px solid #f1f5f9; }
                    .grand-total { font-size: 22px; font-weight: 900; color: #10b981; }
                    .footer { text-align: center; padding: 30px; background: #f8fafc; font-size: 11px; color: #94a3b8; }
                    .btn-download { display: inline-block; margin-top: 20px; padding: 15px 30px; background: #10b981; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; }
                </style>
            </head>
            <body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
                <div class="receipt-card">
                    <div class="header">
                        ${finalLogoPath ? `<img src="cid:bezawlogo" style="height: 60px; margin-bottom: 15px;">` : ''}
                        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">${title}</h1>
                        <div style="margin-top: 5px; opacity: 0.9; font-size: 14px; font-weight: 600;">The Addis Drive-Thru</div>
                    </div>
                    
                    <div class="content">
                        <!-- Watermark -->
                        ${finalLogoPath ? `<img src="cid:bezawlogo" class="watermark">` : ''}
                        
                        <div style="text-align: center; margin-bottom: 35px;">
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">${message}</p>
                        </div>

                        <div class="info-grid">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="width: 50%; vertical-align: top;">
                                        <div class="label">Vendor</div>
                                        <div class="value">${vendor || 'Bezaw Partner'}</div>
                                        <div style="font-size: 12px; color: #64748b;">${branch || 'Main Branch'}</div>
                                    </td>
                                    <td style="width: 50%; vertical-align: top; text-align: right;">
                                        <div class="label">Order Reference</div>
                                        <div class="value">#${String(orderId).slice(-8)}</div>
                                        <div style="font-size: 12px; color: #64748b;">${new Date().toLocaleDateString()}</div>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        ${items && items.length > 0 ? `
                        <table class="item-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style="text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(i => `
                                    <tr>
                                        <td>
                                            <div class="value">${i.product_name || i.name}</div>
                                            <div style="font-size: 12px; color: #64748b;">Qty: ${i.quantity}</div>
                                        </td>
                                        <td style="text-align: right;" class="value">${parseFloat(i.price_at_purchase || 0).toLocaleString()} ETB</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="total-section">
                            <div class="grand-total">Total ${parseFloat(totalPrice || 0).toLocaleString()} ETB</div>
                        </div>
                        ` : ''}

                        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px dashed #e2e8f0;">
                            <a href="${downloadLink}" class="btn-download">
                                📥 View Digital Receipt
                            </a>
                            <p style="margin-top: 15px; font-size: 11px; color: #94a3b8;">Security Hash: ${secureHash}</p>
                        </div>
                    </div>

                    <div class="footer">
                        <div style="margin-bottom: 10px;">&copy; 2026 Bezaw Curbside Services PLC</div>
                        <div>Addis Ababa, Ethiopia | Support: support@bezawcurbside.com</div>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await primaryTransporter.sendMail(mailOptions);
        logToFile(`✅ Status email sent for order #${orderId}`);
        return true;
    } catch (primaryErr) {
        logToFile(`⚠️ Primary SMTP failed: ${primaryErr.message}. Trying fallback...`);
        try {
            await fallbackTransporter.sendMail({
                ...mailOptions,
                from: `"Bezaw Support" <${process.env.EMAIL_USER}>`
            });
            return true;
        } catch (fallbackErr) {
            logToFile(`❌ All SMTP failed for order #${orderId}: ${fallbackErr.message}`);
            return false;
        }
    }
}

module.exports = sendStatusEmail;
