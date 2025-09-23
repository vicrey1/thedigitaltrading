const os = require('os');
const process = require('process');

// System metrics collection
class SystemMetrics {
  static getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      system: {
        used: Math.round((totalMem - freeMem) / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        percentage: Math.round(((totalMem - freeMem) / totalMem) * 100)
      },
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };
  }

  static getCpuUsage() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    return {
      cores: cpus.length,
      loadAverage: {
        '1min': Math.round(loadAvg[0] * 100) / 100,
        '5min': Math.round(loadAvg[1] * 100) / 100,
        '15min': Math.round(loadAvg[2] * 100) / 100
      },
      uptime: Math.round(os.uptime())
    };
  }

  static getProcessInfo() {
    return {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch()
    };
  }
}

// Request metrics middleware
const requestMetrics = {
  totalRequests: 0,
  activeRequests: 0,
  requestsByEndpoint: new Map(),
  responseTimeHistory: [],
  errorCount: 0,
  
  middleware: (req, res, next) => {
    const startTime = Date.now();
    requestMetrics.totalRequests++;
    requestMetrics.activeRequests++;
    
    // Track endpoint usage
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    requestMetrics.requestsByEndpoint.set(
      endpoint, 
      (requestMetrics.requestsByEndpoint.get(endpoint) || 0) + 1
    );
    
    // Track response time and errors
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      requestMetrics.activeRequests--;
      
      // Keep last 100 response times for average calculation
      requestMetrics.responseTimeHistory.push(responseTime);
      if (requestMetrics.responseTimeHistory.length > 100) {
        requestMetrics.responseTimeHistory.shift();
      }
      
      // Track errors
      if (res.statusCode >= 400) {
        requestMetrics.errorCount++;
      }
    });
    
    next();
  },
  
  getMetrics: () => {
    const avgResponseTime = requestMetrics.responseTimeHistory.length > 0
      ? Math.round(requestMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / requestMetrics.responseTimeHistory.length)
      : 0;
    
    return {
      total: requestMetrics.totalRequests,
      active: requestMetrics.activeRequests,
      errors: requestMetrics.errorCount,
      errorRate: requestMetrics.totalRequests > 0 
        ? Math.round((requestMetrics.errorCount / requestMetrics.totalRequests) * 100) 
        : 0,
      averageResponseTime: avgResponseTime,
      topEndpoints: Array.from(requestMetrics.requestsByEndpoint.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }))
    };
  }
};

// Database connection monitoring
const dbMetrics = {
  connectionAttempts: 0,
  connectionErrors: 0,
  lastConnectionError: null,
  
  recordConnectionAttempt: () => {
    dbMetrics.connectionAttempts++;
  },
  
  recordConnectionError: (error) => {
    dbMetrics.connectionErrors++;
    dbMetrics.lastConnectionError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
  },
  
  getMetrics: () => ({
    attempts: dbMetrics.connectionAttempts,
    errors: dbMetrics.connectionErrors,
    lastError: dbMetrics.lastConnectionError
  })
};

module.exports = {
  SystemMetrics,
  requestMetrics,
  dbMetrics
};