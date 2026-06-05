import { NextRequest, NextResponse } from "next/server";
import { getRecord } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { callId: string } }
): Promise<NextResponse> {
  const { callId } = params;
  const record = getRecord(callId);

  if (!record) {
    return NextResponse.json({ error: `No data found for callId: ${callId}` }, { status: 404 });
  }

  if (!record.analysis) {
    return NextResponse.json({
      callId,
      status: "pending",
      message: "Transcript received but analysis is not yet complete. Try again shortly.",
      receivedAt: record.receivedAt,
    });
  }

  return NextResponse.json({
    callId,
    status: "complete",
    analysis: record.analysis,
    analyzedAt: record.analyzedAt,
    receivedAt: record.receivedAt,
  });
}
