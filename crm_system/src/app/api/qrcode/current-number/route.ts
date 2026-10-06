import { NextRequest, NextResponse } from "next/server";
import { peekNextSequence } from "@/types/qrCode";
import { getQRCodeCounterName, buildQRCodeNumber, padQRCodeNumber } from "@/lib/qrcodeNumber";
import { LocationCode } from "@/types/location";

// GET /api/qrcode/current-number?region=WC
export async function GET(request: NextRequest) {
  try {
    const region = request.nextUrl.searchParams.get("region") ?? "";

    // no region selected yet → nothing to preview
    if (!region) {
      return NextResponse.json({
        success: true,
        data: { currentNumber: "", qrCodeNumber: "", sequence: null },
      });
    }

    if (!Object.values(LocationCode).includes(region as LocationCode)) {
      return NextResponse.json(
        { success: false, message: "無效的地區編號" },
        { status: 400 }
      );
    }

    const sequence = await peekNextSequence(getQRCodeCounterName(region));

    return NextResponse.json({
      success: true,
      data: {
        currentNumber: padQRCodeNumber(sequence),          // "0007" (what the UI shows)
        qrCodeNumber: buildQRCodeNumber(sequence, region), // "0007_WC" (what gets stored)
        sequence,
      },
    });
  } catch (error) {
    console.error("獲取當前編號失敗:", error);
    return NextResponse.json(
      { success: false, message: "獲取當前編號失敗" },
      { status: 500 }
    );
  }
}