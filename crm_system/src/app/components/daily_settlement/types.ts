// types.ts

export type CenterCode = 'WC' | 'SM' | 'DM';

export type IncomeType = '試' | '單' | '卡';

export type SectionType =
  | 'waterbar'
  | 'class'
  | 'introductionFee'
  | 'income';

export interface StaffOption {
  value: string;
  label: string;
}

export interface CenterOption {
  value: CenterCode;
  label: string;
}

export interface IncomeOption {
  value: IncomeType;
  label: string;
}

export interface SettlementConfig {
  centers: CenterOption[];

  staff: StaffOption[];

  incomeTypes: IncomeOption[];

  sections: {
    type: SectionType;
    label: string;
    maxRows: number;
    kind: 'staff' | 'income';
  }[];
}

export const SETTLEMENT_CONFIG: SettlementConfig = {
  centers: [
    { value: 'WC', label: '灣仔' },
    { value: 'SM', label: '石門' },
    { value: 'DM', label: '大馬' },
  ],

  staff: [
    { value: 'CY', label: 'CY' },
    { value: 'KW', label: 'KW' },
    { value: 'EY', label: 'EY' },
    { value: 'FF', label: 'FF' },
  ],

  incomeTypes: [
    { value: '試', label: '試' },
    { value: '單', label: '單' },
    { value: '卡', label: '卡' },
  ],

  sections: [
    {
      type: 'waterbar',
      label: '1. 水吧項目',
      maxRows: 5,
      kind: 'staff',
    },
    {
      type: 'class',
      label: '2. 教班 (人數)',
      maxRows: 5,
      kind: 'staff',
    },
    {
      type: 'introductionFee',
      label: '3. 介紹費',
      maxRows: 5,
      kind: 'staff',
    },
    {
      type: 'income',
      label: '4. 每日收入明細',
      maxRows: 5,
      kind: 'income',
    },
  ],
};