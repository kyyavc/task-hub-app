
// Mock Supabase Client using LocalStorage
// Cleaned & Robust Version

const STORAGE_KEYS = {
    USERS: 'taskhub_users',
    PROFILES: 'taskhub_profiles',
    TASKS: 'taskhub_tasks',
    SESSION: 'taskhub_session'
};

// Helper: Get data from storage
const getStorage = (key) => {
    if (typeof window === 'undefined') return [];
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error('Mock Storage Read Error:', e);
        return [];
    }
};

// Helper: Set data to storage
const setStorage = (key, data) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Mock Storage Write Error:', e);
        }
    }
};

// Initialize default data
const initializeDefaults = () => {
    if (typeof window === 'undefined') return;

    // Ensure MasterDummy exists
    const profiles = getStorage(STORAGE_KEYS.PROFILES);
    if (!profiles.some(p => p.username === 'MasterDummy')) {
        const masterId = 'master-id-' + Date.now();
        const masterProfile = {
            id: masterId,
            username: 'MasterDummy',
            email: 'masterdummy@taskhub.local',
            role: 'admin',
            status: 'active'
        };
        const masterUser = {
            id: masterId,
            email: 'masterdummy@taskhub.local',
            password: 'MasterDummy@123',
            user_metadata: { username: 'MasterDummy' }
        };

        const users = getStorage(STORAGE_KEYS.USERS);
        setStorage(STORAGE_KEYS.PROFILES, [...profiles, masterProfile]);
        setStorage(STORAGE_KEYS.USERS, [...users, masterUser]);
    }

    // Backfill: Ensure profiles have 'settings' object
    const currentProfiles = getStorage(STORAGE_KEYS.PROFILES);
    let profilesChanged = false;
    const patchedProfiles = currentProfiles.map(p => {
        if (!p.settings) {
            profilesChanged = true;
            return {
                ...p,
                settings: {
                    notify_assignment: true,
                    notify_completion: true,
                    notify_due_date: true
                }
            };
        }
        return p;
    });

    if (profilesChanged) {
        setStorage(STORAGE_KEYS.PROFILES, patchedProfiles);
    }

    // Backfill: Ensure 'done' tasks have completed_at
    const tasks = getStorage(STORAGE_KEYS.TASKS);
    let tasksChanged = false;
    const patchedTasks = tasks.map(t => {
        if (t.status === 'done' && !t.completed_at) {
            tasksChanged = true;
            return { ...t, completed_at: t.created_at }; // Backfill with creation time
        }
        return t;
    });
    if (tasksChanged) {
        setStorage(STORAGE_KEYS.TASKS, patchedTasks);
    }
};

// Simulate Async Delay
const delay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

// Event Listeners for Auth State
const authListeners = [];

const notifyListeners = (event, session) => {
    authListeners.forEach(l => l(event, session));
};

export const supabase = {
    from: (table) => {
        const storageKey = table === 'profiles' ? STORAGE_KEYS.PROFILES :
            table === 'tasks' ? STORAGE_KEYS.TASKS : null;

        if (!storageKey) throw new Error(`Unknown table: ${table}`);

        return {
            select: (query) => {
                const builder = {
                    _filters: [],
                    _sort: null,
                    _single: false,

                    eq(col, val) {
                        this._filters.push(item => item[col] === val);
                        return this;
                    },
                    order(col, { ascending = true } = {}) {
                        this._sort = { col, ascending };
                        return this;
                    },
                    single() {
                        this._single = true;
                        return this;
                    },
                    async then(resolve, reject) {
                        await delay();
                        if (table === 'profiles') initializeDefaults();

                        let result = [...getStorage(storageKey)];

                        for (const filter of this._filters) {
                            result = result.filter(filter);
                        }

                        if (this._sort) {
                            const { col, ascending } = this._sort;
                            result.sort((a, b) => {
                                const valA = a[col] || '';
                                const valB = b[col] || '';
                                if (valA < valB) return ascending ? -1 : 1;
                                if (valA > valB) return ascending ? 1 : -1;
                                return 0;
                            });
                        }

                        if (this._single) {
                            resolve({ data: result.length > 0 ? result[0] : null, error: null });
                        } else {
                            resolve({ data: result, error: null });
                        }
                    }
                };
                return builder;
            },
            insert: (rows) => {
                const newRows = Array.isArray(rows) ? rows : [rows];
                const builder = {
                    _select: false,
                    _single: false,
                    select() {
                        this._select = true;
                        return this;
                    },
                    single() {
                        this._single = true;
                        return this;
                    },
                    async then(resolve, reject) {
                        await delay();
                        const currentData = getStorage(storageKey);
                        const inserted = newRows.map(r => ({
                            ...r,
                            id: r.id || crypto.randomUUID(),
                            created_at: new Date().toISOString()
                        }));
                        setStorage(storageKey, [...currentData, ...inserted]);

                        let data = inserted;
                        if (this._single && inserted.length > 0) {
                            data = inserted[0];
                        } else if (this._single && inserted.length === 0) {
                            data = null;
                        }

                        // Always return data in mock for simplicity/robustness unless specifically restricted?
                        // Supabase *only* returns data if select() is called. 
                        // But previous mock implementation ALWAY returned data. 
                        // To be safe and compatible with "select is not a function", we just provide the method.
                        // We continue returning data to avoid breaking other things expecting it.
                        resolve({ data, error: null });
                    }
                };
                return builder;
            },
            upsert: (rows) => {
                const newRows = Array.isArray(rows) ? rows : [rows];
                return {
                    async then(resolve, reject) {
                        await delay();
                        let currentData = getStorage(storageKey);
                        newRows.forEach(row => {
                            const idx = currentData.findIndex(item => item.id === row.id);
                            if (idx >= 0) {
                                currentData[idx] = { ...currentData[idx], ...row };
                            } else {
                                currentData.push({
                                    ...row,
                                    id: row.id || crypto.randomUUID(),
                                    created_at: new Date().toISOString()
                                });
                            }
                        });
                        setStorage(storageKey, currentData);
                        resolve({ data: null, error: null });
                    }
                };
            },
            update: (updates) => {
                const builder = {
                    _filters: [],
                    _select: false,
                    _single: false,
                    eq(col, val) {
                        this._filters.push(item => item[col] === val);
                        return this;
                    },
                    neq(col, val) {
                        this._filters.push(item => item[col] !== val);
                        return this;
                    },
                    select() {
                        this._select = true;
                        return this;
                    },
                    single() {
                        this._single = true;
                        return this;
                    },
                    async then(resolve, reject) {
                        await delay();
                        let currentData = getStorage(storageKey);
                        let updatedItems = [];

                        const newData = currentData.map(item => {
                            const match = builder._filters.every(f => f(item));
                            if (match) {
                                const updated = { ...item, ...updates };
                                updatedItems.push(updated);
                                return updated;
                            }
                            return item;
                        });

                        setStorage(storageKey, newData);

                        // Match Supabase return behavior: 
                        // If select() was called, return updated items.
                        // If not, data is null.
                        // For mock robustness, we default to returning data like before if simpler, 
                        // but strictly following valid types means data is null unless select is used.
                        // However, previous mock implementation returned null? 
                        // Wait, previous implementation `resolve({ data: null, error: null });` 
                        // So `update` returned NO data.
                        // But `TaskCard.js` calls `.select()`, implying it WANTS data.
                        // So if select() is present, we must return data.

                        let data = null;
                        if (builder._select) {
                            data = updatedItems;
                            if (builder._single && updatedItems.length > 0) {
                                data = updatedItems[0];
                            }
                        }

                        resolve({ data, error: null });
                    }
                };
                return builder;
            },
            delete: () => {
                const builder = {
                    _filters: [],
                    eq(col, val) {
                        this._filters.push(item => item[col] === val);
                        return this;
                    },
                    neq(col, val) {
                        this._filters.push(item => item[col] !== val);
                        return this;
                    },
                    lt(col, val) {
                        this._filters.push(item => item[col] < val);
                        return this;
                    },
                    lte(col, val) {
                        this._filters.push(item => item[col] <= val);
                        return this;
                    },
                    gt(col, val) {
                        this._filters.push(item => item[col] > val);
                        return this;
                    },
                    gte(col, val) {
                        this._filters.push(item => item[col] >= val);
                        return this;
                    },
                    async then(resolve, reject) {
                        await delay();
                        let currentData = getStorage(storageKey);

                        // Apply filters to find items to delete
                        const toDelete = currentData.filter(item => {
                            return builder._filters.every(f => f(item));
                        });

                        // Protection: MasterDummy
                        if (toDelete.some(target => target.username === 'MasterDummy' || (target.id && target.id.includes('master-id')))) {
                            resolve({ data: null, error: { message: 'Cannot delete Master Account' } });
                            return;
                        }

                        // Filter out items that match ALL filters (delete them)
                        // Note: We keep item if it does NOT match filters. 
                        // Actually easier: filter items where NOT (all filters match)
                        const newData = currentData.filter(item => {
                            const matches = builder._filters.every(f => f(item));
                            return !matches;
                        });

                        setStorage(storageKey, newData);
                        resolve({ data: toDelete, error: null });
                    }
                };
                return builder;
            }
        };
    },

    auth: {
        admin: {
            deleteUser: async (id) => {
                await delay();
                const users = getStorage(STORAGE_KEYS.USERS);
                const userToDelete = users.find(u => u.id === id);

                if (!userToDelete) {
                    return { data: null, error: { message: 'User not found' } };
                }

                if (userToDelete.email === 'masterdummy@taskhub.local') {
                    return { data: null, error: { message: 'Cannot delete Master Account' } };
                }

                const newUsers = users.filter(u => u.id !== id);
                setStorage(STORAGE_KEYS.USERS, newUsers);
                return { data: { user: userToDelete }, error: null };
            },
            deleteInactiveUsers: async () => {
                await delay();
                const users = getStorage(STORAGE_KEYS.USERS);
                const profiles = getStorage(STORAGE_KEYS.PROFILES);

                // Find users who do NOT have a profile
                // And are NOT MasterDummy
                const inactiveUsers = users.filter(u => {
                    if (u.email === 'masterdummy@taskhub.local') return false; // Protect Master
                    const hasProfile = profiles.some(p => p.id === u.id);
                    return !hasProfile;
                });

                if (inactiveUsers.length === 0) {
                    return { data: { count: 0 }, error: null };
                }

                const inactiveIds = inactiveUsers.map(u => u.id);
                const activeUsers = users.filter(u => !inactiveIds.includes(u.id));
                setStorage(STORAGE_KEYS.USERS, activeUsers);

                return { data: { count: inactiveUsers.length }, error: null };
            }
        },
        getSession: async () => {
            await delay();
            const sessionStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SESSION) : null;
            return { data: { session: sessionStr ? JSON.parse(sessionStr) : null }, error: null };
        },
        signUp: async ({ email, password, options }) => {
            await delay();
            const users = getStorage(STORAGE_KEYS.USERS);
            const profiles = getStorage(STORAGE_KEYS.PROFILES);

            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                // Check if it's a "zombie" (Auth exists, Profile missing)
                const hasProfile = profiles.some(p => p.id === existingUser.id);

                if (!hasProfile) {
                    // It's a zombie! Recover it.
                    // Return success so the UI proceeds to create the profile.
                    return { data: { user: existingUser, session: null }, error: null };
                }

                return { data: { user: null }, error: { message: 'User already exists' } };
            }

            const newUser = {
                id: crypto.randomUUID(),
                email,
                password, // Store for mock auth
                user_metadata: { username: options?.data?.username }
            };
            setStorage(STORAGE_KEYS.USERS, [...users, newUser]);

            // Auto signs in
            const session = { user: newUser, access_token: 'mock-token-' + Date.now() };
            // localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session)); // Usually signUp doesn't trigger session in Supabase if confirm needed, but here we assume yes? 
            // Actually, we usually want explicit login. Let's return user but not set session to be safe, forcing login.
            return { data: { user: newUser, session: null }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            await delay();
            initializeDefaults();
            const users = getStorage(STORAGE_KEYS.USERS);
            const user = users.find(u => u.email === email || (u.user_metadata?.username === email)); // Support username login

            if (user && user.password === password) {
                const session = { user, access_token: 'mock-token-' + Date.now() };
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
                    notifyListeners('SIGNED_IN', session);
                }
                return { data: { user, session }, error: null };
            }
            return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
        },
        onAuthStateChange: (callback) => {
            authListeners.push(callback);
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            const index = authListeners.indexOf(callback);
                            if (index > -1) authListeners.splice(index, 1);
                        }
                    }
                }
            };
        },
        signOut: async () => {
            await delay();
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.SESSION);
                localStorage.removeItem('master_session');
                notifyListeners('SIGNED_OUT', null);
            }
            return { error: null };
        }
    }
};
