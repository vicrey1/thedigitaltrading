const mongoose = require('mongoose');

const supportAgentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  agentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline',
    index: true
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    maxConcurrentTickets: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    currentTicketCount: {
      type: Number,
      default: 0,
      min: 0
    },
    workingHours: {
      timezone: {
        type: String,
        default: 'UTC'
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          required: true
        },
        startTime: {
          type: String,
          required: true // Format: "HH:MM"
        },
        endTime: {
          type: String,
          required: true // Format: "HH:MM"
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  specializations: [{
    type: String,
    enum: ['technical', 'billing', 'account', 'general', 'investment', 'withdrawal', 'kyc', 'compliance'],
    index: true
  }],
  languages: [{
    code: {
      type: String,
      required: true // ISO 639-1 codes (en, es, fr, etc.)
    },
    name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'native'],
      default: 'intermediate'
    }
  }],
  performance: {
    totalTicketsHandled: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTicketsResolved: {
      type: Number,
      default: 0,
      min: 0
    },
    averageResponseTime: {
      type: Number, // in minutes
      default: null
    },
    averageResolutionTime: {
      type: Number, // in minutes
      default: null
    },
    customerSatisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPerformanceUpdate: {
      type: Date,
      default: Date.now
    }
  },
  preferences: {
    autoAssignment: {
      type: Boolean,
      default: true
    },
    notificationSettings: {
      email: {
        newTicket: {
          type: Boolean,
          default: true
        },
        ticketUpdate: {
          type: Boolean,
          default: true
        },
        customerReply: {
          type: Boolean,
          default: true
        }
      },
      browser: {
        newTicket: {
          type: Boolean,
          default: true
        },
        ticketUpdate: {
          type: Boolean,
          default: false
        },
        customerReply: {
          type: Boolean,
          default: true
        }
      }
    },
    responseTemplates: [{
      name: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 2000
      },
      category: {
        type: String,
        enum: ['greeting', 'closing', 'technical', 'billing', 'general'],
        default: 'general'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  sessions: [{
    loginAt: {
      type: Date,
      required: true
    },
    logoutAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in minutes
      default: null
    },
    ipAddress: String,
    userAgent: String,
    ticketsHandled: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
supportAgentSchema.index({ status: 1, 'availability.isAvailable': 1 });
supportAgentSchema.index({ specializations: 1, status: 1 });
supportAgentSchema.index({ 'availability.currentTicketCount': 1, 'availability.maxConcurrentTickets': 1 });
supportAgentSchema.index({ isActive: 1, lastActiveAt: -1 });
supportAgentSchema.index({ 'performance.customerSatisfactionRating': -1 });

// Virtual for resolution rate
supportAgentSchema.virtual('resolutionRate').get(function() {
  if (this.performance.totalTicketsHandled === 0) return 0;
  return (this.performance.totalTicketsResolved / this.performance.totalTicketsHandled * 100).toFixed(2);
});

// Virtual for availability status
supportAgentSchema.virtual('isCurrentlyAvailable').get(function() {
  return this.isActive && 
         this.availability.isAvailable && 
         this.status === 'online' &&
         this.availability.currentTicketCount < this.availability.maxConcurrentTickets;
});

// Virtual for workload percentage
supportAgentSchema.virtual('workloadPercentage').get(function() {
  if (this.availability.maxConcurrentTickets === 0) return 100;
  return (this.availability.currentTicketCount / this.availability.maxConcurrentTickets * 100).toFixed(2);
});

// Virtual for current session duration
supportAgentSchema.virtual('currentSessionDuration').get(function() {
  const currentSession = this.sessions.find(session => !session.logoutAt);
  if (!currentSession) return 0;
  return Math.floor((Date.now() - currentSession.loginAt.getTime()) / (1000 * 60));
});

// Virtual for formatted agent ID
supportAgentSchema.virtual('formattedAgentId').get(function() {
  return `AGT-${this.agentId}`;
});

// Pre-save middleware
supportAgentSchema.pre('save', function(next) {
  // Generate agent ID if not exists
  if (!this.agentId) {
    this.agentId = generateAgentId();
  }
  
  // Update last active timestamp
  if (this.isModified('status') && this.status !== 'offline') {
    this.lastActiveAt = new Date();
  }
  
  next();
});

// Static methods
supportAgentSchema.statics.getAvailableAgents = function(options = {}) {
  const { specialization, language, limit = 10 } = options;
  const query = {
    isActive: true,
    'availability.isAvailable': true,
    status: { $in: ['online', 'away'] },
    $expr: {
      $lt: ['$availability.currentTicketCount', '$availability.maxConcurrentTickets']
    }
  };
  
  if (specialization) {
    query.specializations = specialization;
  }
  
  if (language) {
    query['languages.code'] = language;
  }
  
  return this.find(query)
    .populate('userId', 'name email username')
    .sort({ 
      'availability.currentTicketCount': 1,
      'performance.customerSatisfactionRating': -1,
      lastActiveAt: -1
    })
    .limit(limit);
};

supportAgentSchema.statics.assignTicket = function(agentId, ticketId) {
  return this.findByIdAndUpdate(
    agentId,
    { 
      $inc: { 'availability.currentTicketCount': 1 },
      lastActiveAt: new Date()
    },
    { new: true }
  );
};

supportAgentSchema.statics.unassignTicket = function(agentId) {
  return this.findByIdAndUpdate(
    agentId,
    { 
      $inc: { 'availability.currentTicketCount': -1 },
      lastActiveAt: new Date()
    },
    { new: true }
  );
};

supportAgentSchema.statics.updatePerformanceMetrics = function(agentId, metrics) {
  const updateData = {
    'performance.lastPerformanceUpdate': new Date()
  };
  
  if (metrics.responseTime !== undefined) {
    updateData['performance.averageResponseTime'] = metrics.responseTime;
  }
  
  if (metrics.resolutionTime !== undefined) {
    updateData['performance.averageResolutionTime'] = metrics.resolutionTime;
  }
  
  if (metrics.ticketResolved) {
    updateData.$inc = {
      'performance.totalTicketsResolved': 1,
      'performance.totalTicketsHandled': 1
    };
  }
  
  if (metrics.satisfactionRating !== undefined) {
    updateData.$inc = updateData.$inc || {};
    updateData.$inc['performance.totalRatings'] = 1;
    
    // Calculate new average rating
    return this.findById(agentId).then(agent => {
      const currentTotal = (agent.performance.customerSatisfactionRating || 0) * agent.performance.totalRatings;
      const newTotal = currentTotal + metrics.satisfactionRating;
      const newCount = agent.performance.totalRatings + 1;
      updateData['performance.customerSatisfactionRating'] = newTotal / newCount;
      
      return this.findByIdAndUpdate(agentId, updateData, { new: true });
    });
  }
  
  return this.findByIdAndUpdate(agentId, updateData, { new: true });
};

supportAgentSchema.statics.getAgentStats = function(agentId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  
  // This would typically involve aggregating data from SupportTicket collection
  // For now, returning the agent's performance metrics
  return this.findById(agentId)
    .populate('userId', 'name email username')
    .select('performance availability specializations languages');
};

supportAgentSchema.statics.getTeamStats = function(dateRange = {}) {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalAgents: { $sum: 1 },
        onlineAgents: {
          $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
        },
        availableAgents: {
          $sum: { $cond: ['$availability.isAvailable', 1, 0] }
        },
        totalTicketsHandled: {
          $sum: '$performance.totalTicketsHandled'
        },
        totalTicketsResolved: {
          $sum: '$performance.totalTicketsResolved'
        },
        avgSatisfactionRating: {
          $avg: '$performance.customerSatisfactionRating'
        },
        avgResponseTime: {
          $avg: '$performance.averageResponseTime'
        },
        avgResolutionTime: {
          $avg: '$performance.averageResolutionTime'
        }
      }
    }
  ]);
};

// Instance methods
supportAgentSchema.methods.setStatus = function(status) {
  this.status = status;
  this.lastActiveAt = new Date();
  
  if (status === 'offline') {
    this.endCurrentSession();
  }
  
  return this.save();
};

supportAgentSchema.methods.setAvailability = function(isAvailable) {
  this.availability.isAvailable = isAvailable;
  this.lastActiveAt = new Date();
  return this.save();
};

supportAgentSchema.methods.startSession = function(sessionData = {}) {
  const session = {
    loginAt: new Date(),
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
    ticketsHandled: 0
  };
  
  this.sessions.push(session);
  this.status = 'online';
  this.lastActiveAt = new Date();
  
  return this.save();
};

supportAgentSchema.methods.endCurrentSession = function() {
  const currentSession = this.sessions.find(session => !session.logoutAt);
  
  if (currentSession) {
    currentSession.logoutAt = new Date();
    currentSession.duration = Math.floor((currentSession.logoutAt - currentSession.loginAt) / (1000 * 60));
  }
  
  this.status = 'offline';
  
  return this.save();
};

supportAgentSchema.methods.addResponseTemplate = function(template) {
  this.preferences.responseTemplates.push(template);
  return this.save();
};

supportAgentSchema.methods.updateResponseTemplate = function(templateId, updates) {
  const template = this.preferences.responseTemplates.id(templateId);
  if (template) {
    Object.assign(template, updates);
    return this.save();
  }
  throw new Error('Template not found');
};

supportAgentSchema.methods.removeResponseTemplate = function(templateId) {
  this.preferences.responseTemplates.id(templateId).remove();
  return this.save();
};

supportAgentSchema.methods.isWorkingNow = function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3) + 'day'; // monday, tuesday, etc.
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  
  const todaySchedule = this.availability.workingHours.schedule.find(
    schedule => schedule.day === currentDay && schedule.isActive
  );
  
  if (!todaySchedule) return false;
  
  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
};

supportAgentSchema.methods.canHandleMoreTickets = function() {
  return this.availability.currentTicketCount < this.availability.maxConcurrentTickets;
};

supportAgentSchema.methods.getActiveTemplates = function(category = null) {
  let templates = this.preferences.responseTemplates.filter(template => template.isActive);
  
  if (category) {
    templates = templates.filter(template => template.category === category);
  }
  
  return templates;
};

// Helper function to generate agent ID
function generateAgentId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 3);
  return `${timestamp}${random}`.toUpperCase();
}

module.exports = mongoose.model('SupportAgent', supportAgentSchema);