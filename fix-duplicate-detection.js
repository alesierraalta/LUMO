const fs = require('fs');

// Read the mock file
const mockFilePath = './src/__mocks__/@supabase/supabase-js.js';
let content = fs.readFileSync(mockFilePath, 'utf8');

// Comment out the lines that generate unique names to prevent duplicates
content = content.replace(/actualData\.name = uniqueName;/, '// actualData.name = uniqueName; // DISABLED: Let validateConstraints handle duplicates');
content = content.replace(/actualData\.email = uniqueEmail;/, '// actualData.email = uniqueEmail; // DISABLED: Let validateConstraints handle duplicates');

// Write the fixed content back
fs.writeFileSync(mockFilePath, content);

console.log('✅ Fixed duplicate detection in mock system'); 