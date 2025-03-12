const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Add blog router
const blogRouter = require('./router/blogRouter');

// Debug incoming requests
app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.path);
    console.log('Request headers:', req.headers);
    next();
});

// CORS configuration
app.options('*', cors()) // enable pre-flight for all routes
app.use(cors({
    origin: true, // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false, // Don't need credentials for now
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Increase payload size limit for large images
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Serve static files from public directory
app.use('/uploads', express.static('public/uploads'));

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is working' });
});

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Only for development
    }
});

// Verify transporter
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP verification error:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
    console.log('Received request:', req.body);
    
    try {
        const {
            name,
            email,
            contactNumber,
            suburb,
            bedrooms,
            bathrooms,
            carpetCleaning,
            furnished,
            propertyType,
            pestControl,
            date,
            message
        } = req.body;

        // Create email content with better formatting
        const emailContent = `
╔════════════════════════════════════════╗
║         NEW BOOKING REQUEST            ║
╚════════════════════════════════════════╝

👤 CUSTOMER DETAILS
-------------------
• Name: ${name}
• Email: ${email}
• Contact: ${contactNumber}

🏠 PROPERTY DETAILS
------------------
• Location: ${suburb}
• Type: ${propertyType}
• Bedrooms: ${bedrooms}
• Bathrooms: ${bathrooms}
• Status: ${furnished}

🧹 REQUESTED SERVICES
-------------------
• Carpet Cleaning: ${carpetCleaning}
• Pest Control: ${pestControl}

📅 SCHEDULING
------------
• Preferred Date: ${date}

💬 ADDITIONAL MESSAGE
-------------------
${message}

──────────────────────────────────
Generated via Gold Star Bond Cleaning
Website Booking System
──────────────────────────────────
`;

        // Send email
        const info = await transporter.sendMail({
            from: {
                name: 'Gold Star Bond Cleaning',
                address: process.env.SMTP_USER
            },
            to: process.env.RECIPIENT_EMAIL,
            replyTo: email, // This ensures replies go to the customer
            subject: `🏠 New Booking Request from ${suburb} for ${propertyType}`,
            text: emailContent,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 5px;">
                    <h1 style="margin: 0;">New Booking Request</h1>
                </div>
                
                <div style="background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">👤 Customer Details</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Contact:</strong> ${contactNumber}</p>
                    
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px;">🏠 Property Details</h2>
                    <p><strong>Location:</strong> ${suburb}</p>
                    <p><strong>Property Type:</strong> ${propertyType}</p>
                    <p><strong>Bedrooms:</strong> ${bedrooms}</p>
                    <p><strong>Bathrooms:</strong> ${bathrooms}</p>
                    <p><strong>Status:</strong> ${furnished}</p>
                    
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px;">🧹 Requested Services</h2>
                    <p><strong>Carpet Cleaning:</strong> ${carpetCleaning}</p>
                    <p><strong>Pest Control:</strong> ${pestControl}</p>
                    
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px;">📅 Scheduling</h2>
                    <p><strong>Preferred Date:</strong> ${date}</p>
                    
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px;">💬 Additional Message</h2>
                    <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message || 'No additional message provided.'}</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666;">
                    <p style="margin: 5px 0;">Generated via Gold Star Bond Cleaning</p>
                    <p style="margin: 5px 0;">Website Booking System</p>
                </div>
            </div>
            `
        });

        console.log('Email sent:', info);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            error: 'Failed to send email',
            details: error.message 
        });
    }
});

// Quick Booking endpoint
app.post('/api/quick-booking', async (req, res) => {
    console.log('Received quick booking request:', req.body);
    
    try {
        const {
            email,
            phone
        } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Create email content with better formatting
        const emailContent = `
╔════════════════════════════════════════╗
║         QUICK BOOKING REQUEST          ║
╚════════════════════════════════════════╝

👤 CUSTOMER DETAILS
-------------------
• Email: ${email}
• Contact: ${phone || 'Not provided'}

📝 REQUEST DETAILS
-----------------
• Type: Quick Booking
• Default Package: Bond Cleaning
• Bedrooms: 1
• Bathrooms: 1

──────────────────────────────────
Generated via Gold Star Bond Cleaning
Quick Booking System
──────────────────────────────────
`;

        // Send email
        const info = await transporter.sendMail({
            from: {
                name: 'Gold Star Bond Cleaning',
                address: process.env.SMTP_USER
            },
            to: process.env.RECIPIENT_EMAIL,
            replyTo: email,
            subject: `⚡ Quick Booking Request`,
            text: emailContent,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 5px;">
                    <h1 style="margin: 0;">⚡ Quick Booking Request</h1>
                </div>
                
                <div style="background-color: white; padding: 20px; margin-top: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px;">👤 Customer Details</h2>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Contact:</strong> ${phone || 'Not provided'}</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666;">
                    <p style="margin: 5px 0;">Generated via Gold Star Bond Cleaning</p>
                    <p style="margin: 5px 0;">Quick Booking System</p>
                </div>
            </div>
            `
        });

        console.log('Quick booking email sent:', info);
        res.status(200).json({ message: 'Quick booking email sent successfully' });
    } catch (error) {
        console.error('Error sending quick booking email:', error);
        res.status(500).json({ 
            error: 'Failed to send quick booking email',
            details: error.message 
        });
    }
}); 

// Add this new endpoint
app.get('/api/cron', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`Cron job pinged at: ${timestamp}`);
    
    res.status(200).json({
        status: 'success',
        message: 'Cron job executed successfully',
        timestamp: timestamp
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use blog router
app.use('/api/blogs', blogRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});