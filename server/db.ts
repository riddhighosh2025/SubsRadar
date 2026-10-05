import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  BillingCycle,
  HistoricalBurnPoint,
  SavedScenario,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
  User,
  UserFinancialProfile,
  normalizeCategoryEnum,
} from '../src/types/subscription.ts';

interface DatabaseSchema {
  user: User;
  users: User[];
  subscriptions: Subscription[];
  savedScenarios: SavedScenario[];
  customCategories: string[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'subsradar-db.json');

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('RadarPass2026!', 10);

export const DEFAULT_HISTORICAL_BURN: HistoricalBurnPoint[] = [
  { month: "Nov '25", subscriptionBurn: 980.0, targetBurn: 500.0 },
  { month: "Dec '25", subscriptionBurn: 1025.5, targetBurn: 500.0 },
  { month: "Jan '26", subscriptionBurn: 960.0, targetBurn: 500.0 },
  { month: "Feb '26", subscriptionBurn: 915.0, targetBurn: 500.0 },
  { month: "Mar '26", subscriptionBurn: 890.0, targetBurn: 500.0 },
  { month: "Apr '26", subscriptionBurn: 845.5, targetBurn: 500.0 },
  { month: "May '26", subscriptionBurn: 820.0, targetBurn: 500.0 },
  { month: "Jun '26", subscriptionBurn: 795.0, targetBurn: 500.0 },
  { month: "Jul '26", subscriptionBurn: 785.0, targetBurn: 500.0 },
  { month: "Aug '26", subscriptionBurn: 774.88, targetBurn: 500.0 },
  { month: "Sep '26", subscriptionBurn: 768.88, targetBurn: 500.0 },
  { month: "Oct '26", subscriptionBurn: 758.88, targetBurn: 500.0 },
];

export const DEFAULT_FINANCIAL_PROFILE: UserFinancialProfile = {
  currency: 'USD',
  totalEarnings: 9200,
  monthlyExpenditure: 4350,
  monthlySavingGoal: 2200,
  historicalBurn: DEFAULT_HISTORICAL_BURN,
};

const SEED_USER: User = {
  id: 'usr_radar_01',
  email: 'alex.mercer@workspace.local',
  name: 'Alex Mercer',
  passwordHash: DEFAULT_PASSWORD_HASH,
  createdAt: '2026-01-15T09:00:00.000Z',
  financialProfile: DEFAULT_FINANCIAL_PROFILE,
};

const SEED_SUBSCRIPTIONS: Subscription[] = [
  // Quadrant 1: Danger Zone (High Cost >= $45, Low Usage < 12 days/mo)
  {
    id: 'sub_equinox',
    userId: 'usr_radar_01',
    name: 'Equinox All-Access Club',
    category: 'HEALTH',
    monthlyCost: 215.0,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-18T00:00:00.000Z',
    usageFrequency: 3,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.equinox.com/help/membership',
  },
  {
    id: 'sub_adobe_cc',
    userId: 'usr_radar_01',
    name: 'Adobe Creative Cloud Pro',
    category: 'SaaS',
    monthlyCost: 59.99,
    billingCycle: 'ANNUAL',
    renewalDate: '2026-11-02T00:00:00.000Z',
    usageFrequency: 4,
    status: 'ACTIVE',
    cancellationUrl: 'https://account.adobe.com/plans',
  },
  {
    id: 'sub_linkedin_sales',
    userId: 'usr_radar_01',
    name: 'LinkedIn Sales Navigator',
    category: 'SaaS',
    monthlyCost: 99.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-24T00:00:00.000Z',
    usageFrequency: 2,
    status: 'CANCELING',
    cancellationUrl: 'https://www.linkedin.com/mypreferences/d/manage-subscription',
  },
  {
    id: 'sub_bloomberg_terminal',
    userId: 'usr_radar_01',
    name: 'Bloomberg Market Pro Feed',
    category: 'FINANCE',
    monthlyCost: 48.0,
    billingCycle: 'ANNUAL',
    renewalDate: '2026-10-29T00:00:00.000Z',
    usageFrequency: 1,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.bloomberg.com/account',
  },

  // Quadrant 2: High Value (High Cost >= $45, High Usage >= 12 days/mo)
  {
    id: 'sub_aws_dev',
    userId: 'usr_radar_01',
    name: 'AWS Staging & GPU Cluster',
    category: 'UTILITIES',
    monthlyCost: 142.5,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-31T00:00:00.000Z',
    usageFrequency: 28,
    status: 'ACTIVE',
    cancellationUrl: 'https://console.aws.amazon.com/billing/home',
  },
  {
    id: 'sub_whoop_pro',
    userId: 'usr_radar_01',
    name: 'Eight Sleep Pod Autopilot',
    category: 'HEALTH',
    monthlyCost: 55.0,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-11-10T00:00:00.000Z',
    usageFrequency: 29,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.eightsleep.com/account',
  },
  {
    id: 'sub_figma_org',
    userId: 'usr_radar_01',
    name: 'Figma Full Design Seat',
    category: 'SaaS',
    monthlyCost: 45.0,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-21T00:00:00.000Z',
    usageFrequency: 22,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.figma.com/settings',
  },

  // Quadrant 3: Silent Leaks (Low Cost < $45, Low Usage < 12 days/mo)
  {
    id: 'sub_Audible',
    userId: 'usr_radar_01',
    name: 'Audible Premium Plus',
    category: 'ENTERTAINMENT',
    monthlyCost: 16.45,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-14T00:00:00.000Z',
    usageFrequency: 1,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.audible.com/account/overview',
  },
  {
    id: 'sub_copilot_finance',
    userId: 'usr_radar_01',
    name: 'Monarch Wealth Tracker',
    category: 'FINANCE',
    monthlyCost: 14.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-19T00:00:00.000Z',
    usageFrequency: 3,
    status: 'ACTIVE',
    cancellationUrl: 'https://app.monarchmoney.com/settings/billing',
  },
  {
    id: 'sub_paramount',
    userId: 'usr_radar_01',
    name: 'Paramount+ with SHOWTIME',
    category: 'ENTERTAINMENT',
    monthlyCost: 12.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-27T00:00:00.000Z',
    usageFrequency: 2,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.paramountplus.com/account/',
  },
  {
    id: 'sub_dropbox',
    userId: 'usr_radar_01',
    name: 'Dropbox Plus 2TB Vault',
    category: 'UTILITIES',
    monthlyCost: 11.99,
    billingCycle: 'ANNUAL',
    renewalDate: '2026-11-15T00:00:00.000Z',
    usageFrequency: 4,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.dropbox.com/account/plan',
  },

  // Quadrant 4: Bargain (Low Cost < $45, High Usage >= 12 days/mo)
  {
    id: 'sub_spotify',
    userId: 'usr_radar_01',
    name: 'Spotify Duo Lossless',
    category: 'ENTERTAINMENT',
    monthlyCost: 16.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-20T00:00:00.000Z',
    usageFrequency: 27,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
  },
  {
    id: 'sub_github_copilot',
    userId: 'usr_radar_01',
    name: 'GitHub Copilot Pro',
    category: 'SaaS',
    monthlyCost: 10.0,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-25T00:00:00.000Z',
    usageFrequency: 26,
    status: 'ACTIVE',
    cancellationUrl: 'https://github.com/settings/billing',
  },
  {
    id: 'sub_netflix',
    userId: 'usr_radar_01',
    name: 'Netflix 4K Ultra HD',
    category: 'ENTERTAINMENT',
    monthlyCost: 22.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-22T00:00:00.000Z',
    usageFrequency: 16,
    status: 'ACTIVE',
    cancellationUrl: 'https://www.netflix.com/youraccount',
  },
  {
    id: 'sub_icloud',
    userId: 'usr_radar_01',
    name: 'Apple iCloud+ 2TB Storage',
    category: 'UTILITIES',
    monthlyCost: 9.99,
    billingCycle: 'MONTHLY',
    renewalDate: '2026-10-12T00:00:00.000Z',
    usageFrequency: 30,
    status: 'ACTIVE',
    cancellationUrl: 'https://support.apple.com/en-us/HT202039',
  },
];

const SEED_SCENARIOS: SavedScenario[] = [
  {
    id: 'scen_danger_purge',
    userId: 'usr_radar_01',
    name: 'Purge Danger Zone (4 Unused High-Ticket)',
    targetSavings: 422.98,
    canceledSubscriptionIds: [
      'sub_equinox',
      'sub_adobe_cc',
      'sub_linkedin_sales',
      'sub_bloomberg_terminal',
    ],
    annualROI: 30282.34,
    createdAt: '2026-10-01T14:20:00.000Z',
  },
  {
    id: 'scen_silent_leaks',
    userId: 'usr_radar_01',
    name: 'Plug Silent Media & Finance Leaks',
    targetSavings: 56.42,
    canceledSubscriptionIds: [
      'sub_Audible',
      'sub_copilot_finance',
      'sub_paramount',
      'sub_dropbox',
    ],
    annualROI: 4039.25,
    createdAt: '2026-10-02T18:05:00.000Z',
  },
];

function migrateSchema(parsed: Partial<DatabaseSchema>): DatabaseSchema {
  const users: User[] =
    Array.isArray(parsed.users) && parsed.users.length > 0
      ? parsed.users.map((u) => ({
          ...u,
          passwordHash: u.passwordHash || DEFAULT_PASSWORD_HASH,
          financialProfile: u.financialProfile
            ? {
                ...DEFAULT_FINANCIAL_PROFILE,
                ...u.financialProfile,
                currency: u.financialProfile.currency || 'USD',
              }
            : { ...DEFAULT_FINANCIAL_PROFILE },
        }))
      : [SEED_USER];

  const primaryUser = parsed.user
    ? {
        ...parsed.user,
        passwordHash: parsed.user.passwordHash || DEFAULT_PASSWORD_HASH,
        financialProfile: parsed.user.financialProfile
          ? {
              ...DEFAULT_FINANCIAL_PROFILE,
              ...parsed.user.financialProfile,
              currency: parsed.user.financialProfile.currency || 'USD',
            }
          : { ...DEFAULT_FINANCIAL_PROFILE },
      }
    : users[0];

  const subscriptions: Subscription[] = Array.isArray(parsed.subscriptions)
    ? parsed.subscriptions.map((s) => ({
        ...s,
        category: normalizeCategoryEnum(s.category),
      }))
    : [...SEED_SUBSCRIPTIONS];

  const savedScenarios: SavedScenario[] = Array.isArray(parsed.savedScenarios)
    ? parsed.savedScenarios
    : [...SEED_SCENARIOS];

  const customCategories: string[] = Array.isArray(parsed.customCategories)
    ? parsed.customCategories
    : ['AI & Compute', 'Home Automation'];

  return {
    user: primaryUser,
    users,
    subscriptions,
    savedScenarios,
    customCategories,
  };
}

function ensureDbFile(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      user: SEED_USER,
      users: [SEED_USER],
      subscriptions: [...SEED_SUBSCRIPTIONS],
      savedScenarios: [...SEED_SCENARIOS],
      customCategories: ['AI & Compute', 'Home Automation'],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return migrateSchema(parsed);
  } catch {
    const fallback: DatabaseSchema = {
      user: SEED_USER,
      users: [SEED_USER],
      subscriptions: [...SEED_SUBSCRIPTIONS],
      savedScenarios: [...SEED_SCENARIOS],
      customCategories: ['AI & Compute', 'Home Automation'],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function writeDbFile(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  getState(userId?: string): {
    user: User;
    subscriptions: Subscription[];
    savedScenarios: SavedScenario[];
    customCategories: string[];
  } {
    const state = ensureDbFile();
    const targetUser =
      (userId && state.users.find((u) => u.id === userId)) || state.user || state.users[0];

    const userSubs = state.subscriptions.filter((s) => s.userId === targetUser.id);
    const userScenarios = state.savedScenarios.filter((sc) => sc.userId === targetUser.id);

    return {
      user: targetUser,
      subscriptions: userSubs,
      savedScenarios: userScenarios,
      customCategories: state.customCategories,
    };
  },

  resetToSeed(userId?: string): DatabaseSchema {
    const state = ensureDbFile();
    const targetId = userId || SEED_USER.id;

    // Remove target user's old subs and replace with fresh seed copies
    const otherSubs = state.subscriptions.filter((s) => s.userId !== targetId);
    const freshUserSubs = SEED_SUBSCRIPTIONS.map((s) => ({
      ...s,
      id: targetId === SEED_USER.id ? s.id : `${s.id}_${targetId.slice(-4)}`,
      userId: targetId,
    }));

    state.subscriptions = [...freshUserSubs, ...otherSubs];
    if (targetId === SEED_USER.id) {
      state.savedScenarios = [...SEED_SCENARIOS];
    }
    writeDbFile(state);
    return state;
  },

  findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return ensureDbFile().users.find((u) => u.email.toLowerCase() === normalized);
  },

  findUserById(id: string): User | undefined {
    return ensureDbFile().users.find((u) => u.id === id);
  },

  createUser(input: {
    email: string;
    name: string;
    passwordHash: string;
    financialProfile?: Partial<UserFinancialProfile>;
    seedStarterSubscriptions?: boolean;
  }): User {
    const state = ensureDbFile();
    const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const profile: UserFinancialProfile = {
      currency: input.financialProfile?.currency?.trim() || 'USD',
      totalEarnings: Number(input.financialProfile?.totalEarnings) || 8500,
      monthlyExpenditure: Number(input.financialProfile?.monthlyExpenditure) || 3800,
      monthlySavingGoal: Number(input.financialProfile?.monthlySavingGoal) || 2000,
      historicalBurn:
        Array.isArray(input.financialProfile?.historicalBurn) &&
        input.financialProfile!.historicalBurn.length > 0
          ? input.financialProfile!.historicalBurn
          : DEFAULT_HISTORICAL_BURN.map((pt) => ({ ...pt })),
    };

    const newUser: User = {
      id: newId,
      email: input.email.trim().toLowerCase(),
      name: input.name.trim() || input.email.split('@')[0],
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
      financialProfile: profile,
    };

    state.users.push(newUser);
    state.user = newUser;

    // Optionally seed starter subscriptions if requested so the matrix has immediate visual nodes
    if (input.seedStarterSubscriptions !== false) {
      const clonedSubs = SEED_SUBSCRIPTIONS.slice(0, 8).map((s, idx) => ({
        ...s,
        id: `sub_${Date.now()}_${idx}`,
        userId: newId,
      }));
      state.subscriptions.push(...clonedSubs);
    }

    writeDbFile(state);
    return newUser;
  },

  updateFinancialProfile(
    userId: string,
    updates: Partial<UserFinancialProfile>
  ): UserFinancialProfile | null {
    const state = ensureDbFile();
    const uIdx = state.users.findIndex((u) => u.id === userId);
    const targetUser = uIdx !== -1 ? state.users[uIdx] : state.user;
    if (!targetUser) return null;

    const currentProfile = targetUser.financialProfile || { ...DEFAULT_FINANCIAL_PROFILE };
    const updatedProfile: UserFinancialProfile = {
      currency:
        updates.currency !== undefined && updates.currency.trim()
          ? updates.currency.trim()
          : currentProfile.currency || 'USD',
      totalEarnings:
        updates.totalEarnings !== undefined
          ? Number(updates.totalEarnings)
          : currentProfile.totalEarnings,
      monthlyExpenditure:
        updates.monthlyExpenditure !== undefined
          ? Number(updates.monthlyExpenditure)
          : currentProfile.monthlyExpenditure,
      monthlySavingGoal:
        updates.monthlySavingGoal !== undefined
          ? Number(updates.monthlySavingGoal)
          : currentProfile.monthlySavingGoal,
      historicalBurn: Array.isArray(updates.historicalBurn)
        ? updates.historicalBurn
        : currentProfile.historicalBurn,
    };

    targetUser.financialProfile = updatedProfile;
    if (uIdx !== -1) {
      state.users[uIdx] = targetUser;
    }
    if (state.user.id === targetUser.id) {
      state.user = targetUser;
    }

    writeDbFile(state);
    return updatedProfile;
  },

  addCustomCategory(label: string): string[] {
    const clean = label.trim();
    if (!clean) return ensureDbFile().customCategories;
    const state = ensureDbFile();
    if (!state.customCategories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      state.customCategories.push(clean);
      writeDbFile(state);
    }
    return state.customCategories;
  },

  getSubscriptions(userId?: string): Subscription[] {
    const state = ensureDbFile();
    const targetId = userId || state.user.id;
    return state.subscriptions.filter((s) => s.userId === targetId);
  },

  createSubscription(input: {
    userId?: string;
    name: string;
    category: SubscriptionCategory | string;
    customCategory?: string;
    monthlyCost: number;
    billingCycle?: BillingCycle;
    renewalDate?: string;
    usageFrequency?: number;
    status?: SubscriptionStatus;
    cancellationUrl?: string;
  }): Subscription {
    const state = ensureDbFile();
    const enumCat = normalizeCategoryEnum(input.category);
    const customCat = input.customCategory?.trim() || undefined;
    if (customCat && !state.customCategories.includes(customCat)) {
      state.customCategories.push(customCat);
    }

    const ownerId = input.userId || state.user.id;

    const newSub: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: ownerId,
      name: input.name.trim(),
      category: enumCat,
      customCategory: customCat,
      monthlyCost: Number(input.monthlyCost) || 0,
      billingCycle: input.billingCycle || 'MONTHLY',
      renewalDate: input.renewalDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      usageFrequency:
        input.usageFrequency !== undefined
          ? Math.max(0, Math.min(30, Number(input.usageFrequency)))
          : 5,
      status: input.status || 'ACTIVE',
      cancellationUrl: input.cancellationUrl || undefined,
    };
    state.subscriptions.unshift(newSub);
    writeDbFile(state);
    return newSub;
  },

  updateSubscription(
    id: string,
    updates: Partial<Omit<Subscription, 'id' | 'userId'>>
  ): Subscription | null {
    const state = ensureDbFile();
    const idx = state.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const current = state.subscriptions[idx];
    const nextCategory =
      updates.category !== undefined ? normalizeCategoryEnum(updates.category) : current.category;
    const nextCustomCategory =
      updates.customCategory !== undefined
        ? updates.customCategory.trim() || undefined
        : current.customCategory;

    if (nextCustomCategory && !state.customCategories.includes(nextCustomCategory)) {
      state.customCategories.push(nextCustomCategory);
    }

    const updated: Subscription = {
      ...current,
      ...updates,
      category: nextCategory,
      customCategory: nextCustomCategory,
      monthlyCost:
        updates.monthlyCost !== undefined ? Number(updates.monthlyCost) : current.monthlyCost,
      usageFrequency:
        updates.usageFrequency !== undefined
          ? Math.max(0, Math.min(30, Number(updates.usageFrequency)))
          : current.usageFrequency,
    };
    state.subscriptions[idx] = updated;
    writeDbFile(state);
    return updated;
  },

  deleteSubscription(id: string): boolean {
    const state = ensureDbFile();
    const prevLen = state.subscriptions.length;
    state.subscriptions = state.subscriptions.filter((s) => s.id !== id);
    if (state.subscriptions.length === prevLen) return false;
    writeDbFile(state);
    return true;
  },

  getScenarios(userId?: string): SavedScenario[] {
    const state = ensureDbFile();
    const targetId = userId || state.user.id;
    return state.savedScenarios.filter((sc) => sc.userId === targetId);
  },

  createScenario(input: {
    userId?: string;
    name: string;
    targetSavings: number;
    canceledSubscriptionIds: string[];
    annualROI: number;
  }): SavedScenario {
    const state = ensureDbFile();
    const scenario: SavedScenario = {
      id: `scen_${Date.now()}`,
      userId: input.userId || state.user.id,
      name: input.name || 'Custom Cut Plan',
      targetSavings: Number(input.targetSavings) || 0,
      canceledSubscriptionIds: Array.isArray(input.canceledSubscriptionIds)
        ? input.canceledSubscriptionIds
        : [],
      annualROI: Number(input.annualROI) || 0,
      createdAt: new Date().toISOString(),
    };
    state.savedScenarios.unshift(scenario);
    writeDbFile(state);
    return scenario;
  },

  deleteScenario(id: string): boolean {
    const state = ensureDbFile();
    const prev = state.savedScenarios.length;
    state.savedScenarios = state.savedScenarios.filter((sc) => sc.id !== id);
    if (state.savedScenarios.length === prev) return false;
    writeDbFile(state);
    return true;
  },
};
