import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = process.env.DEFAULT_OPERATOR_PASSWORD || 'sbrm2026';

/**
 * POST /api/admin/create-operator
 * Creates a new operator account with default password.
 * Body: { email: string; full_name: string; contact_number?: string }
 */
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

    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.full_name || '').trim();
    const contactNumber = String(body.contact_number || '').trim();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify current logged-in user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Only admin can create operator
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can create operator accounts' },
        { status: 403 }
      );
    }

    // Create auth user with default password
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'operator',
          contact_number: contactNumber,
          must_reset_password: true,
        },
      });

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create/update profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: newUser.user.id,
          email,
          full_name: fullName,
          contact_number: contactNumber,
          role: 'operator',
          must_reset_password: true,
        },
        {
          onConflict: 'id',
        }
      );

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email,
        full_name: fullName,
        contact_number: contactNumber,
        role: 'operator',
        must_reset_password: true,
      },
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (err) {
    console.error('create-operator error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/create-operator
 * Deletes an operator account by user ID.
 * Body: { userId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify current logged-in user
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Only admin can delete operator
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can delete operator accounts' },
        { status: 403 }
      );
    }

    // Delete auth user
    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: deleteAuthError.message },
        { status: 400 }
      );
    }

    // Delete profile row too, in case no cascade is configured
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.warn('Profile delete warning:', deleteProfileError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete-operator error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}