const express = require('express');
const { validateSuggestionsRequest } = require('../middleware/validation');
const suggestionsService = require('../services/suggestionsService');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /suggestions
 * Get personalized peptide suggestions based on user input
 */
router.post('/', validateSuggestionsRequest, async (req, res) => {
  const { age, goal } = req.body;
  const requestId = require('uuid').v4();
  
  logger.info('Processing suggestions request', {
    requestId,
    age,
    goal,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  try {
    // Log analytics for goal selection
    await analyticsService.logGoalSelection(goal);
    
    // Get suggestions based on goal and age
    const suggestions = await suggestionsService.getSuggestions(age, goal);
    
    // Log successful request
    await analyticsService.logSuccessfulRequest({
      requestId,
      age,
      goal,
      suggestionsCount: suggestions.length,
      timestamp: new Date()
    });
    
    logger.info('Successfully generated suggestions', {
      requestId,
      suggestionsCount: suggestions.length
    });
    
    res.json({
      success: true,
      requestId,
      suggestions,
      meta: {
        generatedAt: new Date().toISOString(),
        goalCategory: goal,
        ageGroup: suggestionsService.getAgeGroup(age)
      }
    });
    
  } catch (error) {
    logger.error('Error generating suggestions', {
      requestId,
      error: error.message,
      stack: error.stack,
      age,
      goal
    });
    
    // Log failed request
    await analyticsService.logFailedRequest({
      requestId,
      age,
      goal,
      error: error.message,
      timestamp: new Date()
    });
    
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: 'An internal error occurred while processing your request. Please try again.',
      requestId
    });
  }
});

/**
 * GET /suggestions/goals
 * Get available health goals
 */
router.get('/goals', (req, res) => {
  const goals = suggestionsService.getAvailableGoals();
  res.json({
    success: true,
    goals
  });
});

/**
 * POST /suggestions/export-pdf
 * Export suggestions as PDF
 */
router.post('/export-pdf', validateSuggestionsRequest, async (req, res) => {
  const { age, goal, suggestions } = req.body;
  
  try {
    logger.info('Generating PDF export', { age, goal });
    
    // This would integrate with a PDF generation service
    // For now, return a mock response
    res.json({
      success: true,
      message: 'PDF export feature coming soon',
      downloadUrl: null
    });
    
  } catch (error) {
    logger.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: 'PDF export is temporarily unavailable'
    });
  }
});

module.exports = router;