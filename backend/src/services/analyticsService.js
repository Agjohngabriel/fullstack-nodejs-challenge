const fs = require('fs').promises;
const path = require('path');
const { analyticsLogger } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.analyticsFile = path.join(process.cwd(), 'data', 'analytics.json');
    this.ensureDataDirectory();
    
    // In-memory counters for quick access
    this.dailyCounters = {
      requests: 0,
      goalSelections: {},
      errors: 0,
      successfulRequests: 0
    };
    
    // Reset counters daily
    this.resetCountersDaily();
  }
  
  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }
  
  /**
   * Log goal selection for analytics
   * @param {string} goal - Selected health goal
   */
  async logGoalSelection(goal) {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    // Update in-memory counter
    if (!this.dailyCounters.goalSelections[goal]) {
      this.dailyCounters.goalSelections[goal] = 0;
    }
    this.dailyCounters.goalSelections[goal]++;
    
    // Log to analytics file
    analyticsLogger.analytics('goal_selection', {
      goal,
      date,
      timestamp
    });
    
    // Update persistent storage
    await this.updateDailyAnalytics(date, 'goalSelection', goal);
  }
  
  /**
   * Log successful request
   * @param {Object} requestData - Request details
   */
  async logSuccessfulRequest(requestData) {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    this.dailyCounters.requests++;
    this.dailyCounters.successfulRequests++;
    
    analyticsLogger.analytics('successful_request', {
      ...requestData,
      date,
      timestamp
    });
    
    await this.updateDailyAnalytics(date, 'successfulRequest', requestData);
  }
  
  /**
   * Log failed request
   * @param {Object} requestData - Request details including error
   */
  async logFailedRequest(requestData) {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    this.dailyCounters.requests++;
    this.dailyCounters.errors++;
    
    analyticsLogger.analytics('failed_request', {
      ...requestData,
      date,
      timestamp
    });
    
    await this.updateDailyAnalytics(date, 'failedRequest', requestData);
  }
  
  /**
   * Update daily analytics in persistent storage
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} eventType - Type of event
   * @param {any} data - Event data
   */
  async updateDailyAnalytics(date, eventType, data) {
    try {
      let analytics = {};
      
      try {
        const existingData = await fs.readFile(this.analyticsFile, 'utf8');
        analytics = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        analytics = {};
      }
      
      if (!analytics[date]) {
        analytics[date] = {
          date,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          goalSelections: {},
          errors: [],
          averageResponseTime: 0,
          uniqueIPs: new Set(),
          firstRequest: null,
          lastRequest: null
        };
      }
      
      const dayData = analytics[date];
      
      switch (eventType) {
        case 'goalSelection':
          if (!dayData.goalSelections[data]) {
            dayData.goalSelections[data] = 0;
          }
          dayData.goalSelections[data]++;
          break;
          
        case 'successfulRequest':
          dayData.totalRequests++;
          dayData.successfulRequests++;
          dayData.uniqueIPs.add(data.ip || 'unknown');
          dayData.lastRequest = new Date().toISOString();
          if (!dayData.firstRequest) {
            dayData.firstRequest = dayData.lastRequest;
          }
          break;
          
        case 'failedRequest':
          dayData.totalRequests++;
          dayData.failedRequests++;
          dayData.errors.push({
            error: data.error,
            timestamp: new Date().toISOString(),
            requestId: data.requestId
          });
          dayData.uniqueIPs.add(data.ip || 'unknown');
          dayData.lastRequest = new Date().toISOString();
          if (!dayData.firstRequest) {
            dayData.firstRequest = dayData.lastRequest;
          }
          break;
      }
      
      // Convert Set to Array for JSON serialization
      dayData.uniqueIPs = Array.from(dayData.uniqueIPs);
      
      // Keep only last 90 days of data
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
      
      Object.keys(analytics).forEach(analyticsDate => {
        if (analyticsDate < cutoffDate) {
          delete analytics[analyticsDate];
        }
      });
      
      await fs.writeFile(this.analyticsFile, JSON.stringify(analytics, null, 2));
      
    } catch (error) {
      console.error('Error updating daily analytics:', error);
    }
  }
  
  /**
   * Get analytics for a specific date or date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD), optional
   * @returns {Object} Analytics data
   */
  async getDailyAnalytics(startDate = null, endDate = null) {
    try {
      const data = await fs.readFile(this.analyticsFile, 'utf8');
      const analytics = JSON.parse(data);
      
      if (!startDate) {
        // Return today's analytics if no date specified
        const today = new Date().toISOString().split('T')[0];
        return {
          date: today,
          data: analytics[today] || this.getEmptyDayData(today),
          currentCounters: this.dailyCounters
        };
      }
      
      if (!endDate) {
        // Return single day
        return {
          date: startDate,
          data: analytics[startDate] || this.getEmptyDayData(startDate)
        };
      }
      
      // Return date range
      const result = {};
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        result[dateStr] = analytics[dateStr] || this.getEmptyDayData(dateStr);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error reading analytics:', error);
      return { error: 'Failed to read analytics data' };
    }
  }
  
  /**
   * Get summary analytics across multiple days
   * @param {number} days - Number of days to look back
   * @returns {Object} Summary analytics
   */
  async getSummaryAnalytics(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const rangeData = await this.getDailyAnalytics(startDateStr, endDateStr);
      
      // Calculate summary
      let totalRequests = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      let allGoalSelections = {};
      let uniqueIPs = new Set();
      
      Object.values(rangeData).forEach(dayData => {
        if (dayData.totalRequests) {
          totalRequests += dayData.totalRequests;
          totalSuccessful += dayData.successfulRequests || 0;
          totalFailed += dayData.failedRequests || 0;
          
          // Aggregate goal selections
          Object.entries(dayData.goalSelections || {}).forEach(([goal, count]) => {
            allGoalSelections[goal] = (allGoalSelections[goal] || 0) + count;
          });
          
          // Aggregate unique IPs
          (dayData.uniqueIPs || []).forEach(ip => uniqueIPs.add(ip));
        }
      });
      
      // Calculate popular goals
      const sortedGoals = Object.entries(allGoalSelections)
        .sort(([,a], [,b]) => b - a)
        .map(([goal, count]) => ({ goal, count, percentage: ((count / totalRequests) * 100).toFixed(1) }));
      
      return {
        period: `${days} days`,
        startDate: startDateStr,
        endDate: endDateStr,
        summary: {
          totalRequests,
          successfulRequests: totalSuccessful,
          failedRequests: totalFailed,
          successRate: totalRequests > 0 ? ((totalSuccessful / totalRequests) * 100).toFixed(1) : '0',
          uniqueUsers: uniqueIPs.size,
          popularGoals: sortedGoals
        },
        dailyData: rangeData
      };
      
    } catch (error) {
      console.error('Error generating summary analytics:', error);
      return { error: 'Failed to generate summary analytics' };
    }
  }
  
  /**
   * Get empty day data structure
   * @param {string} date - Date string
   * @returns {Object} Empty day data
   */
  getEmptyDayData(date) {
    return {
      date,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      goalSelections: {},
      errors: [],
      averageResponseTime: 0,
      uniqueIPs: [],
      firstRequest: null,
      lastRequest: null
    };
  }
  
  /**
   * Reset daily counters at midnight
   */
  resetCountersDaily() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyCounters = {
        requests: 0,
        goalSelections: {},
        errors: 0,
        successfulRequests: 0
      };
      
      // Set up next reset
      this.resetCountersDaily();
    }, msUntilMidnight);
  }
}

module.exports = new AnalyticsService();