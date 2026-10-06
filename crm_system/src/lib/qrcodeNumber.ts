// lib/qrcodeNumber.ts

/** 1 → "0001", 12345 → "12345" */
export function padQRCodeNumber(num: number): string {
  return num < 10000 ? num.toString().padStart(4, "0") : num.toString();
}

/** "0007_WC" → "0007" (old records without a suffix still work) */
export const getNumericCode = (qrCodeNumber: string): string =>
  qrCodeNumber.split("_")[0];

/** One counter row per region: "qrcode_number_WC" */
export const getQRCodeCounterName = (regionCode: string): string =>
  `qrcode_number_${regionCode}`;

/** (7, "WC") → "0007_WC" */
export const buildQRCodeNumber = (seq: number, regionCode: string): string =>
  `${padQRCodeNumber(seq)}_${regionCode}`;