const crypto = require('crypto');

// Générer une clé de 32 bytes (256 bits)
const key = crypto.randomBytes(32);

console.log('Generated Master Encryption Key:');
console.log(key.toString('base64'));
console.log('\nAdd this to your .env file:');
console.log(`MASTER_ENCRYPTION_KEY=${key.toString('base64')}`);