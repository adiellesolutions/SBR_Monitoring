import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/reset-password
 * Resets the user's password after OTP verification.
 * Body: { email: string; newPassword: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
    }
    const user = users.users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Clear must_reset_password flag if set
    await supabase
      .from('profiles')
      .update({ must_reset_password: false })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
