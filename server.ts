import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { db } from './server/db.ts';
import {
  BillingCycle,
  CancellationScriptRequest,
  CancellationScriptResponse,
  GroundingSource,
  ParsedStatementItem,
  SubscriptionCategory,
  UserFinancialProfile,
  formatCurrency,
  normalizeCategoryEnum,
} from './src/types/subscription.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const JWT_SECRET = process.env.JWT_SECRET || 'subsradar-local-privacy-jwt-secret-2026';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  auth?: JwtPayload;
}

function getOptionalUserId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded.userId;
  } catch {
    return undefined;
  }
}

function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Provide a valid Bearer JWT in the Authorization header.',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Invalid or expired JWT token. Please log in again.',
    });
  }
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGroundingSources(response: GenerateContentResponse): GroundingSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title || uri || 'Verified Web Source';
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ title, uri });
    }
  }
  return sources;
}

async function callOllamaGemma(prompt: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        format: 'json',
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { response?: string };
    return data.response || null;
  } catch {
    return null;
  }
}

function analyzeRenewalTiming(renewalDate?: string, billingCycle: BillingCycle = 'MONTHLY') {
  const parsedDate = renewalDate ? new Date(renewalDate) : new Date(Date.now() + 14 * 86400000);
  const validDate = isNaN(parsedDate.getTime())
    ? new Date(Date.now() + 14 * 86400000)
    : parsedDate;

  const formattedRenewalDate = validDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const diffMs = validDate.getTime() - Date.now();
  const daysUntilRenewal = Math.max(0, Math.ceil(diffMs / 86400000));

  const safeCutoffDate = new Date(validDate.getTime() - 3 * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const scheduleAdvice =
    billingCycle === 'ANNUAL'
      ? `Annual ${billingCycle} commitment renews on ${formattedRenewalDate} (${daysUntilRenewal} days remaining). Send this notice before ${safeCutoffDate} to prevent a full-year lump-sum renewal lock-in, or request a pro-rated refund for unused months.`
      : `${billingCycle} cycle renews on ${formattedRenewalDate} (${daysUntilRenewal} days remaining). Schedule cancellation effective at the end of the current billing period (submit by ${safeCutoffDate}) so you retain paid access through ${formattedRenewalDate} without triggering next month's charge.`;

  return {
    formattedRenewalDate,
    daysUntilRenewal,
    safeCutoffDate,
    scheduleAdvice,
  };
}

function fallbackParseStatement(rawText: string): ParsedStatementItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedStatementItem[] = [];
  for (const line of lines) {
    const priceMatch = line.match(/\$?\s*(\d{1,4}\.\d{2})/);
    if (!priceMatch) continue;
    const rawCost = parseFloat(priceMatch[1]);
    if (isNaN(rawCost) || rawCost <= 0) continue;

    const upper = line.toUpperCase();
    if (upper.includes('WHOLE FOODS') || upper.includes('STARBUCKS') || upper.includes('UBER TRIP')) {
      continue;
    }

    let name = line
      .replace(/\$?\s*\d{1,4}\.\d{2}/g, '')
      .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, '')
      .replace(/\b[A-Z0-9]{6,}\b/g, '')
      .replace(/[*#_/-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let category: SubscriptionCategory = 'SaaS';
    const estimatedCycle: BillingCycle =
      rawCost >= 75 && upper.includes('ANNUAL') ? 'ANNUAL' : 'MONTHLY';
    let suggestedUsageFrequency = 6;
    let cancellationUrl = '';

    if (upper.includes('AMZN') || upper.includes('PRIME')) {
      name = 'Amazon Prime Membership';
      category = 'ENTERTAINMENT';
      suggestedUsageFrequency = 14;
      cancellationUrl = 'https://www.amazon.com/mc/pipelines/cancellation';
    } else if (upper.includes('NETFLIX')) {
      name = 'Netflix Standard / Ultra';
      category = 'ENTERTAINMENT';
      suggestedUsageFrequency = 12;
      cancellationUrl = 'https://www.netflix.com/youraccount';
    } else if (
      upper.includes('EQUINOX') ||
      upper.includes('PELOTON') ||
      upper.includes('GYM') ||
      upper.includes('STRAVA') ||
      upper.includes('HEADSPACE')
    ) {
      name = upper.includes('PELOTON')
        ? 'Peloton All-Access Membership'
        : upper.includes('STRAVA')
        ? 'Strava Annual Membership'
        : upper.includes('HEADSPACE')
        ? 'Headspace Meditation Plus'
        : 'Equinox Club Membership';
      category = 'HEALTH';
      suggestedUsageFrequency = 3;
      cancellationUrl = 'https://www.onepeloton.com/mymembership';
    } else if (upper.includes('ADOBE')) {
      name = 'Adobe Creative Cloud';
      category = 'SaaS';
      suggestedUsageFrequency = 4;
      cancellationUrl = 'https://account.adobe.com/plans';
    } else if (
      upper.includes('OPENAI') ||
      upper.includes('CHATGPT') ||
      upper.includes('ANTHROPIC') ||
      upper.includes('NOTION') ||
      upper.includes('LINEAR') ||
      upper.includes('SUPERHUMAN')
    ) {
      name = upper.includes('ANTHROPIC')
        ? 'Claude Pro Subscription'
        : upper.includes('OPENAI')
        ? 'ChatGPT Plus Subscription'
        : upper.includes('NOTION')
        ? 'Notion Plus Workspace'
        : upper.includes('LINEAR')
        ? 'Linear Standard Workspace'
        : 'Superhuman Mail Client';
      category = 'SaaS';
      suggestedUsageFrequency = 20;
    } else if (upper.includes('VERCEL') || upper.includes('AWS') || upper.includes('ICLOUD')) {
      name = upper.includes('VERCEL') ? 'Vercel Pro Team Seat' : 'Cloud Infrastructure Utility';
      category = 'UTILITIES';
      suggestedUsageFrequency = 22;
    } else if (
      upper.includes('HULU') ||
      upper.includes('DISNEY') ||
      upper.includes('MAX') ||
      upper.includes('SPOTIFY')
    ) {
      name = upper.includes('HULU')
        ? 'Hulu + Disney Bundle'
        : upper.includes('SPOTIFY')
        ? 'Spotify Premium'
        : 'Max Ad-Free Streaming';
      category = 'ENTERTAINMENT';
      suggestedUsageFrequency = 5;
    } else if (upper.includes('WSJ') || upper.includes('BLOOMBERG') || upper.includes('MONARCH')) {
      name = upper.includes('WSJ')
        ? 'Wall Street Journal Digital'
        : upper.includes('BLOOMBERG')
        ? 'Bloomberg.com Digital'
        : 'Monarch Finance Pro';
      category = 'FINANCE';
      suggestedUsageFrequency = 5;
    } else if (!name || name.length < 3) {
      name = 'Recurring Merchant Charge';
      category = 'OTHER';
    }

    const monthlyCost =
      estimatedCycle === 'ANNUAL' ? Number((rawCost / 12).toFixed(2)) : Number(rawCost.toFixed(2));

    items.push({
      name,
      cost: monthlyCost,
      category,
      estimatedCycle,
      rawLine: line,
      suggestedUsageFrequency,
      cancellationUrl: cancellationUrl || undefined,
    });
  }

  return items;
}

function buildFallbackCancellationScript(
  req: CancellationScriptRequest
): CancellationScriptResponse {
  const {
    subscriptionName,
    monthlyCost,
    currency = 'USD',
    userReason,
    preferredTone,
    billingCycle = 'MONTHLY',
    renewalDate,
    category = 'SaaS',
  } = req;

  const formattedMonthly = formatCurrency(Number(monthlyCost || 0), currency);
  const formattedAnnual = formatCurrency(Number(monthlyCost || 0) * 12, currency);
  const timing = analyzeRenewalTiming(renewalDate, billingCycle);
  const normCat = normalizeCategoryEnum(String(category));

  let categorySpecificDarkPattern = '';
  if (normCat === 'HEALTH') {
    categorySpecificDarkPattern = `Fitness & Health memberships (${subscriptionName}) notoriously enforce "In-Person or Certified Mail Only" cancellation clauses and 30-day advance notice windows prior to ${timing.formattedRenewalDate}. Under the FTC Click-to-Cancel Rule and state Health Studio Services acts, online sign-ups must permit online cancellation. Save a PDF of this notice before ${timing.safeCutoffDate}.`;
  } else if (normCat === 'SaaS' && billingCycle === 'ANNUAL') {
    categorySpecificDarkPattern = `Annual SaaS contracts like ${subscriptionName} (${formattedAnnual}/yr billed on a ${billingCycle} cycle) frequently bluff with "50% Early Termination Fees" if canceled mid-term. Demand either a fee-free downgrade to a free tier or schedule non-renewal effective on ${timing.formattedRenewalDate} so no auto-renewal occurs.`;
  } else if (normCat === 'FINANCE') {
    categorySpecificDarkPattern = `Financial & market data subscriptions like ${subscriptionName} often require live chat or phone retention calls before ${timing.formattedRenewalDate} and offer temporary 3-month introductory teasers that silently revert to ${formattedMonthly}/mo.`;
  } else if (normCat === 'UTILITIES') {
    categorySpecificDarkPattern = `Cloud & storage utilities (${subscriptionName}) may warn of immediate data deletion upon cancellation. Export your data/repositories prior to ${timing.formattedRenewalDate} and downgrade to the Free/Hobby tier before revoking billing.`;
  } else {
    categorySpecificDarkPattern = `When canceling ${subscriptionName} before its ${timing.formattedRenewalDate} (${billingCycle}) renewal, watch out for "Pause for 1 Month" buttons placed more prominently than the final "Confirm Cancellation" button—pausing automatically resumes billing next cycle.`;
  }

  if (preferredTone === 'Negotiate Discount') {
    return {
      subject: `Rate Review & Pre-Renewal Retention Inquiry — ${subscriptionName} (${billingCycle} Renewal: ${timing.formattedRenewalDate})`,
      body: `Hello ${subscriptionName} Billing & Retention Team,\n\nI am auditing my recurring ${normCat} expenses ahead of my upcoming ${billingCycle.toLowerCase()} renewal scheduled for ${timing.formattedRenewalDate} (${timing.daysUntilRenewal} days from today), currently billed at ${formattedMonthly}/month (${formattedAnnual}/year).\n\nDue to "${userReason}", I am preparing to schedule cancellation effective at the end of my current billing cycle on ${timing.formattedRenewalDate}. However, before finalizing termination, I wanted to ask if my account is eligible for a retention discount (such as 50% off for the next 6 months) or a lower-cost loyalty tier.\n\nIf no promotional rate adjustment is available, please treat this message as formal advance notice to disable automatic renewal prior to ${timing.formattedRenewalDate} so that my subscription terminates cleanly at the end of the current paid period without further charges.\n\nThank you,\nAlex Mercer`,
      darkPatternAdvice: categorySpecificDarkPattern,
      cancellationScheduleNote: timing.scheduleAdvice,
      providerUsed: 'Gemma Consumer Protection Engine',
    };
  }

  if (preferredTone === 'Polite & Brief') {
    return {
      subject: `Schedule Subscription Cancellation Prior to ${timing.formattedRenewalDate} Renewal — ${subscriptionName}`,
      body: `Dear ${subscriptionName} Support,\n\nPlease schedule the cancellation of my ${subscriptionName} subscription (${formattedMonthly}/month, ${billingCycle} billing cycle) to take effect at the conclusion of my current billing period ending on ${timing.formattedRenewalDate}.\n\nReason for cancellation: ${userReason}.\n\nPlease disable automatic renewal immediately so that no charge is processed on ${timing.formattedRenewalDate}, while preserving my paid access through the end of the current cycle. Kindly reply with written confirmation of this scheduled termination.\n\nBest regards,\nAlex Mercer`,
      darkPatternAdvice: categorySpecificDarkPattern,
      cancellationScheduleNote: timing.scheduleAdvice,
      providerUsed: 'Gemma Consumer Protection Engine',
    };
  }

  return {
    subject: `FORMAL NOTICE: Revocation of Auto-Renewal & Termination Effective ${timing.formattedRenewalDate} — ${subscriptionName}`,
    body: `To ${subscriptionName} Billing & Legal Compliance,\n\nTake notice that I am formally terminating my ${subscriptionName} subscription (${formattedMonthly}/month, ${billingCycle} billing cycle) ahead of the scheduled renewal date of ${timing.formattedRenewalDate} (${timing.daysUntilRenewal} days remaining). My reason for termination is: ${userReason}.\n\nPursuant to consumer protection statutes governing automatic renewal contracts (including the FTC Negative Option / Click-to-Cancel Rule and state automatic renewal laws), I hereby revoke authorization for ${subscriptionName} to initiate any recurring ACH, debit, or credit card charges on or after ${timing.formattedRenewalDate}.\n\nDemand is made for immediate written confirmation that:\n1. Cancellation is scheduled to align with the end of the current billing period (${timing.formattedRenewalDate})—or immediate pro-rated refund if billed annually;\n2. All auto-renewal flags on my account have been permanently disabled; and\n3. No early termination penalty or post-cancellation charge will be assessed.\n\nSincerely,\nAlex Mercer`,
    darkPatternAdvice: categorySpecificDarkPattern,
    cancellationScheduleNote: timing.scheduleAdvice,
    providerUsed: 'Gemma Consumer Protection Engine',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ============================================================================
  // 0. JWT AUTHENTICATION & USER FINANCIAL PROFILE (/api/auth/* & /api/users/*)
  // ============================================================================
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        name,
        currency,
        totalEarnings,
        monthlyExpenditure,
        monthlySavingGoal,
        seedStarterSubscriptions,
      } = req.body as {
        email?: string;
        password?: string;
        name?: string;
        currency?: string;
        totalEarnings?: number;
        monthlyExpenditure?: number;
        monthlySavingGoal?: number;
        seedStarterSubscriptions?: boolean;
      };

      if (!email || !password || password.length < 6) {
        res.status(400).json({
          error: 'Valid email and a password of at least 6 characters are required.',
        });
        return;
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(409).json({
          error: 'An account with this email already exists. Please log in instead.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const createdUser = db.createUser({
        email,
        name: name || email.split('@')[0],
        passwordHash,
        financialProfile: {
          currency: currency?.trim() || 'USD',
          totalEarnings: totalEarnings !== undefined ? Number(totalEarnings) : 8500,
          monthlyExpenditure: monthlyExpenditure !== undefined ? Number(monthlyExpenditure) : 3800,
          monthlySavingGoal: monthlySavingGoal !== undefined ? Number(monthlySavingGoal) : 2000,
        },
        seedStarterSubscriptions: seedStarterSubscriptions !== false,
      });

      const token = jwt.sign(
        { userId: createdUser.id, email: createdUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          createdAt: createdUser.createdAt,
          financialProfile: createdUser.financialProfile,
        },
      });
    } catch (error) {
      console.error('Error in /api/auth/register:', error);
      res.status(500).json({ error: 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          financialProfile: user.financialProfile,
        },
      });
    } catch (error) {
      console.error('Error in /api/auth/login:', error);
      res.status(500).json({ error: 'Login failed.' });
    }
  });

  app.get('/api/users/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
    const authPayload = req.auth!;
    const user = db.findUserById(authPayload.userId) || db.getState().user;
    const subs = db.getSubscriptions(user.id);
    const activeSubs = subs.filter((s) => s.status !== 'CANCELED');
    const monthlySpend = activeSubs.reduce((acc, s) => acc + s.monthlyCost, 0);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        financialProfile: user.financialProfile,
      },
      metrics: {
        totalSubscriptions: subs.length,
        activeSubscriptions: activeSubs.length,
        monthlyRecurringSpend: Number(monthlySpend.toFixed(2)),
        annualizedSpend: Number((monthlySpend * 12).toFixed(2)),
      },
      jwtSession: {
        userId: authPayload.userId,
        email: authPayload.email,
        issuedAt: authPayload.iat ? new Date(authPayload.iat * 1000).toISOString() : undefined,
        expiresAt: authPayload.exp ? new Date(authPayload.exp * 1000).toISOString() : undefined,
      },
    });
  });

  app.put('/api/users/profile', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req) || db.getState().user.id;
    const updates = req.body as Partial<UserFinancialProfile>;
    const updated = db.updateFinancialProfile(userId, updates);
    if (!updated) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }
    res.json({ financialProfile: updated });
  });

  // ============================================================================
  // 1. SUBSCRIPTIONS & CATEGORIES CRUD API (/api/subscriptions & /api/categories)
  // ============================================================================
  app.get('/api/subscriptions', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    const state = db.getState(userId);
    const defaultToken = jwt.sign(
      { userId: state.user.id, email: state.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: state.user.id,
        email: state.user.email,
        name: state.user.name,
        createdAt: state.user.createdAt,
        financialProfile: state.user.financialProfile,
      },
      defaultToken,
      subscriptions: state.subscriptions,
      savedScenarios: state.savedScenarios,
      customCategories: state.customCategories,
    });
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const customCategories = db.addCustomCategory(name);
    res.status(201).json({ customCategories });
  });

  app.post('/api/subscriptions', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    const {
      name,
      category,
      customCategory,
      monthlyCost,
      billingCycle,
      renewalDate,
      usageFrequency,
      status,
      cancellationUrl,
    } = req.body || {};

    if (!name || monthlyCost === undefined) {
      res.status(400).json({ error: 'Subscription name and monthlyCost are required.' });
      return;
    }

    const created = db.createSubscription({
      userId,
      name,
      category: category || 'SaaS',
      customCategory,
      monthlyCost: Number(monthlyCost),
      billingCycle: billingCycle || 'MONTHLY',
      renewalDate,
      usageFrequency: usageFrequency !== undefined ? Number(usageFrequency) : 5,
      status: status || 'ACTIVE',
      cancellationUrl,
    });

    res.status(201).json(created);
  });

  app.post('/api/subscriptions/batch', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    const { items } = req.body as { items?: ParsedStatementItem[] };
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty items array.' });
      return;
    }

    const created = items.map((item) =>
      db.createSubscription({
        userId,
        name: item.name,
        category: normalizeCategoryEnum(item.category),
        customCategory: item.customCategory,
        monthlyCost: Number(item.cost) || 0,
        billingCycle: item.estimatedCycle || 'MONTHLY',
        usageFrequency: item.suggestedUsageFrequency ?? 5,
        status: 'ACTIVE',
        cancellationUrl: item.cancellationUrl,
      })
    );

    res.status(201).json({ created, count: created.length });
  });

  app.put('/api/subscriptions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = db.updateSubscription(id, req.body || {});
    if (!updated) {
      res.status(404).json({ error: 'Subscription not found.' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/subscriptions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = db.deleteSubscription(id);
    if (!ok) {
      res.status(404).json({ error: 'Subscription not found.' });
      return;
    }
    res.json({ deleted: true, id });
  });

  app.post('/api/subscriptions/reset', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    db.resetToSeed(userId);
    const state = db.getState(userId);
    res.json(state);
  });

  // ============================================================================
  // 2. SAVED SCENARIOS API (/api/scenarios)
  // ============================================================================
  app.get('/api/scenarios', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    res.json(db.getScenarios(userId));
  });

  app.post('/api/scenarios', (req: Request, res: Response) => {
    const userId = getOptionalUserId(req);
    const { name, targetSavings, canceledSubscriptionIds, annualROI } = req.body || {};
    const scenario = db.createScenario({
      userId,
      name: name || 'Custom Savings Scenario',
      targetSavings: Number(targetSavings) || 0,
      canceledSubscriptionIds: Array.isArray(canceledSubscriptionIds)
        ? canceledSubscriptionIds
        : [],
      annualROI: Number(annualROI) || 0,
    });
    res.status(201).json(scenario);
  });

  app.delete('/api/scenarios/:id', (req: Request, res: Response) => {
    const ok = db.deleteScenario(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Scenario not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  // ============================================================================
  // 3. GOOGLE SEARCH GROUNDING ENDPOINT (/api/ai/search-pricing)
  // Uses gemini-3.8-flash with googleSearch tool for live pricing & alternatives
  // ============================================================================
  app.post('/api/ai/search-pricing', async (req: Request, res: Response) => {
    const { subscriptionName, category, monthlyCost } = req.body as {
      subscriptionName?: string;
      category?: string;
      monthlyCost?: number;
    };

    if (!subscriptionName) {
      res.status(400).json({ error: 'subscriptionName is required.' });
      return;
    }

    const queryPrompt = `Use Google Search to find the latest 2026 subscription pricing, plan tiers, cancellation policies, and top 2 cheaper alternatives for "${subscriptionName}" (Category: ${category || 'SaaS'}, user currently pays $${Number(monthlyCost || 0).toFixed(2)}/month).
Provide a concise, well-structured summary with:
1. Current Official Pricing Tiers & Discounts (student, annual, or bundle savings)
2. Direct Cancellation & Refund Policy Insights
3. Top 2 Lower-Cost Competitors with current pricing.`;

    try {
      const ai = getAiClient();
      if (ai) {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: queryPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const summary =
          response.text ||
          `Current market intelligence for ${subscriptionName} ($${Number(monthlyCost || 0).toFixed(2)}/mo).`;
        const sources = extractGroundingSources(response);

        res.json({
          subscriptionName,
          summary,
          sources,
        });
        return;
      }

      res.json({
        subscriptionName,
        summary: `Market Benchmark for ${subscriptionName} (Currently billed at $${Number(monthlyCost || 0).toFixed(2)}/mo):\n• Annual billing typically saves 16%–20% compared to rolling monthly renewals.\n• Check whether an ad-supported or basic tier is available before renewing.\n• Verify direct opt-out links in your account settings at least 3 days prior to renewal.`,
        sources: [
          {
            title: `${subscriptionName} Official Account & Pricing Help`,
            uri: `https://www.google.com/search?q=${encodeURIComponent(
              subscriptionName + ' current pricing plans and cancellation policy'
            )}`,
          },
        ],
      });
    } catch (error) {
      console.error('Error in /api/ai/search-pricing:', error);
      res.json({
        subscriptionName,
        summary: `Benchmark check for ${subscriptionName} ($${Number(monthlyCost || 0).toFixed(2)}/mo). Consider switching to a lower tier or negotiating a retention rate prior to your next billing cycle.`,
        sources: [],
      });
    }
  });

  // ============================================================================
  // 4. AI STATEMENT PARSER (/api/ai/parse-statement)
  // ============================================================================
  app.post('/api/ai/parse-statement', async (req: Request, res: Response) => {
    const { statementText, inferenceMode } = req.body as {
      statementText?: string;
      inferenceMode?: 'cloud' | 'ollama';
    };

    if (!statementText || !statementText.trim()) {
      res.status(400).json({ error: 'statementText is required.' });
      return;
    }

    const structuredPrompt = `You are a financial transaction parser for SubsRadar, a privacy-first recurring expense analyzer.
Parse the following raw bank/card statement line items into clean recurring subscriptions.
Ignore one-off grocery/coffee/restaurant purchases unless they are clearly memberships or recurring subscriptions.
Normalize annual charges into their monthly equivalent cost if applicable, and classify the billing cycle as "MONTHLY", "ANNUAL", or "CUSTOM".
Choose category strictly from the Prisma enum values: "ENTERTAINMENT", "UTILITIES", "SaaS", "FINANCE", "HEALTH", "OTHER".
Estimate a realistic initial usageFrequency (0 to 30 days/month) and known cancellationUrl if recognizable.

Raw Statement Lines:
${statementText}

Return a JSON array of objects with keys: name, cost, category, estimatedCycle, suggestedUsageFrequency, cancellationUrl.`;

    try {
      if (inferenceMode === 'ollama') {
        const ollamaRaw = await callOllamaGemma(structuredPrompt);
        if (ollamaRaw) {
          const parsed = JSON.parse(ollamaRaw);
          const list = Array.isArray(parsed) ? parsed : parsed.subscriptions || parsed.items || [];
          if (Array.isArray(list) && list.length > 0) {
            const normalizedList = list.map((item: ParsedStatementItem) => ({
              ...item,
              category: normalizeCategoryEnum(item.category),
            }));
            res.json({ items: normalizedList, providerUsed: `Local Ollama (${OLLAMA_MODEL})` });
            return;
          }
        }
      }

      const ai = getAiClient();
      if (ai) {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: structuredPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Clean merchant or subscription service name, e.g., Netflix, Amazon Prime',
                  },
                  cost: {
                    type: Type.NUMBER,
                    description: 'Normalized monthly cost in USD',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Strictly one of: ENTERTAINMENT, UTILITIES, SaaS, FINANCE, HEALTH, OTHER',
                  },
                  estimatedCycle: {
                    type: Type.STRING,
                    description: 'MONTHLY, ANNUAL, or CUSTOM',
                  },
                  suggestedUsageFrequency: {
                    type: Type.NUMBER,
                    description: 'Estimated usage frequency in days per month (0 to 30)',
                  },
                  cancellationUrl: {
                    type: Type.STRING,
                    description: 'Direct account management or cancellation URL if known',
                  },
                },
                required: ['name', 'cost', 'category', 'estimatedCycle'],
              },
            },
          },
        });

        const text = response.text;
        if (text) {
          const rawItems = JSON.parse(text.trim()) as ParsedStatementItem[];
          const items = rawItems.map((it) => ({
            ...it,
            category: normalizeCategoryEnum(it.category),
          }));
          res.json({
            items,
            providerUsed: 'Gemma / Gemini Cloud Endpoint (gemini-3.8-flash)',
          });
          return;
        }
      }

      const fallbackItems = fallbackParseStatement(statementText);
      res.json({
        items: fallbackItems,
        providerUsed: 'Local Deterministic Parser',
      });
    } catch (error) {
      console.error('Error in /api/ai/parse-statement:', error);
      const fallbackItems = fallbackParseStatement(statementText);
      res.json({
        items: fallbackItems,
        providerUsed: 'Local Deterministic Parser (Fallback)',
      });
    }
  });

  // ============================================================================
  // 5. ENHANCED AI CANCELLATION SCRIPT (POST /api/ai/cancellation-script)
  // ============================================================================
  app.post('/api/ai/cancellation-script', async (req: Request, res: Response) => {
    const body = req.body as CancellationScriptRequest;
    const {
      subscriptionName = 'Subscription Service',
      monthlyCost = 0,
      currency = 'USD',
      userReason = 'Too expensive',
      preferredTone = 'Firm & Direct',
      category = 'SaaS',
      billingCycle = 'MONTHLY',
      renewalDate,
      inferenceMode = 'cloud',
    } = body || {};

    const timing = analyzeRenewalTiming(renewalDate, billingCycle);
    const formattedMonthly = formatCurrency(Number(monthlyCost), currency);

    const prompt = `You are a consumer protection assistant. Write a customized cancellation email/letter for the service ${subscriptionName} (Category: ${category}, Cost: ${formattedMonthly}/month, Currency: ${currency}, Billing Cycle: ${billingCycle}, Next Renewal Date: ${timing.formattedRenewalDate} — in ${timing.daysUntilRenewal} days).
Reason: ${userReason}. Tone: ${preferredTone}.

Instructions:
1. Keep it concise, cite consumer account opt-out rights (such as the FTC Click-to-Cancel Rule and state automatic renewal statutes), and demand immediate written confirmation.
2. Explicitly leverage the billingCycle (${billingCycle}) and renewalDate (${timing.formattedRenewalDate}): instruct the merchant to schedule termination to align with the end of the current billing period on ${timing.formattedRenewalDate} (or demand a pro-rated refund if ${billingCycle} is ANNUAL) so that paid access is preserved until ${timing.formattedRenewalDate} and zero renewal charge is processed on ${timing.formattedRenewalDate}.
3. In darkPatternAdvice, provide specific, actionable counter-measures tailored to ${subscriptionName}'s category (${category}), its ${billingCycle} billing cycle, and the ${timing.daysUntilRenewal}-day window before ${timing.formattedRenewalDate}.

Return JSON with keys: subject, body, darkPatternAdvice, cancellationScheduleNote.`;

    try {
      if (inferenceMode === 'ollama') {
        const ollamaRaw = await callOllamaGemma(prompt);
        if (ollamaRaw) {
          const parsed = JSON.parse(ollamaRaw) as CancellationScriptResponse;
          if (parsed.subject && parsed.body) {
            res.json({
              ...parsed,
              cancellationScheduleNote: parsed.cancellationScheduleNote || timing.scheduleAdvice,
              providerUsed: `Local Ollama (${OLLAMA_MODEL})`,
            });
            return;
          }
        }
      }

      const ai = getAiClient();
      if (ai) {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: 'Clear, authoritative email subject line referencing the service and renewal date',
                },
                body: {
                  type: Type.STRING,
                  description: 'Complete cancellation or negotiation letter body leveraging billingCycle and renewalDate',
                },
                darkPatternAdvice: {
                  type: Type.STRING,
                  description: 'Specific tactical advice on bypassing retention dark patterns for this service, category, and billing cycle',
                },
                cancellationScheduleNote: {
                  type: Type.STRING,
                  description: 'Guidance on scheduling cancellation prior to the renewalDate to align with the end of the billing period',
                },
              },
              required: ['subject', 'body', 'darkPatternAdvice'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim()) as CancellationScriptResponse;
          res.json({
            ...parsed,
            cancellationScheduleNote: parsed.cancellationScheduleNote || timing.scheduleAdvice,
            providerUsed: 'Gemma / Gemini Cloud Endpoint (gemini-3.8-flash)',
          });
          return;
        }
      }

      res.json(buildFallbackCancellationScript(body));
    } catch (error) {
      console.error('Error in /api/ai/cancellation-script:', error);
      res.json(buildFallbackCancellationScript(body));
    }
  });

  // ============================================================================
  // 6. ENHANCED AI CANCELLATION SCRIPT STREAMING (SSE: POST /api/ai/cancellation-script/stream)
  // Uses Google Search Grounding for real-world cancellation steps & policies
  // ============================================================================
  app.post('/api/ai/cancellation-script/stream', async (req: Request, res: Response) => {
    const body = req.body as CancellationScriptRequest;
    const {
      subscriptionName = 'Subscription Service',
      monthlyCost = 0,
      currency = 'USD',
      userReason = 'Too expensive',
      preferredTone = 'Firm & Direct',
      category = 'SaaS',
      billingCycle = 'MONTHLY',
      renewalDate,
    } = body || {};

    const timing = analyzeRenewalTiming(renewalDate, billingCycle);
    const formattedMonthly = formatCurrency(Number(monthlyCost), currency);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `You are a consumer protection assistant. Write a customized cancellation email/letter for the service ${subscriptionName} (Category: ${category}, Cost: ${formattedMonthly}/month, Currency: ${currency}, Billing Cycle: ${billingCycle}, Next Renewal Date: ${timing.formattedRenewalDate} — in ${timing.daysUntilRenewal} days).
Reason: ${userReason}. Tone: ${preferredTone}.

Instructions:
1. Keep it concise, cite account opt-out rights, and demand immediate confirmation.
2. Explicitly cite the ${billingCycle} billing cycle and the ${timing.formattedRenewalDate} renewal date: state that cancellation should be scheduled to align with the end of the current billing period (${timing.formattedRenewalDate})—or request a pro-rated refund if ${billingCycle} is ANNUAL—and prohibit any auto-renewal charge on ${timing.formattedRenewalDate}.
3. In the dark pattern advice section, tailor your advice specifically to ${subscriptionName}, its ${category} category, its ${billingCycle} billing cycle, and the optimal cutoff date (${timing.safeCutoffDate}) prior to ${timing.formattedRenewalDate}.

Format your output with these exact three markers so it can be streamed live and parsed cleanly:
SUBJECT: <one line email subject>
---BODY---
<full email/letter text>
---DARK_PATTERN_ADVICE---
<specific tactical advice on bypassing retention dark patterns for ${subscriptionName} (${billingCycle}, renews ${timing.formattedRenewalDate})>`;

    try {
      const ai = getAiClient();
      if (ai) {
        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        let fullText = '';
        let groundingSources: GroundingSource[] = [];

        for await (const chunk of stream) {
          const c = chunk as GenerateContentResponse;
          const chunkText = c.text || '';
          if (chunkText) {
            fullText += chunkText;
            res.write(`data: ${JSON.stringify({ type: 'delta', text: chunkText })}\n\n`);
          }
          const extracted = extractGroundingSources(c);
          if (extracted.length > 0) {
            groundingSources = [...groundingSources, ...extracted];
          }
        }

        const subjectMatch = fullText.match(/SUBJECT:\s*(.+)/i);
        const bodySplit = fullText.split(/---BODY---/i);
        const adviceSplit = (bodySplit[1] || fullText).split(/---DARK_PATTERN_ADVICE---/i);

        const subject = subjectMatch
          ? subjectMatch[1].trim()
          : `Scheduled Subscription Cancellation Prior to ${timing.formattedRenewalDate} — ${subscriptionName}`;
        const letterBody = (adviceSplit[0] || fullText)
          .replace(/SUBJECT:\s*.+/i, '')
          .trim();
        const darkPatternAdvice =
          (adviceSplit[1] || '').trim() ||
          buildFallbackCancellationScript(body).darkPatternAdvice;

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            result: {
              subject,
              body: letterBody,
              darkPatternAdvice,
              cancellationScheduleNote: timing.scheduleAdvice,
              providerUsed: 'Gemma / Gemini + Google Search Grounding',
              groundingSources: groundingSources.slice(0, 4),
            },
          })}\n\n`
        );
        res.end();
        return;
      }

      const fallback = buildFallbackCancellationScript(body);
      const combined = `SUBJECT: ${fallback.subject}\n---BODY---\n${fallback.body}\n---DARK_PATTERN_ADVICE---\n${fallback.darkPatternAdvice}`;
      const words = combined.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        const piece = words.slice(i, i + 4).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ type: 'delta', text: piece })}\n\n`);
        await new Promise((r) => setTimeout(r, 25));
      }
      res.write(`data: ${JSON.stringify({ type: 'done', result: fallback })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Streaming error in /api/ai/cancellation-script/stream:', error);
      const fallback = buildFallbackCancellationScript(body);
      res.write(`data: ${JSON.stringify({ type: 'done', result: fallback })}\n\n`);
      res.end();
    }
  });

  // ============================================================================
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubsRadar full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
