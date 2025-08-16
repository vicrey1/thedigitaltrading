#!/usr/bin/env node

// backfill_support_uploads.js
// Scan server/uploads/support and create SupportUpload records for files that don't have one yet.
// Usage: node backfill_support_uploads.js [--apply]

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const SupportUpload = require('../models/SupportUpload');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'support');
const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO;

async function main() {
  const apply = process.argv.includes('--apply');
  if (!MONGO) {
    console.error('No MongoDB URI found. Set MONGO_URI or MONGODB_URI environment variable.');
    process.exitCode = 2;
    return;
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    console.error('Upload directory not found:', UPLOAD_DIR);
    process.exitCode = 3;
    return;
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const files = await fs.promises.readdir(UPLOAD_DIR);
  let processed = 0;
  let skipped = 0;
  let created = 0;
  const now = new Date();

  for (const fname of files) {
    // skip thumbnails or hidden files
    if (!fname || fname.startsWith('.') || fname.endsWith('_thumb.jpg') || fname.endsWith('_thumb.jpeg') || fname.endsWith('_thumb.png')) {
      skipped++;
      continue;
    }

    processed++;
    try {
      const exists = await SupportUpload.findOne({ filename: fname }).lean();
      if (exists) {
        skipped++;
        continue;
      }

      const stat = await fs.promises.stat(path.join(UPLOAD_DIR, fname));

      const doc = {
        filename: fname,
        originalName: null,
        userId: null,
        createdAt: stat && stat.birthtime ? stat.birthtime : now
      };

      if (apply) {
        await SupportUpload.create(doc);
        created++;
        console.log('[created]', fname);
      } else {
        console.log('[dry-run] would create:', JSON.stringify(doc));
      }
    } catch (e) {
      console.warn('Error processing', fname, e && e.message);
    }
  }

  console.log('\nSummary:');
  console.log('  files scanned:', files.length);
  console.log('  processed:', processed);
  console.log('  skipped (existing/thumbs):', skipped);
  console.log('  to create:', apply ? created : '(dry-run, use --apply to persist)');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err && err.message);
  process.exit(1);
});
