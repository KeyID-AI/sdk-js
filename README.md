# @keyid/sdk

Official JavaScript/TypeScript SDK for [KeyID.ai](https://keyid.ai) — agent email infrastructure with zero human in the loop.

Agents self-provision Ed25519 keypair identity, authenticate via challenge-response, and get rotatable email addresses from shared domain pools.

## Install

```bash
npm install @keyid/sdk
```

## Quick Start

```typescript
import { KeyID } from '@keyid/sdk';

const agent = new KeyID();

// Register — get an email address instantly
const { email, agentId } = await agent.provision();
console.log(`Agent email: ${email}`);

// Read inbox
const { messages } = await agent.getInbox();

// Send email
await agent.send('user@example.com', 'Hello', 'Message body');

// Reply to a message
await agent.reply(messages[0].id, 'Thanks for your email!');
```

## Authentication

KeyID uses Ed25519 challenge-response authentication. The SDK handles this automatically:

1. On first use, a keypair is generated (or loaded from env/options)
2. `provision()` registers the public key and returns an email address
3. All subsequent calls auto-authenticate via signed nonce exchange

```typescript
// Option 1: Auto-generate keypair (default)
const agent = new KeyID();

// Option 2: Provide existing keypair
const agent = new KeyID({
  keypair: { publicKey: '...hex...', privateKey: '...hex...' }
});

// Option 3: Custom base URL
const agent = new KeyID({ baseUrl: 'https://your-instance.com' });
```

## API Reference

### Identity

| Method | Description |
|--------|-------------|
| `provision()` | Register agent, get email address |
| `getIdentity()` | Get agent identity (email, domain, classification) |
| `getAddresses()` | List all addresses (current + historical) |
| `getRecoveryToken()` | Get recovery token for key rotation |

### Messages

| Method | Description |
|--------|-------------|
| `getInbox(options?)` | Fetch inbox with pagination, filtering, search |
| `getMessage(id)` | Get single message detail |
| `updateMessage(id, options)` | Update labels, read/starred status |
| `getUnreadCount()` | Count unread inbound messages |
| `send(to, subject, body, options?)` | Send email (supports HTML, CC/BCC, scheduled) |
| `reply(messageId, body, options?)` | Reply to a message |
| `replyAll(messageId, body, options?)` | Reply-all |
| `forward(messageId, to, body?)` | Forward a message |

### Threads

| Method | Description |
|--------|-------------|
| `listThreads(options?)` | List conversation threads |
| `getThread(threadId)` | Get thread with all messages |
| `deleteThread(threadId, permanent?)` | Delete thread |

### Drafts

| Method | Description |
|--------|-------------|
| `createDraft(options)` | Create a draft |
| `getDraft(draftId)` | Get draft detail |
| `updateDraft(draftId, options)` | Update draft |
| `deleteDraft(draftId)` | Delete draft |
| `sendDraft(draftId)` | Send a draft |

### Settings

| Method | Description |
|--------|-------------|
| `getSignature()` | Get email signature |
| `setSignature(text, html?)` | Set email signature |
| `getForwarding()` | Get forwarding settings |
| `setForwarding(options)` | Configure email forwarding |
| `getAutoReply()` | Get auto-reply/vacation settings |
| `setAutoReply(options)` | Configure auto-reply |

### Contacts

| Method | Description |
|--------|-------------|
| `listContacts(options?)` | List saved contacts |
| `createContact(options)` | Create a contact |
| `getContact(contactId)` | Get contact detail |
| `updateContact(contactId, options)` | Update contact |
| `deleteContact(contactId)` | Delete contact |

### Webhooks

| Method | Description |
|--------|-------------|
| `listWebhooks()` | List webhooks |
| `createWebhook(url, events?, options?)` | Create webhook |
| `getWebhook(webhookId)` | Get webhook detail |
| `updateWebhook(webhookId, options)` | Update webhook |
| `deleteWebhook(webhookId)` | Delete webhook |
| `getWebhookDeliveries(options?)` | Delivery history |

### Lists & Metrics

| Method | Description |
|--------|-------------|
| `addToList(direction, type, entry)` | Add to allow/blocklist |
| `removeFromList(direction, type, entry)` | Remove from list |
| `getList(direction, type)` | Get list entries |
| `getMetrics(options?)` | Query usage metrics |

## Features

- **Scheduled Send** — `send('to@x.com', 'Sub', 'Body', { scheduledAt: '2025-01-01T10:00:00Z' })`
- **Full-Text Search** — `getInbox({ search: 'invoice' })`
- **Starred Messages** — `updateMessage(id, { isStarred: true })`
- **Auto-Reply** — `setAutoReply({ enabled: true, body: 'Out of office', endDate: '...' })`
- **HTML Email** — `send('to@x.com', 'Sub', 'text', { html: '<h1>Hello</h1>' })`
- **Attachments** — `send('to@x.com', 'Sub', 'Body', { attachments: [{ filename, content, contentType }] })`

## Requirements

- Node.js 18+
- No external dependencies

## License

MIT
