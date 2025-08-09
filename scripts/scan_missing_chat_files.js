
// Script to scan MongoDB for chat messages referencing files and report missing files
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Update with your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxyield';
const uploadDir = path.join(__dirname, '../server/uploads/support');

// Define minimal SupportChatMessage schema
const SupportChatMessageSchema = new mongoose.Schema({
  type: String,
  attachment: String,
  userId: mongoose.Schema.Types.ObjectId,
  content: String,
}, { collection: 'supportchatmessages' });
const SupportChatMessage = mongoose.model('SupportChatMessage', SupportChatMessageSchema);

async function scanMissingFiles() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const messages = await SupportChatMessage.find({ type: 'file', attachment: { $exists: true, $ne: '' } });
  const missingFiles = [];
  for (const msg of messages) {
    const filePath = path.join(uploadDir, path.basename(msg.attachment));
    if (!fs.existsSync(filePath)) {
      missingFiles.push({ userId: msg.userId, file: msg.attachment, name: msg.content });
    }
  }
  if (missingFiles.length) {
    console.log('Missing chat files:');
    missingFiles.forEach(f => console.log(`User: ${f.userId}, File: ${f.file}, Name: ${f.name}`));
  } else {
    console.log('No missing chat files detected.');
  }
  await mongoose.disconnect();
}

scanMissingFiles().catch(err => {
  console.error('Error scanning missing chat files:', err);
  process.exit(1);
});
