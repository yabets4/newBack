// TypeScript interfaces for CRM intelligence additions
// Add to project for type references in TypeScript-aware editors

export interface Interaction {
  type: 'email' | 'call' | 'meeting' | 'doc_view' | string;
  timestamp: string; // ISO
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface LeadIntelligence {
  company_id: string;
  lead_id: string;
  lead_source?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  lead_score: number; // 0-100
  activity_logs?: any; // JSONB array
  conversion_probability: number; // percent 0-100
  interactions?: Interaction[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CustomerIntelligence {
  company_id: string;
  customer_id: string;
  lifetime_value: number;
  repeat_order_count: number;
  preferred_discount_range?: string | null;
  last_purchase_date?: string | null;
  customer_notes?: any; // JSONB
  interactions?: Interaction[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface QuoteItemIntelligence {
  company_id?: string;
  quote_id?: string;
  id?: number;
  cost_price: number;
  unit_price: number;
  quantity?: number;
  margin_amount: number;
  margin_percent: number; // 0-100
}

export interface AnalyticsInsights {
  conversion_rate: number; // percent
  avg_deal_time_days: number;
  avg_discount_percent: number;
  total_quotes: number;
  total_orders: number;
  lead_conversion_probabilities?: Array<{ lead_id: string; probability: number }>;
  product_profitability?: Array<{ product_id: string; profit: number }>; 
  sales_rep_performance?: Array<{ user_id: string; revenue: number }>; 
}
