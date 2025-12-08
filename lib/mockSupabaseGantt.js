
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

let mockStore = {
    profiles: [
        { id: 'user-1', username: 'TestUser', email: 'test@user.com', role: 'member', status: 'active' }
    ],
    tasks: [
        {
            id: '1', title: 'Existing Task', description: 'Just a normal task', status: 'todo',
            start_date: today.toISOString(), due_date: tomorrow.toISOString(),
            created_at: new Date().toISOString()
        }
    ],
    session: { user: { id: 'user-1', email: 'test@user.com' } } // Auto-logged in for speed
};

export const mockSupabase = {
    auth: {
        getSession: () => Promise.resolve({ data: { session: mockStore.session } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: () => Promise.resolve({ data: { session: mockStore.session }, error: null }),
        signOut: () => Promise.resolve({ error: null })
    },
    from: (table) => {
        return {
            select: (cols) => ({
                order: () => Promise.resolve({ data: mockStore[table], error: null }),
                single: () => Promise.resolve({ data: mockStore[table][0], error: null }) // simplified
            }),
            insert: (rows) => {
                const newRows = rows.map(r => ({
                    ...r,
                    id: `new-${Date.now()}`,
                    created_at: new Date().toISOString()
                }));
                mockStore[table].push(...newRows);
                return {
                    select: () => ({
                        single: () => Promise.resolve({ data: newRows[0], error: null })
                    })
                };
            },
            // minimal stubs for others if needed
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) })
        };
    }
};
