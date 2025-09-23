const mongoose = require('mongoose');

const supportAttachmentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportMessage',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true,
    index: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    enum: ['image', 'document', 'video', 'audio', 'archive', 'other'],
    required: true,
    index: true
  },
  metadata: {
    dimensions: {
      width: Number,
      height: Number
    },
    duration: Number, // for video/audio files
    pages: Number, // for PDF files
    encoding: String,
    checksum: String,
    scanResult: {
      isClean: {
        type: Boolean,
        default: null
      },
      scanDate: {
        type: Date,
        default: null
      },
      threats: [{
        type: String,
        severity: String,
        description: String
      }]
    }
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDownloadedAt: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
supportAttachmentSchema.index({ ticketId: 1, createdAt: -1 });
supportAttachmentSchema.index({ uploadedBy: 1, createdAt: -1 });
supportAttachmentSchema.index({ fileType: 1, mimeType: 1 });
supportAttachmentSchema.index({ isDeleted: 1, expiresAt: 1 });
supportAttachmentSchema.index({ 'metadata.scanResult.isClean': 1 });

// Virtual for formatted file size
supportAttachmentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for file extension
supportAttachmentSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for is image
supportAttachmentSchema.virtual('isImage').get(function() {
  return this.fileType === 'image';
});

// Virtual for is document
supportAttachmentSchema.virtual('isDocument').get(function() {
  return this.fileType === 'document';
});

// Virtual for is expired
supportAttachmentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for days until expiry
supportAttachmentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
supportAttachmentSchema.pre('save', function(next) {
  // Determine file type based on MIME type
  if (this.isNew || this.isModified('mimeType')) {
    this.fileType = determineFileType(this.mimeType);
  }
  
  // Set default expiry (90 days from creation)
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Static methods
supportAttachmentSchema.statics.getAttachmentsByTicket = function(ticketId, options = {}) {
  const { fileType, limit = 50, page = 1 } = options;
  const query = { 
    ticketId, 
    isDeleted: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (fileType) {
    query.fileType = fileType;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email username')
    .populate('messageId', 'content createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

supportAttachmentSchema.statics.getAttachmentsByUser = function(userId, options = {}) {
  const { fileType, limit = 50, page = 1 } = options;
  const query = { 
    uploadedBy: userId, 
    isDeleted: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (fileType) {
    query.fileType = fileType;
  }
  
  return this.find(query)
    .populate('ticketId', 'ticketId subject status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

supportAttachmentSchema.statics.getExpiredAttachments = function() {
  return this.find({
    isDeleted: false,
    expiresAt: { $lt: new Date() }
  }).populate('ticketId uploadedBy', 'ticketId subject name email');
};

supportAttachmentSchema.statics.cleanupExpiredAttachments = function() {
  return this.updateMany(
    {
      isDeleted: false,
      expiresAt: { $lt: new Date() }
    },
    {
      isDeleted: true,
      deletedAt: new Date()
    }
  );
};

supportAttachmentSchema.statics.getStorageStats = function() {
  return this.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        imageFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'image'] }, 1, 0] }
        },
        documentFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'document'] }, 1, 0] }
        },
        videoFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'video'] }, 1, 0] }
        },
        audioFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'audio'] }, 1, 0] }
        },
        archiveFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'archive'] }, 1, 0] }
        },
        otherFiles: {
          $sum: { $cond: [{ $eq: ['$fileType', 'other'] }, 1, 0] }
        },
        avgFileSize: { $avg: '$size' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ]);
};

supportAttachmentSchema.statics.searchAttachments = function(searchTerm, options = {}) {
  const { fileType, ticketId, userId } = options;
  const query = {
    isDeleted: false,
    $or: [
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { filename: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (fileType) query.fileType = fileType;
  if (ticketId) query.ticketId = ticketId;
  if (userId) query.uploadedBy = userId;
  
  return this.find(query)
    .populate('ticketId uploadedBy', 'ticketId subject name email username')
    .sort({ createdAt: -1 });
};

// Instance methods
supportAttachmentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

supportAttachmentSchema.methods.updateScanResult = function(scanResult) {
  this.metadata.scanResult = {
    isClean: scanResult.isClean,
    scanDate: new Date(),
    threats: scanResult.threats || []
  };
  return this.save();
};

supportAttachmentSchema.methods.extendExpiry = function(days = 30) {
  const currentExpiry = this.expiresAt || new Date();
  this.expiresAt = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
  return this.save();
};

supportAttachmentSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

supportAttachmentSchema.methods.generateThumbnail = function(thumbnailUrl) {
  this.thumbnailUrl = thumbnailUrl;
  return this.save();
};

supportAttachmentSchema.methods.isAccessibleBy = function(userId) {
  // Check if user is the uploader
  if (this.uploadedBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check if file is public
  if (this.isPublic) {
    return true;
  }
  
  // Additional access control logic can be added here
  // For example, checking if user is assigned to the ticket
  
  return false;
};

// Helper function to determine file type
function determineFileType(mimeType) {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  } else if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip')
  ) {
    return 'archive';
  } else {
    return 'other';
  }
}

module.exports = mongoose.model('SupportAttachment', supportAttachmentSchema);