export interface AssetInfo {
    chain: string;
    symbol: string;
    amount: number;
    price: number;
    value: number;
}

export interface DashboardData {
    totalUsd: number;
    assets: AssetInfo[];
    chainDistribution: Record<string, number>;
    bilibili: any[];
}
