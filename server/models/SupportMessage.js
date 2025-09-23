const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['user', 'agent', 'system'],
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system_notification', 'status_update'],
    default: 'text',
    index: true
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    isInternal: {
      type: Boolean,
      default: false // Internal notes only visible to agents
    },
    isAutoResponse: {
      type: Boolean,
      default: false
    },
    templateUsed: {
      type: String,
      default: null
    }
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reaction: {
      type: String,
      enum: ['helpful', 'not_helpful', 'resolved', 'needs_clarification'],
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    previousContent: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      maxlength: 200
    }
  }],
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
supportMessageSchema.index({ ticketId: 1, createdAt: 1 });
supportMessageSchema.index({ senderId: 1, createdAt: -1 });
supportMessageSchema.index({ senderType: 1, ticketId: 1 });
supportMessageSchema.index({ isDeleted: 1, createdAt: -1 });
supportMessageSchema.index({ 'metadata.isInternal': 1, ticketId: 1 });

// Virtual for message age
supportMessageSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
});

// Virtual for formatted timestamp
supportMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for read status
supportMessageSchema.virtual('isRead').get(function() {
  return this.readBy && this.readBy.length > 0;
});

// Virtual for attachment count
supportMessageSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual for has reactions
supportMessageSchema.virtual('hasReactions').get(function() {
  return this.reactions && this.reactions.length > 0;
});

// Pre-save middleware
supportMessageSchema.pre('save', async function(next) {
  // Update ticket's first response time if this is the first agent response
  if (this.isNew && this.senderType === 'agent') {
    try {
      const SupportTicket = mongoose.model('SupportTicket');
      const ticket = await SupportTicket.findById(this.ticketId);
      
      if (ticket && !ticket.metrics.firstResponseAt) {
        ticket.metrics.firstResponseAt = this.createdAt || new Date();
        if (ticket.createdAt) {
          ticket.metrics.responseTime = Math.floor((ticket.metrics.firstResponseAt - ticket.createdAt) / (1000 * 60));
        }
        await ticket.save();
      }
    } catch (error) {
      console.error('Error updating ticket first response time:', error);
    }
  }
  
  next();
});

// Static methods
supportMessageSchema.statics.getMessagesByTicket = function(ticketId, options = {}) {
  const { includeInternal = false, limit = 50, page = 1 } = options;
  const query = { 
    ticketId, 
    isDeleted: false 
  };
  
  if (!includeInternal) {
    query['metadata.isInternal'] = { $ne: true };
  }
  
  return this.find(query)
    .populate('senderId', 'name email username role')
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

supportMessageSchema.statics.getUnreadMessages = function(userId, ticketId = null) {
  const query = {
    isDeleted: false,
    'readBy.userId': { $ne: userId }
  };
  
  if (ticketId) {
    query.ticketId = ticketId;
  }
  
  return this.find(query)
    .populate('ticketId', 'ticketId subject status')
    .populate('senderId', 'name email username')
    .sort({ createdAt: -1 });
};

supportMessageSchema.statics.markAsRead = function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      }
    },
    { new: true }
  );
};

supportMessageSchema.statics.markTicketMessagesAsRead = function(ticketId, userId) {
  return this.updateMany(
    {
      ticketId: ticketId,
      isDeleted: false,
      'readBy.userId': { $ne: userId }
    },
    {
      $addToSet: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      }
    }
  );
};

supportMessageSchema.statics.addReaction = function(messageId, userId, reaction) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $pull: { reactions: { userId: userId } }, // Remove existing reaction
    },
    { new: true }
  ).then(message => {
    return this.findByIdAndUpdate(
      messageId,
      {
        $addToSet: {
          reactions: {
            userId: userId,
            reaction: reaction,
            reactedAt: new Date()
          }
        }
      },
      { new: true }
    );
  });
};

supportMessageSchema.statics.searchMessages = function(ticketId, searchTerm, options = {}) {
  const { includeInternal = false } = options;
  const query = {
    ticketId: ticketId,
    isDeleted: false,
    content: { $regex: searchTerm, $options: 'i' }
  };
  
  if (!includeInternal) {
    query['metadata.isInternal'] = { $ne: true };
  }
  
  return this.find(query)
    .populate('senderId', 'name email username')
    .sort({ createdAt: -1 });
};

supportMessageSchema.statics.getMessageStats = function(dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchQuery = { isDeleted: false };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ['$senderType', 'user'] }, 1, 0] }
        },
        agentMessages: {
          $sum: { $cond: [{ $eq: ['$senderType', 'agent'] }, 1, 0] }
        },
        systemMessages: {
          $sum: { $cond: [{ $eq: ['$senderType', 'system'] }, 1, 0] }
        },
        messagesWithAttachments: {
          $sum: { $cond: [{ $gt: [{ $size: '$attachments' }, 0] }, 1, 0] }
        },
        avgMessageLength: {
          $avg: { $strLenCP: '$content' }
        }
      }
    }
  ]);
};

// Instance methods
supportMessageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.userId.toString() === userId.toString())) {
    this.readBy.push({
      userId: userId,
      readAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

supportMessageSchema.methods.addReaction = function(userId, reaction) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    userId: userId,
    reaction: reaction,
    reactedAt: new Date()
  });
  
  return this.save();
};

supportMessageSchema.methods.editContent = function(newContent, editedBy, reason = null) {
  // Save edit history
  this.editHistory.push({
    editedAt: new Date(),
    editedBy: editedBy,
    previousContent: this.content,
    reason: reason
  });
  
  // Update content
  this.content = newContent;
  
  return this.save();
};

supportMessageSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  
  return this.save();
};

supportMessageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.userId.toString() === userId.toString());
};

supportMessageSchema.methods.getReactionsByType = function() {
  const reactionCounts = {};
  this.reactions.forEach(reaction => {
    reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
  });
  return reactionCounts;
};

module.exports = mongoose.model('SupportMessage', supportMessageSchema);