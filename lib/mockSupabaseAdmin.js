
// In-memory storage for the session
let mockStore = {
    profiles: [
        { id: 'user-1', username: 'StandardUser', email: 'user@test.com', role: 'member', status: 'active', created_at: new Date().toISOString() },
        { id: 'user-2', username: 'PendingGuy', email: 'pending@test.com', role: 'member', status: 'pending', created_at: new Date().toISOString() }
    ],
    tasks: [],
    session: null
};

export const mockSupabase = {
    auth: {
        getSession: () => Promise.resolve({ data: { session: mockStore.session } }),
        onAuthStateChange: (cb) => {
            // Mock listener
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signInWithPassword: ({ email, password }) => {
            // Simple mock login
            const user = mockStore.profiles.find(p => p.email === email);
            if (user) {
                mockStore.session = { user: { id: user.id, email: user.email } };
                return Promise.resolve({ data: { session: mockStore.session }, error: null });
            }
            return Promise.resolve({ error: { message: 'Invalid login' } });
        },
        signUp: ({ email, options }) => {
            const newUser = {
                id: `user-${Date.now()}`,
                email,
                username: options.data.username,
                role: 'member',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            mockStore.profiles.push(newUser);
            return Promise.resolve({ data: { user: { id: newUser.id, email } }, error: null });
        },
        signOut: () => {
            mockStore.session = null;
            return Promise.resolve({ error: null });
        }
    },
    from: (table) => {
        return {
            select: (columns) => {
                return {
                    order: (col) => {
                        return {
                            single: () => { // For 'profile' fetch checks
                                // Hacky context check: usually finding by ID
                                return Promise.resolve({ data: mockStore[table][0] || null, error: null });
                            },
                            then: (resolve) => resolve({ data: mockStore[table], error: null }) // List return
                        }
                    },
                    eq: (col, val) => {
                        // Filter
                        const res = mockStore[table].filter(i => i[col] === val);
                        return {
                            single: () => Promise.resolve({ data: res[0] || null, error: null }), // Single item
                            then: (resolve) => resolve({ data: res, error: null })
                        }
                    }
                };
            },
            insert: (rows) => {
                const newRows = rows.map(r => ({ ...r, id: `new-${Date.now()}` }));
                mockStore[table].push(...newRows);
                return Promise.resolve({ data: newRows, error: null });
            },
            update: (updates) => {
                return {
                    eq: (col, val) => {
                        const idx = mockStore[table].findIndex(i => i[col] === val);
                        if (idx !== -1) {
                            mockStore[table][idx] = { ...mockStore[table][idx], ...updates };
                        }
                        return Promise.resolve({ error: null });
                    }
                }
            },
            delete: () => {
                return {
                    eq: (col, val) => {
                        mockStore[table] = mockStore[table].filter(i => i[col] !== val);
                        return Promise.resolve({ error: null });
                    }
                }
            },
            upsert: (rows) => { // For AddMemberModal
                rows.forEach(row => {
                    mockStore[table].push(row);
                });
                return Promise.resolve({ error: null });
            }
        };
    }
};
