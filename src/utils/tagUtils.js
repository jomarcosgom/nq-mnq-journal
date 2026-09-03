/**
 * Enhanced tag utilities for categorization, statistics, and suggestions
 */

/**
 * Tag categories for organizing tags by type
 */
export const TAG_CATEGORIES = {
  SETUP: 'setup',
  EMOTION: 'emotion',
  MARKET: 'market',
  RISK: 'risk',
  EXECUTION: 'execution',
  OTHER: 'other'
};

/**
 * Default tag colors for visualization
 */
export const TAG_COLORS = {
  [TAG_CATEGORIES.SETUP]: '#4FD1C5', // teal
  [TAG_CATEGORIES.EMOTION]: '#F0A868', // orange
  [TAG_CATEGORIES.MARKET]: '#3DD68C', // green
  [TAG_CATEGORIES.RISK]: '#E5484D', // red
  [TAG_CATEGORIES.EXECUTION]: '#8B5CF6', // violet
  [TAG_CATEGORIES.OTHER]: '#7C8B99' // gray
};

/**
 * Categorize a tag based on common keywords
 * @param {string} tag - The tag to categorize
 * @returns {string} - The category
 */
export function categorizeTag(tag) {
  const lowerTag = tag.toLowerCase();

  // Setup tags - trading strategies, patterns, setups
  const setupKeywords = [
    'ruptura', 'breakout', 'breakdown', 'pullback', 'retracement',
    'reversal', 'continuation', 'range', 'trend', 'momentum',
    'support', 'resistance', 'fibonacci', 'pivot', 'gap',
    'oversold', 'overbought', 'divergence', 'confluence',
    'trendline', 'channel', 'triangle', 'flag', 'pennant',
    'head', 'shoulders', 'double', 'triple', 'wedge'
  ];

  // Emotion tags - psychological states, emotions
  const emotionKeywords = [
    'fomo', 'fear', 'greed', 'panic', 'euphoria', 'frustration',
    'impatience', 'revenge', 'overconfidence', 'doubt', 'anxiety',
    'stress', 'tired', 'distracted', 'emotional', 'tilt',
    'disciplined', 'patient', 'calm', 'focused', 'confident'
  ];

  // Market tags - market conditions, events
  const marketKeywords = [
    'news', 'earnings', 'fed', 'inflation', 'jobs', 'cpi', 'ppi',
    'open', 'close', 'lunch', 'overnight', 'gap', 'holiday',
    'expiration', 'rollover', 'volatility', 'liquidity',
    'session', 'asian', 'european', 'us', 'london', 'newyork',
    'premarket', 'afterhours', 'rth', 'eth'
  ];

  // Risk tags - risk management, position sizing
  const riskKeywords = [
    'size', 'leverage', 'margin', 'stop', 'target', 'risk',
    'reward', 'rr', 'position', 'contracts', 'lots',
    'overtrade', 'undertrade', 'scaling', 'pyramiding',
    'martingale', 'anti-martingale', 'kelly', 'fixed'
  ];

  // Execution tags - trade execution, mistakes
  const executionKeywords = [
    'entry', 'exit', 'slippage', 'fill', 'late', 'early',
    'missed', 'chased', 'hesitated', 'executed', 'planned',
    'followed', 'deviated', 'mistake', 'error', 'typo',
    'fat-finger', 'wrong', 'correct', 'forgot', 'remembered'
  ];

  // Check categories in order of specificity
  if (setupKeywords.some(keyword => lowerTag.includes(keyword))) {
    return TAG_CATEGORIES.SETUP;
  }
  if (emotionKeywords.some(keyword => lowerTag.includes(keyword))) {
    return TAG_CATEGORIES.EMOTION;
  }
  if (marketKeywords.some(keyword => lowerTag.includes(keyword))) {
    return TAG_CATEGORIES.MARKET;
  }
  if (riskKeywords.some(keyword => lowerTag.includes(keyword))) {
    return TAG_CATEGORIES.RISK;
  }
  if (executionKeywords.some(keyword => lowerTag.includes(keyword))) {
    return TAG_CATEGORIES.EXECUTION;
  }

  return TAG_CATEGORIES.OTHER;
}

/**
 * Get color for a tag based on its category
 * @param {string} tag - The tag
 * @returns {string} - Hex color code
 */
export function getTagColor(tag) {
  const category = categorizeTag(tag);
  return TAG_COLORS[category] || TAG_COLORS.OTHER;
}

/**
 * Get statistics for tags across entries
 * @param {Array} entries - Journal entries
 * @returns {Object} - Tag statistics
 */
export function getTagStatistics(entries) {
  const tagStats = {};

  entries.forEach(entry => {
    const tags = Array.isArray(entry.tags) ? entry.tags : (entry.setup ? [entry.setup] : []);
    const pnl = entry.realPnl !== null && !isNaN(entry.realPnl) ? entry.realPnl : 0;
    const won = pnl > 0;

    tags.forEach(tag => {
      if (!tagStats[tag]) {
        tagStats[tag] = {
          count: 0,
          wins: 0,
          losses: 0,
          totalPnl: 0,
          avgPnl: 0,
          winRate: 0
        };
      }

      const stats = tagStats[tag];
      stats.count++;
      stats.totalPnl += pnl;

      if (won) {
        stats.wins++;
      } else if (pnl < 0) {
        stats.losses++;
      }

      // Update derived stats
      stats.avgPnl = stats.totalPnl / stats.count;
      stats.winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
    });
  });

  return tagStats;
}

/**
 * Get suggested tags based on trade characteristics
 * @param {Object} trade - Trade data (contract, sl, tp, etc.)
 * @param {Array} allTags - All existing tags
 * @returns {Array} - Suggested tags
 */
export function getSuggestedTags(trade, allTags = []) {
  const suggestions = [];
  const { slPoints, tpPoints, contracts, outcome } = trade;

  // Risk/reward based suggestions
  if (slPoints > 0 && tpPoints > 0) {
    const rr = tpPoints / slPoints;
    if (rr >= 2) {
      suggestions.push('buen-rr');
    } else if (rr < 1) {
      suggestions.push('mal-rr');
    }
  }

  // Position size suggestions
  if (contracts > 5) {
    suggestions.push('alto-volumen');
  } else if (contracts < 2) {
    suggestions.push('bajo-volumen');
  }

  // Outcome-based suggestions
  if (outcome === 'won') {
    suggestions.push('ganada');
  } else if (outcome === 'lost') {
    suggestions.push('perdida');
  } else {
    suggestions.push('be');
  }

  // Filter to only suggest tags that exist or are very similar
  return suggestions.filter(suggested =>
    allTags.some(tag =>
      tag.toLowerCase().includes(suggested.toLowerCase()) ||
      suggested.toLowerCase().includes(tag.toLowerCase())
    ) || allTags.length === 0 // If no existing tags, show all suggestions
  );
}

/**
 * Merge tags from different sources, avoiding duplicates
 * @param {...Array} tagArrays - Arrays of tags to merge
 * @returns {Array} - Unique merged tags
 */
export function mergeTags(...tagArrays) {
  const set = new Set();
  tagArrays.forEach(array => {
    if (Array.isArray(array)) {
      array.forEach(tag => {
        if (tag && typeof tag === 'string') {
          set.add(tag.trim());
        }
      });
    }
  });
  return Array.from(set).filter(tag => tag.length > 0);
}