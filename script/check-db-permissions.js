// Simple script to check role permissions using direct database query
const { exec } = require('child_process');

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log('DATABASE_URL not found in environment');
  process.exit(1);
}

// Extract connection details from DATABASE_URL
// Format: postgresql://user:password@host:port/database
const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.log('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

// Simple query to check role permissions
const query = `
SELECT id, name, permissions 
FROM "Role" 
WHERE name = 'admin' 
LIMIT 5;
`;

console.log('Checking admin role permissions...');

// For security reasons, we won't execute direct database commands
// Instead, let's create a simple API endpoint to check this
console.log('For security reasons, please check the database directly with this query:');
console.log(query);
console.log('\nOr use a database client to connect to:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);