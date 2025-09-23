const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'account', 'general', 'investment', 'withdrawal'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'email', 'phone'],
      default: 'web'
    }
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    feedback: {
      type: String,
      maxlength: 1000,
      default: null
    },
    ratedAt: {
      type: Date,
      default: null
    }
  },
  metrics: {
    firstResponseAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    responseTime: {
      type: Number, // in minutes
      default: null
    },
    resolutionTime: {
      type: Number, // in minutes
      default: null
    }
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
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedAgent: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual for ticket age
supportTicketSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for formatted ticket ID
supportTicketSchema.virtual('formattedTicketId').get(function() {
  return `#${this.ticketId}`;
});

// Virtual for status badge color
supportTicketSchema.virtual('statusColor').get(function() {
  const colors = {
    open: 'blue',
    in_progress: 'yellow',
    waiting_customer: 'orange',
    resolved: 'green',
    closed: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Virtual for priority badge color
supportTicketSchema.virtual('priorityColor').get(function() {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };
  return colors[this.priority] || 'gray';
});

// Pre-validate middleware to generate ticketId before validation
supportTicketSchema.pre('validate', function(next) {
  // Generate ticket ID if not exists
  if (!this.ticketId) {
    this.ticketId = generateTicketId();
  }
  next();
});

// Pre-save middleware
supportTicketSchema.pre('save', function(next) {
  
  // Update metrics based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'resolved' && !this.metrics.resolvedAt) {
      this.metrics.resolvedAt = now;
      if (this.createdAt) {
        this.metrics.resolutionTime = Math.floor((now - this.createdAt) / (1000 * 60));
      }
    }
    
    if (this.status === 'closed' && !this.metrics.closedAt) {
      this.metrics.closedAt = now;
    }
  }
  
  next();
});

// Static methods
supportTicketSchema.statics.generateTicketId = function() {
  return generateTicketId();
};

supportTicketSchema.statics.getTicketsByUser = function(userId, options = {}) {
  const { status, limit = 20, page = 1 } = options;
  const query = { userId, isDeleted: false };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('assignedAgent', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

supportTicketSchema.statics.getTicketsByAgent = function(agentId, options = {}) {
  const { status, limit = 20, page = 1 } = options;
  const query = { assignedAgent: agentId, isDeleted: false };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('userId', 'name email username')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

supportTicketSchema.statics.getUnassignedTickets = function(options = {}) {
  const { priority, category, limit = 20 } = options;
  const query = { 
    assignedAgent: null, 
    status: { $in: ['open', 'in_progress'] },
    isDeleted: false 
  };
  
  if (priority) query.priority = priority;
  if (category) query.category = category;
  
  return this.find(query)
    .populate('userId', 'name email username')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

supportTicketSchema.statics.assignToAgent = function(ticketId, agentId) {
  return this.findByIdAndUpdate(
    ticketId,
    { 
      assignedAgent: agentId,
      status: 'in_progress'
    },
    { new: true }
  ).populate('userId assignedAgent', 'name email username');
};

supportTicketSchema.statics.getAnalytics = function(dateRange = {}) {
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
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        inProgressTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        closedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        avgResolutionTime: {
          $avg: '$metrics.resolutionTime'
        },
        avgSatisfaction: {
          $avg: '$satisfaction.rating'
        }
      }
    }
  ]);
};

// Instance methods
supportTicketSchema.methods.markAsResolved = function(agentId = null) {
  this.status = 'resolved';
  this.metrics.resolvedAt = new Date();
  
  if (this.createdAt) {
    this.metrics.resolutionTime = Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
  }
  
  return this.save();
};

supportTicketSchema.methods.addSatisfactionRating = function(rating, feedback = null) {
  this.satisfaction.rating = rating;
  this.satisfaction.feedback = feedback;
  this.satisfaction.ratedAt = new Date();
  
  return this.save();
};

supportTicketSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  
  return this.save();
};

// Helper function to generate ticket ID
function generateTicketId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}${random}`.toUpperCase();
}

module.exports = mongoose.model('SupportTicket', supportTicketSchema);