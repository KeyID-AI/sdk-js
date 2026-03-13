/**
 * KeyID API client — full-featured agent email SDK.
 */

import { generateKeypair, sign, Keypair } from './crypto';

export type StorageType = 'filesystem' | 'env' | 'memory' | 'secrets_manager' | 'stateless';

export interface KeyIDOptions {
  baseUrl?: string;
  keypair?: Keypair;
  storageType?: StorageType;
}

export interface ProvisionResult {
  agentId: string;
  email: string;
  domain: string;
  classification: string;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  extractedText?: string;
  labels?: string[];
  status?: string;
  isRead?: boolean;
  isStarred?: boolean;
  scheduledAt?: string;
  threadId?: string;
  createdAt: string;
}

export interface AutoReplySettings {
  enabled: boolean;
  subject: string | null;
  body: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Contact {
  id: string;
  name?: string;
  email: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: string;
  attempts: number;
  lastError?: string;
  url: string;
  createdAt: string;
  nextAttemptAt?: string;
}

export interface InboxResult {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface SendOptions {
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  threadId?: string;
  labels?: string[];
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
  displayName?: string;
  scheduledAt?: string;
}

export interface SendResult {
  messageId: string;
  from: string;
  threadId?: string;
  status?: string;
  scheduledAt?: string;
}

export interface Identity {
  agentId: string;
  pubkey: string;
  email: string;
  domain: string;
  classification: string;
  storageType: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  subject: string;
  lastMessageAt: string;
  messageCount: number;
  labels?: string[];
  createdAt: string;
  messages?: Message[];
}

export interface ThreadListResult {
  threads: Thread[];
  total: number;
  page: number;
  limit: number;
}

export interface Draft {
  id: string;
  to?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  labels?: string[];
  threadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftListResult {
  drafts: Draft[];
  total: number;
  page: number;
  limit: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListEntry {
  id: string;
  entry: string;
  createdAt: string;
}

export interface MetricsResult {
  metrics: Array<{ period: string; count: number }>;
  total: number;
}

export class KeyID {
  private baseUrl: string;
  private keypair: Keypair;
  private storageType: StorageType;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(options: KeyIDOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://keyid.ai').replace(/\/$/, '');
    this.keypair = options.keypair || generateKeypair();
    this.storageType = options.storageType || 'memory';
  }

  get publicKey(): string {
    return this.keypair.publicKey;
  }

  // -- Identity & Auth ------------------------------------------

  async provision(): Promise<ProvisionResult> {
    const meta: Record<string, string> = {
      sdk: '@keyid/sdk',
    };
    try {
      meta.sdkVersion = require('../package.json').version;
    } catch {}
    if (typeof process !== 'undefined') {
      try {
        meta.runtime = 'node';
        meta.runtimeVersion = process.version;
        meta.platform = process.platform;
        meta.hostname = require('os').hostname();
      } catch {}
    }

    const res = await this.fetch('/api/provision', {
      method: 'POST',
      body: JSON.stringify({
        pubkey: this.keypair.publicKey,
        storageType: this.storageType,
        ...meta,
      }),
    });
    return res as ProvisionResult;
  }

  async authenticate(): Promise<string> {
    const { nonce } = await this.fetch('/api/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ pubkey: this.keypair.publicKey }),
    }) as { nonce: string; expiresAt: string };

    const signature = sign(nonce, this.keypair.privateKey);

    const { token, expiresAt } = await this.fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pubkey: this.keypair.publicKey, nonce, signature }),
    }) as { token: string; expiresAt: string; agentId: string };

    this.token = token;
    this.tokenExpiresAt = new Date(expiresAt).getTime();
    return token;
  }

  async getIdentity(): Promise<Identity> {
    await this.ensureAuth();
    return this.fetch('/api/identity', {}, true) as Promise<Identity>;
  }

  async getEmail(): Promise<string> {
    const identity = await this.getIdentity();
    return identity.email;
  }

  async getAddresses(): Promise<Array<{ address: string; domain: string; status: string; createdAt: string }>> {
    await this.ensureAuth();
    const res = await this.fetch('/api/addresses', {}, true) as { addresses: Array<{ address: string; domain: string; status: string; createdAt: string }> };
    return res.addresses;
  }

  // -- Inbox / Messages -----------------------------------------

  async getInbox(options?: {
    page?: number;
    limit?: number;
    direction?: 'inbound' | 'outbound';
    since?: string;
    labels?: string[];
    search?: string;
  }): Promise<InboxResult> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.direction) params.set('direction', options.direction);
    if (options?.since) params.set('since', options.since);
    if (options?.labels?.length) params.set('labels', options.labels.join(','));
    if (options?.search) params.set('search', options.search);
    const qs = params.toString();
    return this.fetch(`/api/inbox${qs ? '?' + qs : ''}`, {}, true) as Promise<InboxResult>;
  }

  async getMessage(id: string): Promise<Message> {
    await this.ensureAuth();
    return this.fetch(`/api/inbox/${id}`, {}, true) as Promise<Message>;
  }

  async updateMessage(id: string, update: { labels?: string[]; status?: string; isRead?: boolean; isStarred?: boolean }): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/inbox/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    }, true) as Promise<{ ok: boolean }>;
  }

  async send(to: string, subject: string, body: string, options?: SendOptions): Promise<SendResult> {
    await this.ensureAuth();
    return this.fetch('/api/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, ...options }),
    }, true) as Promise<SendResult>;
  }

  async reply(messageId: string, body: string, options?: { html?: string }): Promise<SendResult> {
    await this.ensureAuth();
    return this.fetch(`/api/inbox/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body, ...options }),
    }, true) as Promise<SendResult>;
  }

  async replyAll(messageId: string, body: string, options?: { html?: string }): Promise<SendResult> {
    await this.ensureAuth();
    return this.fetch(`/api/inbox/${messageId}/reply-all`, {
      method: 'POST',
      body: JSON.stringify({ body, ...options }),
    }, true) as Promise<SendResult>;
  }

  async forward(messageId: string, to: string, options?: { body?: string; html?: string }): Promise<SendResult> {
    await this.ensureAuth();
    return this.fetch(`/api/inbox/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ to, ...options }),
    }, true) as Promise<SendResult>;
  }

  // -- Threads --------------------------------------------------

  async listThreads(options?: {
    page?: number;
    limit?: number;
    labels?: string[];
    before?: string;
    after?: string;
    ascending?: boolean;
  }): Promise<ThreadListResult> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.labels?.length) params.set('labels', options.labels.join(','));
    if (options?.before) params.set('before', options.before);
    if (options?.after) params.set('after', options.after);
    if (options?.ascending) params.set('ascending', 'true');
    const qs = params.toString();
    return this.fetch(`/api/threads${qs ? '?' + qs : ''}`, {}, true) as Promise<ThreadListResult>;
  }

  async getThread(id: string): Promise<Thread> {
    await this.ensureAuth();
    return this.fetch(`/api/threads/${id}`, {}, true) as Promise<Thread>;
  }

  async deleteThread(id: string, options?: { permanent?: boolean }): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    const qs = options?.permanent ? '?permanent=true' : '';
    return this.fetch(`/api/threads/${id}${qs}`, { method: 'DELETE' }, true) as Promise<{ ok: boolean }>;
  }

  // -- Drafts ---------------------------------------------------

  async listDrafts(options?: { page?: number; limit?: number }): Promise<DraftListResult> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.fetch(`/api/drafts${qs ? '?' + qs : ''}`, {}, true) as Promise<DraftListResult>;
  }

  async createDraft(draft: {
    to?: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    subject?: string;
    body?: string;
    htmlBody?: string;
    threadId?: string;
    labels?: string[];
  }): Promise<{ draftId: string }> {
    await this.ensureAuth();
    return this.fetch('/api/drafts', {
      method: 'POST',
      body: JSON.stringify(draft),
    }, true) as Promise<{ draftId: string }>;
  }

  async getDraft(id: string): Promise<Draft> {
    await this.ensureAuth();
    return this.fetch(`/api/drafts/${id}`, {}, true) as Promise<Draft>;
  }

  async updateDraft(id: string, update: Partial<Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    }, true) as Promise<{ ok: boolean }>;
  }

  async deleteDraft(id: string): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/drafts/${id}`, { method: 'DELETE' }, true) as Promise<{ ok: boolean }>;
  }

  async sendDraft(id: string): Promise<SendResult> {
    await this.ensureAuth();
    return this.fetch(`/api/drafts/${id}/send`, { method: 'POST' }, true) as Promise<SendResult>;
  }

  // -- Webhooks -------------------------------------------------

  async listWebhooks(): Promise<{ webhooks: Webhook[] }> {
    await this.ensureAuth();
    return this.fetch('/api/webhooks', {}, true) as Promise<{ webhooks: Webhook[] }>;
  }

  async createWebhook(url: string, events?: string[]): Promise<{ webhookId: string; secret: string; events: string[] }> {
    await this.ensureAuth();
    return this.fetch('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    }, true) as Promise<{ webhookId: string; secret: string; events: string[] }>;
  }

  async getWebhook(id: string): Promise<Webhook> {
    await this.ensureAuth();
    return this.fetch(`/api/webhooks/${id}`, {}, true) as Promise<Webhook>;
  }

  async updateWebhook(id: string, update: { url?: string; events?: string[]; active?: boolean }): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    }, true) as Promise<{ ok: boolean }>;
  }

  async deleteWebhook(id: string): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/webhooks/${id}`, { method: 'DELETE' }, true) as Promise<{ ok: boolean }>;
  }

  // -- Lists (allowlist/blocklist) ------------------------------

  async getList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', options?: { page?: number; limit?: number }): Promise<{ entries: ListEntry[] }> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.fetch(`/api/lists/${direction}/${type}${qs ? '?' + qs : ''}`, {}, true) as Promise<{ entries: ListEntry[] }>;
  }

  async addToList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', entry: string): Promise<{ ok: boolean; id: string | null }> {
    await this.ensureAuth();
    return this.fetch(`/api/lists/${direction}/${type}`, {
      method: 'POST',
      body: JSON.stringify({ entry }),
    }, true) as Promise<{ ok: boolean; id: string | null }>;
  }

  async removeFromList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', entry: string): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/lists/${direction}/${type}/${encodeURIComponent(entry)}`, {
      method: 'DELETE',
    }, true) as Promise<{ ok: boolean }>;
  }

  // -- Metrics --------------------------------------------------

  async getMetrics(options?: {
    event?: string;
    period?: 'hour' | 'day' | 'week' | 'month';
    since?: string;
    until?: string;
  }): Promise<MetricsResult> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.event) params.set('event', options.event);
    if (options?.period) params.set('period', options.period);
    if (options?.since) params.set('since', options.since);
    if (options?.until) params.set('until', options.until);
    const qs = params.toString();
    return this.fetch(`/api/metrics${qs ? '?' + qs : ''}`, {}, true) as Promise<MetricsResult>;
  }

  // -- Settings -------------------------------------------------

  async getSignature(): Promise<{ signature: string | null }> {
    await this.ensureAuth();
    return this.fetch('/api/settings/signature', {}, true) as Promise<{ signature: string | null }>;
  }

  async setSignature(signature: string | null): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch('/api/settings/signature', {
      method: 'PUT',
      body: JSON.stringify({ signature }),
    }, true) as Promise<{ ok: boolean }>;
  }

  async getForwarding(): Promise<{ forwardingAddress: string | null }> {
    await this.ensureAuth();
    return this.fetch('/api/settings/forwarding', {}, true) as Promise<{ forwardingAddress: string | null }>;
  }

  async setForwarding(forwardingAddress: string | null): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch('/api/settings/forwarding', {
      method: 'PUT',
      body: JSON.stringify({ forwardingAddress }),
    }, true) as Promise<{ ok: boolean }>;
  }

  async getAutoReply(): Promise<AutoReplySettings> {
    await this.ensureAuth();
    return this.fetch('/api/settings/auto-reply', {}, true) as Promise<AutoReplySettings>;
  }

  async setAutoReply(settings: Partial<AutoReplySettings>): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch('/api/settings/auto-reply', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }, true) as Promise<{ ok: boolean }>;
  }

  // -- Unread Count ----------------------------------------------

  async getUnreadCount(): Promise<{ count: number }> {
    await this.ensureAuth();
    return this.fetch('/api/inbox/unread-count', {}, true) as Promise<{ count: number }>;
  }

  // -- Contacts --------------------------------------------------

  async listContacts(): Promise<{ contacts: Contact[] }> {
    await this.ensureAuth();
    return this.fetch('/api/contacts', {}, true) as Promise<{ contacts: Contact[] }>;
  }

  async createContact(contact: { email: string; name?: string; notes?: string }): Promise<Contact> {
    await this.ensureAuth();
    return this.fetch('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }, true) as Promise<Contact>;
  }

  async getContact(id: string): Promise<Contact> {
    await this.ensureAuth();
    return this.fetch(`/api/contacts/${id}`, {}, true) as Promise<Contact>;
  }

  async updateContact(id: string, update: { name?: string; email?: string; notes?: string }): Promise<Contact> {
    await this.ensureAuth();
    return this.fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    }, true) as Promise<Contact>;
  }

  async deleteContact(id: string): Promise<{ ok: boolean }> {
    await this.ensureAuth();
    return this.fetch(`/api/contacts/${id}`, { method: 'DELETE' }, true) as Promise<{ ok: boolean }>;
  }

  // -- Webhook Deliveries ----------------------------------------

  async getWebhookDeliveries(options?: { page?: number; limit?: number }): Promise<{
    deliveries: WebhookDelivery[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.ensureAuth();
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.fetch(`/api/webhooks/deliveries${qs ? '?' + qs : ''}`, {}, true) as Promise<{
      deliveries: WebhookDelivery[];
      total: number;
      page: number;
      limit: number;
    }>;
  }

  // -- Internals ------------------------------------------------

  private async ensureAuth(): Promise<void> {
    if (!this.token || Date.now() >= this.tokenExpiresAt - 60_000) {
      await this.authenticate();
    }
  }

  private async fetch(path: string, init: RequestInit = {}, auth = false): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> || {}),
    };
    if (auth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await globalThis.fetch(this.baseUrl + path, { ...init, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      const err = new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      (err as Error & { status: number }).status = res.status;
      throw err;
    }

    return res.json();
  }
}
