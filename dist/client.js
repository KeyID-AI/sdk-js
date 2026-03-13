"use strict";
/**
 * KeyID API client — full-featured agent email SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyID = void 0;
const crypto_1 = require("./crypto");
class KeyID {
    baseUrl;
    keypair;
    storageType;
    token = null;
    tokenExpiresAt = 0;
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl || 'https://keyid.ai').replace(/\/$/, '');
        this.keypair = options.keypair || (0, crypto_1.generateKeypair)();
        this.storageType = options.storageType || 'memory';
    }
    get publicKey() {
        return this.keypair.publicKey;
    }
    // -- Identity & Auth ------------------------------------------
    async provision() {
        const meta = {
            sdk: '@keyid/sdk',
        };
        try {
            meta.sdkVersion = require('../package.json').version;
        }
        catch { }
        if (typeof process !== 'undefined') {
            try {
                meta.runtime = 'node';
                meta.runtimeVersion = process.version;
                meta.platform = process.platform;
                meta.hostname = require('os').hostname();
            }
            catch { }
        }
        const res = await this.fetch('/api/provision', {
            method: 'POST',
            body: JSON.stringify({
                pubkey: this.keypair.publicKey,
                storageType: this.storageType,
                ...meta,
            }),
        });
        return res;
    }
    async authenticate() {
        const { nonce } = await this.fetch('/api/auth/challenge', {
            method: 'POST',
            body: JSON.stringify({ pubkey: this.keypair.publicKey }),
        });
        const signature = (0, crypto_1.sign)(nonce, this.keypair.privateKey);
        const { token, expiresAt } = await this.fetch('/api/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ pubkey: this.keypair.publicKey, nonce, signature }),
        });
        this.token = token;
        this.tokenExpiresAt = new Date(expiresAt).getTime();
        return token;
    }
    async getIdentity() {
        await this.ensureAuth();
        return this.fetch('/api/identity', {}, true);
    }
    async getEmail() {
        const identity = await this.getIdentity();
        return identity.email;
    }
    async getAddresses() {
        await this.ensureAuth();
        const res = await this.fetch('/api/addresses', {}, true);
        return res.addresses;
    }
    // -- Inbox / Messages -----------------------------------------
    async getInbox(options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.page)
            params.set('page', String(options.page));
        if (options?.limit)
            params.set('limit', String(options.limit));
        if (options?.direction)
            params.set('direction', options.direction);
        if (options?.since)
            params.set('since', options.since);
        if (options?.labels?.length)
            params.set('labels', options.labels.join(','));
        if (options?.search)
            params.set('search', options.search);
        const qs = params.toString();
        return this.fetch(`/api/inbox${qs ? '?' + qs : ''}`, {}, true);
    }
    async getMessage(id) {
        await this.ensureAuth();
        return this.fetch(`/api/inbox/${id}`, {}, true);
    }
    async updateMessage(id, update) {
        await this.ensureAuth();
        return this.fetch(`/api/inbox/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(update),
        }, true);
    }
    async send(to, subject, body, options) {
        await this.ensureAuth();
        return this.fetch('/api/send', {
            method: 'POST',
            body: JSON.stringify({ to, subject, body, ...options }),
        }, true);
    }
    async reply(messageId, body, options) {
        await this.ensureAuth();
        return this.fetch(`/api/inbox/${messageId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ body, ...options }),
        }, true);
    }
    async replyAll(messageId, body, options) {
        await this.ensureAuth();
        return this.fetch(`/api/inbox/${messageId}/reply-all`, {
            method: 'POST',
            body: JSON.stringify({ body, ...options }),
        }, true);
    }
    async forward(messageId, to, options) {
        await this.ensureAuth();
        return this.fetch(`/api/inbox/${messageId}/forward`, {
            method: 'POST',
            body: JSON.stringify({ to, ...options }),
        }, true);
    }
    // -- Threads --------------------------------------------------
    async listThreads(options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.page)
            params.set('page', String(options.page));
        if (options?.limit)
            params.set('limit', String(options.limit));
        if (options?.labels?.length)
            params.set('labels', options.labels.join(','));
        if (options?.before)
            params.set('before', options.before);
        if (options?.after)
            params.set('after', options.after);
        if (options?.ascending)
            params.set('ascending', 'true');
        const qs = params.toString();
        return this.fetch(`/api/threads${qs ? '?' + qs : ''}`, {}, true);
    }
    async getThread(id) {
        await this.ensureAuth();
        return this.fetch(`/api/threads/${id}`, {}, true);
    }
    async deleteThread(id, options) {
        await this.ensureAuth();
        const qs = options?.permanent ? '?permanent=true' : '';
        return this.fetch(`/api/threads/${id}${qs}`, { method: 'DELETE' }, true);
    }
    // -- Drafts ---------------------------------------------------
    async listDrafts(options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.page)
            params.set('page', String(options.page));
        if (options?.limit)
            params.set('limit', String(options.limit));
        const qs = params.toString();
        return this.fetch(`/api/drafts${qs ? '?' + qs : ''}`, {}, true);
    }
    async createDraft(draft) {
        await this.ensureAuth();
        return this.fetch('/api/drafts', {
            method: 'POST',
            body: JSON.stringify(draft),
        }, true);
    }
    async getDraft(id) {
        await this.ensureAuth();
        return this.fetch(`/api/drafts/${id}`, {}, true);
    }
    async updateDraft(id, update) {
        await this.ensureAuth();
        return this.fetch(`/api/drafts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(update),
        }, true);
    }
    async deleteDraft(id) {
        await this.ensureAuth();
        return this.fetch(`/api/drafts/${id}`, { method: 'DELETE' }, true);
    }
    async sendDraft(id) {
        await this.ensureAuth();
        return this.fetch(`/api/drafts/${id}/send`, { method: 'POST' }, true);
    }
    // -- Webhooks -------------------------------------------------
    async listWebhooks() {
        await this.ensureAuth();
        return this.fetch('/api/webhooks', {}, true);
    }
    async createWebhook(url, events) {
        await this.ensureAuth();
        return this.fetch('/api/webhooks', {
            method: 'POST',
            body: JSON.stringify({ url, events }),
        }, true);
    }
    async getWebhook(id) {
        await this.ensureAuth();
        return this.fetch(`/api/webhooks/${id}`, {}, true);
    }
    async updateWebhook(id, update) {
        await this.ensureAuth();
        return this.fetch(`/api/webhooks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(update),
        }, true);
    }
    async deleteWebhook(id) {
        await this.ensureAuth();
        return this.fetch(`/api/webhooks/${id}`, { method: 'DELETE' }, true);
    }
    // -- Lists (allowlist/blocklist) ------------------------------
    async getList(direction, type, options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.page)
            params.set('page', String(options.page));
        if (options?.limit)
            params.set('limit', String(options.limit));
        const qs = params.toString();
        return this.fetch(`/api/lists/${direction}/${type}${qs ? '?' + qs : ''}`, {}, true);
    }
    async addToList(direction, type, entry) {
        await this.ensureAuth();
        return this.fetch(`/api/lists/${direction}/${type}`, {
            method: 'POST',
            body: JSON.stringify({ entry }),
        }, true);
    }
    async removeFromList(direction, type, entry) {
        await this.ensureAuth();
        return this.fetch(`/api/lists/${direction}/${type}/${encodeURIComponent(entry)}`, {
            method: 'DELETE',
        }, true);
    }
    // -- Metrics --------------------------------------------------
    async getMetrics(options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.event)
            params.set('event', options.event);
        if (options?.period)
            params.set('period', options.period);
        if (options?.since)
            params.set('since', options.since);
        if (options?.until)
            params.set('until', options.until);
        const qs = params.toString();
        return this.fetch(`/api/metrics${qs ? '?' + qs : ''}`, {}, true);
    }
    // -- Settings -------------------------------------------------
    async getSignature() {
        await this.ensureAuth();
        return this.fetch('/api/settings/signature', {}, true);
    }
    async setSignature(signature) {
        await this.ensureAuth();
        return this.fetch('/api/settings/signature', {
            method: 'PUT',
            body: JSON.stringify({ signature }),
        }, true);
    }
    async getForwarding() {
        await this.ensureAuth();
        return this.fetch('/api/settings/forwarding', {}, true);
    }
    async setForwarding(forwardingAddress) {
        await this.ensureAuth();
        return this.fetch('/api/settings/forwarding', {
            method: 'PUT',
            body: JSON.stringify({ forwardingAddress }),
        }, true);
    }
    async getAutoReply() {
        await this.ensureAuth();
        return this.fetch('/api/settings/auto-reply', {}, true);
    }
    async setAutoReply(settings) {
        await this.ensureAuth();
        return this.fetch('/api/settings/auto-reply', {
            method: 'PUT',
            body: JSON.stringify(settings),
        }, true);
    }
    // -- Unread Count ----------------------------------------------
    async getUnreadCount() {
        await this.ensureAuth();
        return this.fetch('/api/inbox/unread-count', {}, true);
    }
    // -- Contacts --------------------------------------------------
    async listContacts() {
        await this.ensureAuth();
        return this.fetch('/api/contacts', {}, true);
    }
    async createContact(contact) {
        await this.ensureAuth();
        return this.fetch('/api/contacts', {
            method: 'POST',
            body: JSON.stringify(contact),
        }, true);
    }
    async getContact(id) {
        await this.ensureAuth();
        return this.fetch(`/api/contacts/${id}`, {}, true);
    }
    async updateContact(id, update) {
        await this.ensureAuth();
        return this.fetch(`/api/contacts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(update),
        }, true);
    }
    async deleteContact(id) {
        await this.ensureAuth();
        return this.fetch(`/api/contacts/${id}`, { method: 'DELETE' }, true);
    }
    // -- Webhook Deliveries ----------------------------------------
    async getWebhookDeliveries(options) {
        await this.ensureAuth();
        const params = new URLSearchParams();
        if (options?.page)
            params.set('page', String(options.page));
        if (options?.limit)
            params.set('limit', String(options.limit));
        const qs = params.toString();
        return this.fetch(`/api/webhooks/deliveries${qs ? '?' + qs : ''}`, {}, true);
    }
    // -- Internals ------------------------------------------------
    async ensureAuth() {
        if (!this.token || Date.now() >= this.tokenExpiresAt - 60_000) {
            await this.authenticate();
        }
    }
    async fetch(path, init = {}, auth = false) {
        const headers = {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        };
        if (auth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        const res = await globalThis.fetch(this.baseUrl + path, { ...init, headers });
        if (!res.ok) {
            const body = await res.json().catch(() => ({ error: res.statusText }));
            const err = new Error(body.error || `HTTP ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return res.json();
    }
}
exports.KeyID = KeyID;
