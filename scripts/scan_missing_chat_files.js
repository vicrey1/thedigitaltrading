// Script to scan chat messages and report missing files
const fs = require('fs');
const path = require('path');
const messages = require('../server/routes/supportChatMessages.json'); // Replace with actual DB or source
const uploadDir = path.join(__dirname, '../server/uploads/support');

const missingFiles = [];
messages.forEach(msg => {
  if (msg.type === 'file' && msg.attachment) {
    const filePath = path.join(uploadDir, path.basename(msg.attachment));
    if (!fs.existsSync(filePath)) {
      missingFiles.push({ userId: msg.userId, file: msg.attachment, name: msg.content });
    }
  }
});

if (missingFiles.length) {
  console.log('Missing chat files:');
  missingFiles.forEach(f => console.log(`User: ${f.userId}, File: ${f.file}, Name: ${f.name}`));
} else {
  console.log('No missing chat files detected.');
}
