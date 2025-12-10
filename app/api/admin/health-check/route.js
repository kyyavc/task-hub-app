import { NextResponse } from 'next/server';

export async function GET(request) {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyLength = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0;

    return NextResponse.json({
        status: hasServiceKey ? 'ok' : 'error',
        message: hasServiceKey ? 'Service Role Key is configured.' : 'Service Role Key is MISSING.',
        key_configured: hasServiceKey,
        key_length: keyLength
    }, { status: 200 }); // Always 200 to ensure client sees the body
}
