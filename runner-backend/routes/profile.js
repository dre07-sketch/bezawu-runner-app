const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, pool } = require('../middleware/authMiddleware');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Relax mimetype check as mobile clients might send generic mimetypes
        const mimetype = file.mimetype.startsWith('image/');
        
        if (extname || mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

// GET /api/profile
// Get runner's current profile including financial settings
router.get('/', verifyToken, async (req, res) => {
    try {
        // Alias full_name as name for frontend compatibility
        const result = await pool.query(
            'SELECT id, full_name as name, phone, status, pro_image, bank_code, account_number, account_name FROM runners WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Runner not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error fetching runner profile:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// PUT /api/profile
// Update runner's basic profile details
router.put('/', verifyToken, async (req, res) => {
    const { name, phone, pro_image } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Name and Phone are required' });
    }

    try {
        await pool.query(
            `UPDATE runners 
             SET full_name = $1, phone = $2, pro_image = $3 
             WHERE id = $4`,
            [name, phone, pro_image, req.user.id]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating runner profile:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/profile/financial
// Update runner's bank account details
router.post('/financial', verifyToken, async (req, res) => {
    const { bank_code, account_number, account_name } = req.body;

    if (!bank_code || !account_number || !account_name) {
        return res.status(400).json({ message: 'Bank code, account number, and account name are required' });
    }

    try {
        await pool.query(
            `UPDATE runners 
             SET bank_code = $1, account_number = $2, account_name = $3 
             WHERE id = $4`,
            [bank_code, account_number, account_name, req.user.id]
        );

        res.json({ success: true, message: 'Financial details updated successfully' });
    } catch (err) {
        console.error('Error updating financial details:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/profile/change-password
// Change runner's password
router.post('/change-password', verifyToken, async (req, res) => {
    const { new_password } = req.body;

    if (!new_password) {
        return res.status(400).json({ message: 'New password is required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    try {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(new_password, salt);

        // Update password
        await pool.query('UPDATE runners SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// POST /api/profile/upload
// Upload profile image
router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imagePath = `uploads/${req.file.filename}`;

        // Update runner's pro_image in database
        await pool.query(
            'UPDATE runners SET pro_image = $1 WHERE id = $2',
            [imagePath, req.user.id]
        );

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imagePath
        });
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
