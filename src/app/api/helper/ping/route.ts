// app/api/helper/ping
import { NextResponse } from 'next/server';
import helperClient from '@/services/helperClient';

export async function GET() {
  const ok = await helperClient.ping();
  return NextResponse.json({ ok });
}
