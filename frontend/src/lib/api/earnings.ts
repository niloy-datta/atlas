import { atlasApi } from "./client";

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface EarningByJobType {
  category: string;
  percentage: number;
  colorHex: string;
}

export interface RecentTransaction {
  id: string;
  date: string;
  role: string;
  client: string;
  amount: number;
  status: string;
}

export interface EarningsGoal {
  target: number;
  current: number;
  progressPercent: number;
}

export interface WorkerEarningsSummary {
  currency: string;
  totalEarnings: number;
  completedShifts: number;
  averagePerShift: number;
  pendingPayment: number;
  availableBalance: number;
  monthlyOverview: MonthlyEarning[];
  earningsByJobType: EarningByJobType[];
  recentTransactions: RecentTransaction[];
  goal: EarningsGoal;
}

export interface WithdrawRequest {
  amount: number;
  method: string;
  accountNumber: string;
}

export interface WithdrawResponse {
  transactionId: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  timestamp: string;
  message: string;
}

export async function getWorkerEarnings(currency = "BDT"): Promise<WorkerEarningsSummary> {
  return atlasApi.get<WorkerEarningsSummary>(`/api/v1/workers/me/earnings?currency=${encodeURIComponent(currency)}`, false);
}

export async function withdrawEarnings(payload: WithdrawRequest): Promise<WithdrawResponse> {
  return atlasApi.post<WithdrawResponse>("/api/v1/workers/me/earnings/withdraw", payload, false);
}
