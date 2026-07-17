export interface DashboardOrder { id: string; status: string; amount: number; createdAt: string; product: { name: string } }
export interface DashboardTransaction { id: string; type: string; direction: string; amount: number; balanceAfter: number; createdAt: string }
export interface WalletSummary {
  availableBalance: number;
  pendingBalance: number;
  lifetimeFunded: number;
  lifetimeSpent: number;
}

export interface DashboardStats {
  wallet: WalletSummary;
  orderStats: {
    pendingCount: number;
    completedCount: number;
  };
  recentOrders: DashboardOrder[];
  recentTransactions: DashboardTransaction[];
  actionLinks: {
    fundWallet: string;
    browseCatalog: string;
  };
}

export interface OrderStatusEvent {
  id: string;
  orderId: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  orderId: string | null;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'FUNDING' | 'PURCHASE' | 'FULFILLMENT' | 'REFUND' | 'SECURITY';
  read: boolean;
  createdAt: string;
}

export interface ReceiptRecord {
  id: string;
  reference: string;
  userId: string;
  type: 'FUNDING' | 'PURCHASE' | 'REFUND' | 'PAYMENT';
  amount: number;
  currency: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
