const query = require('./config/db');
query('SELECT 1').then(r=>console.log('Result:', r)).catch(e=>console.error('Error:', e));
