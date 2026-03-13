/**
 * KeyID API client — full-featured agent email SDK.
 */
import { Keypair } from './crypto';
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
    attachments?: Array<{
        filename: string;
        content: string;
        contentType?: string;
    }>;
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
    metrics: Array<{
        period: string;
        count: number;
    }>;
    total: number;
}
export declare class KeyID {
    private baseUrl;
    private keypair;
    private storageType;
    private token;
    private tokenExpiresAt;
    constructor(options?: KeyIDOptions);
    get publicKey(): string;
    provision(): Promise<ProvisionResult>;
    authenticate(): Promise<string>;
    getIdentity(): Promise<Identity>;
    getEmail(): Promise<string>;
    getAddresses(): Promise<Array<{
        address: string;
        domain: string;
        status: string;
        createdAt: string;
    }>>;
    getInbox(options?: {
        page?: number;
        limit?: number;
        direction?: 'inbound' | 'outbound';
        since?: string;
        labels?: string[];
        search?: string;
    }): Promise<InboxResult>;
    getMessage(id: string): Promise<Message>;
    updateMessage(id: string, update: {
        labels?: string[];
        status?: string;
        isRead?: boolean;
        isStarred?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    send(to: string, subject: string, body: string, options?: SendOptions): Promise<SendResult>;
    reply(messageId: string, body: string, options?: {
        html?: string;
    }): Promise<SendResult>;
    replyAll(messageId: string, body: string, options?: {
        html?: string;
    }): Promise<SendResult>;
    forward(messageId: string, to: string, options?: {
        body?: string;
        html?: string;
    }): Promise<SendResult>;
    listThreads(options?: {
        page?: number;
        limit?: number;
        labels?: string[];
        before?: string;
        after?: string;
        ascending?: boolean;
    }): Promise<ThreadListResult>;
    getThread(id: string): Promise<Thread>;
    deleteThread(id: string, options?: {
        permanent?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    listDrafts(options?: {
        page?: number;
        limit?: number;
    }): Promise<DraftListResult>;
    createDraft(draft: {
        to?: string;
        cc?: string[];
        bcc?: string[];
        replyTo?: string;
        subject?: string;
        body?: string;
        htmlBody?: string;
        threadId?: string;
        labels?: string[];
    }): Promise<{
        draftId: string;
    }>;
    getDraft(id: string): Promise<Draft>;
    updateDraft(id: string, update: Partial<Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{
        ok: boolean;
    }>;
    deleteDraft(id: string): Promise<{
        ok: boolean;
    }>;
    sendDraft(id: string): Promise<SendResult>;
    listWebhooks(): Promise<{
        webhooks: Webhook[];
    }>;
    createWebhook(url: string, events?: string[]): Promise<{
        webhookId: string;
        secret: string;
        events: string[];
    }>;
    getWebhook(id: string): Promise<Webhook>;
    updateWebhook(id: string, update: {
        url?: string;
        events?: string[];
        active?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    deleteWebhook(id: string): Promise<{
        ok: boolean;
    }>;
    getList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        entries: ListEntry[];
    }>;
    addToList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', entry: string): Promise<{
        ok: boolean;
        id: string | null;
    }>;
    removeFromList(direction: 'inbound' | 'outbound', type: 'allow' | 'block', entry: string): Promise<{
        ok: boolean;
    }>;
    getMetrics(options?: {
        event?: string;
        period?: 'hour' | 'day' | 'week' | 'month';
        since?: string;
        until?: string;
    }): Promise<MetricsResult>;
    getSignature(): Promise<{
        signature: string | null;
    }>;
    setSignature(signature: string | null): Promise<{
        ok: boolean;
    }>;
    getForwarding(): Promise<{
        forwardingAddress: string | null;
    }>;
    setForwarding(forwardingAddress: string | null): Promise<{
        ok: boolean;
    }>;
    getAutoReply(): Promise<AutoReplySettings>;
    setAutoReply(settings: Partial<AutoReplySettings>): Promise<{
        ok: boolean;
    }>;
    getUnreadCount(): Promise<{
        count: number;
    }>;
    listContacts(): Promise<{
        contacts: Contact[];
    }>;
    createContact(contact: {
        email: string;
        name?: string;
        notes?: string;
    }): Promise<Contact>;
    getContact(id: string): Promise<Contact>;
    updateContact(id: string, update: {
        name?: string;
        email?: string;
        notes?: string;
    }): Promise<Contact>;
    deleteContact(id: string): Promise<{
        ok: boolean;
    }>;
    getWebhookDeliveries(options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        deliveries: WebhookDelivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    private ensureAuth;
    private fetch;
}
