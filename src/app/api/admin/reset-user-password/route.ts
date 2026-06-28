import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = process.env.DEFAULT_OPERATOR_PASSWORD || 'sbrm2026';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const body = await req.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify current logged-in user using token
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can reset user passwords' },
        { status: 403 }
      );
    }

    // Reset selected user's password to default
    const { error: passwordError } =
      await supabase.auth.admin.updateUserById(userId, {
        password: DEFAULT_PASSWORD,
        user_metadata: {
          must_reset_password: true,
        },
      });

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError.message },
        { status: 500 }
      );
    }

    // Mark profile as required to change password
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        must_reset_password: true,
      })
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset to default successfully',
    });
  } catch (error) {
    console.error('reset-user-password error:', error);

    return NextResponse.json(
      { error: 'Something went wrong while resetting password' },
      { status: 500 }
    );
  }
}