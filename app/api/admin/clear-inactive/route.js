import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server configuration error: Missing Service Role Key' }, { status: 500 });
        }

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

        // 1. Get all users from Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        // 2. Get all profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id');
        if (profilesError) throw profilesError;

        const profileIds = new Set(profiles.map(p => p.id));
        let deletedCount = 0;

        // 3. Find users without profiles (or other criteria if needed)
        // Note: MasterDummy doesn't have a profile in DB usually?? Or does he?
        // Wait, MasterDummy is not in Auth? MasterDummy is fake.
        // We should be careful not to delete real users who just signed up but haven't made a profile yet?
        // For this app, profile is made on signup. So safely we can delete orphans.

        for (const user of users) {
            if (!profileIds.has(user.id)) {
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                if (!deleteError) {
                    deletedCount++;
                } else {
                    console.error('Failed to delete user', user.id, deleteError);
                }
            }
        }

        return NextResponse.json({ message: 'Cleanup complete', count: deletedCount }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
