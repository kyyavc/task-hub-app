import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Initialize Supabase Admin Client
        // Note: This requires the SERVICE_ROLE_KEY to be set in environment variables
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Unassign tasks first (to avoid FK constraints on Profiles)
        // Using service key allows bypassing RLS
        const { error: tasksError } = await supabaseAdmin
            .from('tasks')
            .update({ assignee_id: null })
            .eq('assignee_id', id);

        if (tasksError) {
            console.error('Error unassigning tasks:', tasksError);
            // Verify if we should proceed. Usually yes, maybe user had no tasks.
        }

        // 2. Delete from Profiles (public table)
        // This must happen before Auth delete if FK is restricted
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            return NextResponse.json({ error: 'Failed to delete profile: ' + profileError.message }, { status: 500 });
        }

        // 3. Delete from Auth (users table)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return NextResponse.json({ error: 'Failed to delete auth user: ' + authError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'User and associated data cleared successfully' }, { status: 200 });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
