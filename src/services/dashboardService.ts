import { DashboardStats, RevenueByService } from '../types';
import { mockDashboardStats, mockRevenueByService } from '../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get dashboard statistics
 * Backend API: GET /api/dashboard/stats
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<DashboardStats>(API_ENDPOINTS.DASHBOARD_STATS);
  return mockDashboardStats;
}

/**
 * Get revenue by service
 * Backend API: GET /api/dashboard/revenue-by-service
 */
export async function getRevenueByService(): Promise<RevenueByService[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<RevenueByService[]>(API_ENDPOINTS.REVENUE_BY_SERVICE);
  return mockRevenueByService;
}
