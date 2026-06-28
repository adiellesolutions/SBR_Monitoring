import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

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
    const { newPassword } = await req.json();

    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const { error: passwordError } =
      await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError.message },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        must_reset_password: false,
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
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('change-default-password error:', error);

    return NextResponse.json(
      { error: 'Something went wrong while changing password' },
      { status: 500 }
    );
  }
}