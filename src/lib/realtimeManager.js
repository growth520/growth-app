import { supabase } from './customSupabaseClient';

class RealtimeManager {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
  }

  // Subscribe to a specific table with a callback
  subscribe(table, event, callback, filter = null) {
    const channelKey = `${table}:${event}`;
    
    if (this.channels.has(channelKey)) {
      // Channel already exists, just add callback
      this.subscribers.get(channelKey).add(callback);
      return () => this.unsubscribe(table, event, callback);
    }

    // Create new channel
    const channel = supabase.channel(channelKey);
    
    let subscription = channel.on('postgres_changes', {
      event,
      schema: 'public',
      table,
      ...(filter && { filter })
    }, (payload) => {
      // Notify all subscribers
      const callbacks = this.subscribers.get(channelKey);
      if (callbacks) {
        callbacks.forEach(cb => {
          try {
            cb(payload);
          } catch (error) {
            console.error('Error in realtime callback:', error);
          }
        });
      }
    });

    this.channels.set(channelKey, channel);
    this.subscribers.set(channelKey, new Set([callback]));
    
    // Subscribe to the channel
    subscription.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`🔔 Realtime: Subscribed to ${table}:${event}`);
      }
    });

    return () => this.unsubscribe(table, event, callback);
  }

  // Unsubscribe from a specific callback
  unsubscribe(table, event, callback) {
    const channelKey = `${table}:${event}`;
    const callbacks = this.subscribers.get(channelKey);
    
    if (callbacks) {
      callbacks.delete(callback);
      
      // If no more callbacks, remove the channel
      if (callbacks.size === 0) {
        const channel = this.channels.get(channelKey);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelKey);
          this.subscribers.delete(channelKey);
          console.log(`🔔 Realtime: Unsubscribed from ${table}:${event}`);
        }
      }
    }
  }

  // Subscribe to posts with efficient updates
  subscribeToPosts(callback) {
    return this.subscribe('posts', 'INSERT', (payload) => {
      // Add new post to the top of the feed
      callback({
        type: 'POST_ADDED',
        post: payload.new
      });
    });
  }

  // Subscribe to post updates (likes, comments, views)
  subscribeToPostUpdates(callback) {
    const unsubscribeInsert = this.subscribe('posts', 'UPDATE', (payload) => {
      callback({
        type: 'POST_UPDATED',
        post: payload.new,
        old: payload.old
      });
    });

    const unsubscribeLikes = this.subscribe('likes', 'INSERT', (payload) => {
      callback({
        type: 'LIKE_ADDED',
        like: payload.new
      });
    });

    const unsubscribeComments = this.subscribe('comments', 'INSERT', (payload) => {
      callback({
        type: 'COMMENT_ADDED',
        comment: payload.new
      });
    });

    return () => {
      unsubscribeInsert();
      unsubscribeLikes();
      unsubscribeComments();
    };
  }

  // Subscribe to user progress updates
  subscribeToUserProgress(userId, callback) {
    return this.subscribe('user_progress', 'UPDATE', (payload) => {
      if (payload.new.user_id === userId) {
        callback({
          type: 'PROGRESS_UPDATED',
          progress: payload.new
        });
      }
    }, `user_id=eq.${userId}`);
  }

  // Subscribe to leaderboard updates
  subscribeToLeaderboardUpdates(callback) {
    return this.subscribe('user_progress', 'UPDATE', (payload) => {
      callback({
        type: 'LEADERBOARD_UPDATED',
        progress: payload.new
      });
    });
  }

  // Subscribe to notifications
  subscribeToNotifications(userId, callback) {
    return this.subscribe('notifications', 'INSERT', (payload) => {
      if (payload.new.user_id === userId) {
        callback({
          type: 'NOTIFICATION_ADDED',
          notification: payload.new
        });
      }
    }, `user_id=eq.${userId}`);
  }

  // Subscribe to follows
  subscribeToFollows(callback) {
    const unsubscribeInsert = this.subscribe('follows', 'INSERT', (payload) => {
      callback({
        type: 'FOLLOW_ADDED',
        follow: payload.new
      });
    });

    const unsubscribeDelete = this.subscribe('follows', 'DELETE', (payload) => {
      callback({
        type: 'FOLLOW_REMOVED',
        follow: payload.old
      });
    });

    return () => {
      unsubscribeInsert();
      unsubscribeDelete();
    };
  }

  // Subscribe to profile updates
  subscribeToProfileUpdates(userId, callback) {
    return this.subscribe('profiles', 'UPDATE', (payload) => {
      if (payload.new.id === userId) {
        callback({
          type: 'PROFILE_UPDATED',
          profile: payload.new
        });
      }
    }, `id=eq.${userId}`);
  }

  // Clean up all subscriptions
  cleanup() {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
      console.log(`🔔 Realtime: Cleaned up ${key}`);
    });
    this.channels.clear();
    this.subscribers.clear();
  }
}

// Create singleton instance
const realtimeManager = new RealtimeManager();

export default realtimeManager; 