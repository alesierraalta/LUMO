/**
 * REALTIME FALLBACK MODULE
 * Provides safe fallbacks for @supabase/realtime-js during server-side builds
 * Prevents "self is not defined" errors
 */

// Safe fallback for RealtimeClient
class RealtimeClientFallback {
  constructor() {
    this.channels = [];
    this.connected = false;
  }

  connect() {
    return Promise.resolve();
  }

  disconnect() {
    return Promise.resolve();
  }

  channel(topic) {
    return {
      subscribe: () => Promise.resolve(),
      unsubscribe: () => Promise.resolve(),
      on: () => {},
      off: () => {},
      send: () => Promise.resolve(),
    };
  }

  removeChannel() {
    return Promise.resolve();
  }

  removeAllChannels() {
    return Promise.resolve();
  }

  ref() {
    return Math.random().toString(36);
  }
}

// Safe fallback for RealtimeChannel
class RealtimeChannelFallback {
  constructor() {
    this.topic = '';
    this.params = {};
  }

  subscribe() {
    return Promise.resolve();
  }

  unsubscribe() {
    return Promise.resolve();
  }

  on() {
    return this;
  }

  off() {
    return this;
  }

  send() {
    return Promise.resolve();
  }
}

// Export fallbacks
module.exports = {
  RealtimeClient: RealtimeClientFallback,
  RealtimeChannel: RealtimeChannelFallback,
  REALTIME_LISTEN_TYPES: {
    BROADCAST: 'broadcast',
    PRESENCE: 'presence',
    POSTGRES_CHANGES: 'postgres_changes',
  },
  REALTIME_SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    TIMED_OUT: 'TIMED_OUT',
    CLOSED: 'CLOSED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
  },
  REALTIME_PRESENCE_LISTEN_EVENTS: {
    SYNC: 'sync',
    JOIN: 'join',
    LEAVE: 'leave',
  },
}; 