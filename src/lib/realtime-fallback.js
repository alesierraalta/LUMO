/**
 * ENHANCED REALTIME FALLBACK MODULE
 * Provides comprehensive fallbacks for @supabase/realtime-js during server-side builds
 * Prevents "Cannot find module" errors in Choreo deployment
 */

// Enhanced RealtimeClient fallback with more complete API
class RealtimeClientFallback {
  constructor(endpointURL, options = {}) {
    this.endpointURL = endpointURL;
    this.options = options;
    this.channels = [];
    this.connected = false;
    this.connectionState = 'disconnected';
    this.heartbeatIntervalMs = 30000;
    this.heartbeatTimer = null;
    this.ref = 0;
  }

  connect() {
    this.connected = true;
    this.connectionState = 'connected';
    return Promise.resolve();
  }

  disconnect(callback) {
    this.connected = false;
    this.connectionState = 'disconnected';
    if (callback) callback();
    return Promise.resolve();
  }

  channel(topic, params = {}) {
    const channel = new RealtimeChannelFallback(topic, params, this);
    this.channels.push(channel);
    return channel;
  }

  removeChannel(channel) {
    const index = this.channels.indexOf(channel);
    if (index > -1) {
      this.channels.splice(index, 1);
    }
    return Promise.resolve();
  }

  removeAllChannels() {
    this.channels = [];
    return Promise.resolve();
  }

  ref() {
    return ++this.ref;
  }

  setAuth(token) {
    this.options.accessToken = token;
    return this;
  }

  // Additional methods for compatibility
  isConnected() {
    return this.connected;
  }

  sendHeartbeat() {
    // No-op for fallback
  }

  makeRef() {
    return this.ref().toString();
  }
}

// Enhanced RealtimeChannel fallback with more complete API
class RealtimeChannelFallback {
  constructor(topic, params = {}, socket = null) {
    this.topic = topic;
    this.params = params;
    this.socket = socket;
    this.state = 'closed';
    this.bindings = [];
    this.timeout = 10000;
    this.joinedOnce = false;
    this.joinRef = null;
    this.ref = 0;
  }

  subscribe(callback) {
    this.state = 'joined';
    this.joinedOnce = true;
    if (callback) {
      setTimeout(() => callback('SUBSCRIBED'), 0);
    }
    return Promise.resolve({ status: 'ok' });
  }

  unsubscribe() {
    this.state = 'closed';
    return Promise.resolve({ status: 'ok' });
  }

  on(type, filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = {};
    }
    this.bindings.push({ type, filter, callback });
    return this;
  }

  off(type, filter) {
    this.bindings = this.bindings.filter(bind => 
      bind.type !== type || (filter && bind.filter !== filter)
    );
    return this;
  }

  send(event, payload = {}) {
    return Promise.resolve({ status: 'ok' });
  }

  track(payload) {
    return Promise.resolve({ status: 'ok' });
  }

  untrack() {
    return Promise.resolve({ status: 'ok' });
  }

  // Additional methods for compatibility
  push(event, payload = {}, timeout = this.timeout) {
    return Promise.resolve({ status: 'ok' });
  }

  leave() {
    return this.unsubscribe();
  }

  onError(callback) {
    return this.on('error', callback);
  }

  onClose(callback) {
    return this.on('close', callback);
  }
}

// Enhanced constants and types for better compatibility
const REALTIME_LISTEN_TYPES = {
  BROADCAST: 'broadcast',
  PRESENCE: 'presence',
  POSTGRES_CHANGES: 'postgres_changes',
};

const REALTIME_SUBSCRIBE_STATES = {
  SUBSCRIBED: 'SUBSCRIBED',
  TIMED_OUT: 'TIMED_OUT',
  CLOSED: 'CLOSED',
  CHANNEL_ERROR: 'CHANNEL_ERROR',
};

const REALTIME_PRESENCE_LISTEN_EVENTS = {
  SYNC: 'sync',
  JOIN: 'join',
  LEAVE: 'leave',
};

const REALTIME_CHANNEL_STATES = {
  closed: 'closed',
  errored: 'errored',
  joined: 'joined',
  joining: 'joining',
  leaving: 'leaving',
};

// Enhanced export with more comprehensive API
const RealtimeClient = RealtimeClientFallback;
const RealtimeChannel = RealtimeChannelFallback;

// Default export for compatibility
const createClient = (endpointURL, options) => new RealtimeClientFallback(endpointURL, options);

// Multiple export formats for maximum compatibility
module.exports = {
  RealtimeClient,
  RealtimeChannel,
  RealtimeClientFallback,
  RealtimeChannelFallback,
  REALTIME_LISTEN_TYPES,
  REALTIME_SUBSCRIBE_STATES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_CHANNEL_STATES,
  createClient,
  default: RealtimeClient
};

// ES6 export compatibility
module.exports.default = RealtimeClient;
module.exports.RealtimeClient = RealtimeClient;
module.exports.RealtimeChannel = RealtimeChannel; 