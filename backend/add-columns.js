// Add phone column using direct query
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function addColumns() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        console.log('Adding phone column to user_profiles...');
        await client.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);');
        console.log('✅ phone column added\n');

        console.log('Adding receipt_url to expenses...');
        await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;');
        console.log('✅ receipt_url column added\n');

        console.log('Adding receipt_data to expenses...');
        await client.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT;');
        console.log('✅ receipt_data column added\n');

        console.log('🎉 All columns added successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

addColumns();
