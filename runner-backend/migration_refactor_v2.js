require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting migration to strictly formatted prefixes...');

        await client.query('BEGIN');

        // 0. Create ID Generator Function
        await client.query(`
            CREATE OR REPLACE FUNCTION generate_bzw_id(prefix text) RETURNS text AS $$
            BEGIN
                RETURN prefix || '-' || floor(random() * 899999 + 100000)::text;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 1. Create Bundles Tables (if not exist)
        // We create them with UUID first if we want consistency in the migration loop, 
        // OR just create them correctly now. Creating correctly is easier.
        // But we need to handle them in the "alter to varchar" loop if we created them as UUID before.
        // Assuming they don't exist, we create them as VARCHAR directly.

        await client.query(`
            CREATE TABLE IF NOT EXISTS bundles (
                id VARCHAR(50) PRIMARY KEY DEFAULT generate_bzw_id('BZWBU'),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(12, 2) NOT NULL,
                image_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bundle_items (
                id VARCHAR(50) PRIMARY KEY DEFAULT generate_bzw_id('BZWBUI'),
                bundle_id VARCHAR(50) REFERENCES bundles(id) ON DELETE CASCADE,
                product_id UUID, -- Will be changed to VARCHAR later if it exists as UUID
                quantity INTEGER DEFAULT 1
            );
        `);
        // Note: bundle_items.product_id needs to match products.id type. 
        // If products.id is currently UUID, this must be UUID.
        // We will alter it to VARCHAR in step 3.


        // 2. Drop Constraints (Foreign Keys)
        console.log('Dropping constraints...');
        // We need to find all FKs and drop them to allow type changes
        const constraints = await client.query(`
            SELECT table_name, constraint_name 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
        `);

        for (const row of constraints.rows) {
            await client.query(`ALTER TABLE "${row.table_name}" DROP CONSTRAINT "${row.constraint_name}"`);
        }

        // 3. Alter Columns to VARCHAR(50)
        console.log('Altering column types to VARCHAR...');
        const tables = [
            'supermarkets', 'branches', 'managers', 'categories', 'products',
            'customers', 'orders', 'feedback', 'bank_accounts',
            'cart_items', 'order_items',
            'branch_inventory', 'bundles', 'bundle_items' // Include the new ones
        ];

        // Map defining which columns are IDs/FKs in each table
        // We know 'id' is common. FKs are specific.
        const tableColumns = {
            'supermarkets': ['id'],
            'branches': ['id', 'supermarket_id'],
            'managers': ['id', 'branch_id'],
            'categories': ['id', 'supermarket_id'],
            'products': ['id', 'category_id'],
            'customers': ['id'],
            'orders': ['id', 'branch_id', 'customer_id'],
            'feedback': ['id', 'order_id'],
            'bank_accounts': ['id', 'supermarket_id'],
            'cart_items': ['id', 'customer_id', 'product_id'],
            'order_items': ['id', 'order_id', 'product_id'],
            'branch_inventory': ['branch_id', 'product_id'], // Composite PK, no 'id'
            'bundles': ['id'],
            'bundle_items': ['id', 'bundle_id', 'product_id']
        };

        for (const table of tables) {
            // Check if table exists
            const check = await client.query(`SELECT to_regclass('public.${table}')`);
            if (!check.rows[0].to_regclass) continue;

            const columns = tableColumns[table] || ['id'];
            for (const col of columns) {
                // Check if column exists
                const colCheck = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [table, col]);

                if (colCheck.rows.length > 0) {
                    // Cast to varchar. UUIDs become 'aaaa-bbbb...' strings.
                    await client.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE VARCHAR(50)`);
                }
            }
        }

        // 4. Generate New IDs
        console.log('Generating new IDs...');

        const prefixMap = {
            'supermarkets': 'BZWS',
            'branches': 'BZWB',
            'managers': 'BZWM',
            'categories': 'BZWC',
            'products': 'BZWP',
            'customers': 'BZWU',
            'orders': 'BZWOR',
            'feedback': 'BZWF',
            'bank_accounts': 'BZWBA',
            'cart_items': 'BZWCI',
            'order_items': 'BZWOI',
            'bundles': 'BZWBU',
            'bundle_items': 'BZWBUI'
        };

        // Add temp column and fill it
        for (const table of tables) {
            // branch_inventory has no single 'id'
            if (table === 'branch_inventory') continue;
            if (!prefixMap[table]) continue;

            console.log(`...for ${table}`);
            await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS temp_new_id VARCHAR(50)`);
            await client.query(`UPDATE "${table}" SET temp_new_id = generate_bzw_id($1)`, [prefixMap[table]]);
        }

        // 5. Update Foreign Keys (Propagate changes)
        console.log('Propagating ID changes...');

        // Helper to update FK: 
        // UPDATE child SET fk_col = (SELECT parent.temp_new_id FROM parent WHERE parent.id = child.fk_col)
        const relations = [
            { parent: 'supermarkets', child: 'branches', fk: 'supermarket_id' },
            { parent: 'supermarkets', child: 'categories', fk: 'supermarket_id' },
            { parent: 'supermarkets', child: 'bank_accounts', fk: 'supermarket_id' },
            { parent: 'branches', child: 'managers', fk: 'branch_id' },
            { parent: 'branches', child: 'orders', fk: 'branch_id' },
            { parent: 'branches', child: 'branch_inventory', fk: 'branch_id' },
            { parent: 'categories', child: 'products', fk: 'category_id' },
            { parent: 'products', child: 'cart_items', fk: 'product_id' },
            { parent: 'products', child: 'order_items', fk: 'product_id' },
            { parent: 'products', child: 'branch_inventory', fk: 'product_id' },
            { parent: 'products', child: 'bundle_items', fk: 'product_id' },
            { parent: 'customers', child: 'orders', fk: 'customer_id' },
            { parent: 'customers', child: 'cart_items', fk: 'customer_id' }, // Assuming cart_items references customer
            { parent: 'orders', child: 'order_items', fk: 'order_id' },
            { parent: 'orders', child: 'feedback', fk: 'order_id' },
            { parent: 'bundles', child: 'bundle_items', fk: 'bundle_id' }
        ];

        for (const rel of relations) {
            // Only run if tables exist
            const pCheck = await client.query(`SELECT to_regclass('public.${rel.parent}')`);
            const cCheck = await client.query(`SELECT to_regclass('public.${rel.child}')`);
            if (!pCheck.rows[0].to_regclass || !cCheck.rows[0].to_regclass) continue;

            console.log(`Updating ${rel.child}.${rel.fk} from ${rel.parent}...`);
            // Determine match condition: parent.id (OLD UUID) matches child.fk (OLD UUID)
            await client.query(`
                UPDATE "${rel.child}" c
                SET "${rel.fk}" = p.temp_new_id
                FROM "${rel.parent}" p
                WHERE c."${rel.fk}" = p.id
             `);
        }

        // 6. Update Primary Keys (Swap temp_new_id to id)
        console.log('Finalizing Primary Keys...');
        for (const table of tables) {
            if (table === 'branch_inventory') continue;
            if (!prefixMap[table]) continue;

            const check = await client.query(`SELECT to_regclass('public.${table}')`);
            if (!check.rows[0].to_regclass) continue;

            await client.query(`UPDATE "${table}" SET id = temp_new_id`);
            await client.query(`ALTER TABLE "${table}" DROP COLUMN temp_new_id`);

            // Set DEFAULT to the new function
            await client.query(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT generate_bzw_id('${prefixMap[table]}')`);
        }

        // 7. Re-Add Constraints
        console.log('Re-adding constraints...');

        // We define these manually since we dropped them blindly
        const constraintsSql = `
            ALTER TABLE bank_accounts ADD CONSTRAINT fk_supermarket FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id) ON DELETE CASCADE;
            ALTER TABLE branches ADD CONSTRAINT fk_supermarket FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id) ON DELETE CASCADE;
            ALTER TABLE categories ADD CONSTRAINT fk_supermarket FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id) ON DELETE CASCADE;
            ALTER TABLE managers ADD CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
            ALTER TABLE products ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
            ALTER TABLE branch_inventory ADD CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
            ALTER TABLE branch_inventory ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            ALTER TABLE cart_items ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
            ALTER TABLE cart_items ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            ALTER TABLE orders ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
            ALTER TABLE orders ADD CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
            ALTER TABLE order_items ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
            ALTER TABLE order_items ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id);
            ALTER TABLE feedback ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id);
            ALTER TABLE bundle_items ADD CONSTRAINT fk_bundle FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE;
            ALTER TABLE bundle_items ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id);
        `;

        // Execute line by line to avoid failure if table missing
        const lines = constraintsSql.split(';');
        for (const line of lines) {
            if (line.trim()) {
                try {
                    await client.query(line);
                } catch (e) {
                    console.log('Constraint error (ignoring if table missing):', e.message);
                }
            }
        }

        await client.query('COMMIT');
        console.log('Migration successfully completed!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
