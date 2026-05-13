const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log("Checking schema...");

        // Add family_group_id to customers
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='family_group_id') THEN 
                    ALTER TABLE customers ADD COLUMN family_group_id UUID; 
                    RAISE NOTICE 'Added family_group_id to customers';
                END IF;
            END $$;
        `);

        // Check for other potential missing columns
        // e.g. branch_id in cart_items (verified exists, but safe to check)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='branch_id') THEN 
                    ALTER TABLE cart_items ADD COLUMN branch_id VARCHAR(50); 
                    RAISE NOTICE 'Added branch_id to cart_items';
                END IF;
            END $$;
        `);

        console.log("Migration completed.");
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

runMigration();
