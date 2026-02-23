/**
 * Mock Data Service
 * Centralized service for all demo data
 * Respects feature flags and role checks
 */

import { FEATURE_FLAGS } from '@/config/featureFlags';
import {
  MOCK_APPROVALS,
  MOCK_APPROVAL_HISTORY,
  MOCK_MESSAGES_DATA,
  MOCK_ANALYTICS_DATA,
  MOCK_MESSAGE_STATS,
  MOCK_CHANNEL_COUNTS
} from '@/constants/mockData';

class MockDataService {
  /**
   * Get approval cards for current role
   */
  getApprovals(role: string): any[] {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) return [];
    if (!FEATURE_FLAGS.ENABLE_MOCK_APPROVALS) return [];
    if (role !== 'demo-work') return [];
    
    return MOCK_APPROVALS;
  }

  /**
   * Get approval history for current role
   */
  getApprovalHistory(role: string): any[] {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) return [];
    if (!FEATURE_FLAGS.ENABLE_MOCK_APPROVALS) return [];
    if (role !== 'demo-work') return [];
    
    return MOCK_APPROVAL_HISTORY;
  }

  /**
   * Get messages data for current role
   */
  getMessagesData(role: string): typeof MOCK_MESSAGES_DATA | null {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) return null;
    if (!FEATURE_FLAGS.ENABLE_MOCK_MESSAGES) return null;
    if (role !== 'demo-work') return null;
    
    return MOCK_MESSAGES_DATA;
  }

  /**
   * Get message stats for current role
   */
  getMessageStats(role: string): typeof MOCK_MESSAGE_STATS {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) {
      return {
        unreadMessages: 0,
        activePolls: 0,
        onlineUsers: 0,
        totalChannels: 0,
        notifications: 0,
        liveMeetingRequests: 0
      };
    }
    if (!FEATURE_FLAGS.ENABLE_MOCK_MESSAGES) {
      return {
        unreadMessages: 0,
        activePolls: 0,
        onlineUsers: 0,
        totalChannels: 0,
        notifications: 0,
        liveMeetingRequests: 0
      };
    }
    if (role !== 'demo-work') {
      return {
        unreadMessages: 0,
        activePolls: 0,
        onlineUsers: 0,
        totalChannels: 0,
        notifications: 0,
        liveMeetingRequests: 0
      };
    }
    
    return MOCK_MESSAGE_STATS;
  }

  /**
   * Get channel message counts for current role
   */
  getChannelCounts(role: string): typeof MOCK_CHANNEL_COUNTS | {} {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) return {};
    if (!FEATURE_FLAGS.ENABLE_MOCK_MESSAGES) return {};
    if (role !== 'demo-work') return {};
    
    return MOCK_CHANNEL_COUNTS;
  }

  /**
   * Get analytics data for current role
   */
  getAnalyticsData(role: string): typeof MOCK_ANALYTICS_DATA | null {
    if (!FEATURE_FLAGS.ENABLE_DEMO_DATA) return null;
    if (!FEATURE_FLAGS.ENABLE_MOCK_ANALYTICS) return null;
    if (role !== 'demo-work') return null;
    
    return MOCK_ANALYTICS_DATA;
  }

  /**
   * Get department stats for analytics
   */
  getDepartmentStats(role: string): any[] {
    const data = this.getAnalyticsData(role);
    return data?.departmentStats || [];
  }

  /**
   * Get monthly trends for analytics
   */
  getMonthlyTrends(role: string): any[] {
    const data = this.getAnalyticsData(role);
    return data?.monthlyTrends || [];
  }
}

export default new MockDataService();
