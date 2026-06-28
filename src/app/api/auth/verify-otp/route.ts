import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP and returns a short-lived token if valid.
 * Body: { email: string; otp: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: isValid, error } = await supabase.rpc('verify_password_reset_otp', {
      p_email: email,
      p_otp: otp,
    });

    if (error) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
