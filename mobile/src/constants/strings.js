/**
 * Centralised UI strings — i18n-ready.
 * Every visible string used in the Profile section lives here.
 */

const STRINGS = {
  // ─── Profile Header ──────────────────────────────────────────────
  PROFILE_TITLE: 'My Profile',
  EDIT_PROFILE: 'Edit Profile',
  DISTANCE_AWAY: (d) => `~${d}m away`,

  // ─── Vibe Status ─────────────────────────────────────────────────
  VIBE_OPEN: 'Open to chat',
  VIBE_BROWSING: 'Just browsing',
  VIBE_BUSY: 'Busy',

  // ─── 24h Status Bar ──────────────────────────────────────────────
  STATUS_PLACEHOLDER: "What's on your mind today?",
  STATUS_SET_BUTTON: 'Set Status',
  STATUS_RESETS_IN: (h, m) => `Resets in ${h}h ${m}m`,
  STATUS_EXPIRED: 'Status expired',
  STATUS_CHAR_LIMIT: (cur, max) => `${cur}/${max}`,

  // ─── Mood Picker ─────────────────────────────────────────────────
  MOOD_PICKER_TITLE: 'Choose your mood',
  MOOD_PICKER_SUBTITLE: 'Sets the gradient ring around your photo',

  // ─── Interest Pills ──────────────────────────────────────────────
  INTERESTS_ADD: '+ Add',
  INTERESTS_MATCH: '✓ Match',
  INTERESTS_SEARCH_PLACEHOLDER: 'Search or type a new interest…',
  INTERESTS_MAX_REACHED: 'Maximum 10 interests reached!',
  INTERESTS_DONE: 'Done',
  INTERESTS_TITLE: 'Add Interests',

  // ─── Hot Take Widget ─────────────────────────────────────────────
  HOT_TAKE_LABEL: '🔥 Hot Take',
  HOT_TAKE_EMPTY_PROMPT: 'Drop your hottest take 🔥',
  HOT_TAKE_EDIT_TITLE: 'Edit Hot Take',
  HOT_TAKE_SAVE: 'Save',
  HOT_TAKE_AGREE: '👏',
  HOT_TAKE_DISAGREE: '🙄',
  HOT_TAKE_CHAR_LIMIT: (cur, max) => `${cur}/${max}`,

  // ─── Anthem Widget ───────────────────────────────────────────────
  ANTHEM_LABEL: 'Currently on repeat',
  ANTHEM_EMPTY_PROMPT: '🎵 Set your anthem',
  ANTHEM_SEARCH_TITLE: 'Change Anthem',
  ANTHEM_SEARCH_PLACEHOLDER: 'Search for a song…',
  ANTHEM_CHANGE: 'Change Anthem',

  // ─── Chat Request CTA ────────────────────────────────────────────
  SEND_CHAT_REQUEST: 'Send Chat Request',
  CHAT_REQUEST_SENT: 'Request Sent ✓',

  // ─── Two Truths & a Lie (Phase 2) ────────────────────────────────
  TWO_TRUTHS_LABEL: 'Two Truths & a Lie',
  TWO_TRUTHS_EMPTY_PROMPT: 'Add Two Truths & a Lie 🤔',
  TWO_TRUTHS_EDIT_TITLE: 'Edit Two Truths & a Lie',
  TWO_TRUTHS_TRUTH_1: 'Truth 1',
  TWO_TRUTHS_TRUTH_2: 'Truth 2',
  TWO_TRUTHS_LIE: 'Lie',
  TWO_TRUTHS_SHUFFLE: 'Shuffle Order',
  TWO_TRUTHS_GUESS_TITLE: "You think it's a lie! 👀",
  TWO_TRUTHS_GUESS_BODY: (name) => `Send ${name} your guess and start a chat?`,
  TWO_TRUTHS_SEND_GUESS: 'Send Guess & Chat',
  TWO_TRUTHS_QUIET_GUESS: 'Just guess quietly',
  TWO_TRUTHS_YOUR_GUESS: 'Your guess',
  TWO_TRUTHS_GUESSED: (pct) => `${pct}% guessed this`,
  TWO_TRUTHS_ICEBREAKER: (statement) => `I think '${statement}' is the lie 👀`,
  TWO_TRUTHS_CHAR_LIMIT: (cur, max) => `${cur}/${max}`,

  // ─── Neighborhood Titles (Phase 2) ───────────────────────────────
  TITLES_SHEET_TITLE: 'My Titles',
  TITLES_EARNED: 'Earned',
  TITLES_LOCKED: 'Locked',
  TITLES_EARNED_ON: (date) => `Earned ${date}`,
  TITLES_PIN: 'Set as Active',
  TITLES_PINNED: 'Active ✓',
  TITLES_TOOLTIP_PREFIX: 'Earned by:',
  TITLES_NEW_UNLOCK: '🎉 New Title Unlocked!',

  // ─── Video Glance (Phase 2) ──────────────────────────────────────
  GLANCE_LABEL: '▶ Glance',
  GLANCE_UPLOAD_TITLE: 'Profile Media',
  GLANCE_UPLOAD_PHOTO: 'Upload Photo',
  GLANCE_RECORD: 'Record Glance (3s)',
  GLANCE_UPLOAD_VIDEO: 'Upload Video Glance',
  GLANCE_TRIM_TITLE: 'Trim & Preview',
  GLANCE_CONFIRM: 'Use This Glance',
  GLANCE_FILE_TOO_LARGE: 'Video must be under 10MB',
  GLANCE_UPLOADING: 'Uploading Glance…',

  // ─── Favorite Local Spot (Phase 3) ─────────────────────────────
  SPOT_LABEL: 'Favorite Spot',
  SPOT_EMPTY_PROMPT: '📍 Tag your favorite local spot',
  SPOT_SEARCH_TITLE: 'Find a Local Spot',
  SPOT_SEARCH_PLACEHOLDER: 'Search for a place…',
  SPOT_SEARCH_HINT: 'Type at least 2 characters to search',
  SPOT_NO_RESULTS: 'No places found. Try a different search.',
  SPOT_CONFIRM_TITLE: 'Tag this as your spot?',
  SPOT_CONFIRM_BTN: 'Tag This Spot',
  SPOT_MUTUAL: '📍 You both love this spot!',
  SPOT_REMOVE: 'Remove Spot',
  SPOT_CHANGE: 'Change Spot',

  // ─── Profile Analytics (Phase 3) ──────────────────────────────
  ANALYTICS_TAB: 'Stats',
  ANALYTICS_PROFILE_TAB: 'Profile',
  ANALYTICS_VIEWS: 'Profile views',
  ANALYTICS_CHAT_REQUESTS: 'Chat requests received',
  ANALYTICS_ACCEPTED: 'Requests accepted',
  ANALYTICS_GUESSES: 'Two Truths guesses',
  ANALYTICS_HOT_TAKE: 'Hot Take reactions',
  ANALYTICS_ANTHEM_TAPS: 'Anthem taps',
  ANALYTICS_PERIOD: 'Last 7 days',
  ANALYTICS_INSIGHT_GREAT: 'Your profile is performing well this week 🚀',
  ANALYTICS_INSIGHT_STEADY: 'Steady engagement — keep it up! 💪',
  ANALYTICS_INSIGHT_QUIET: 'Quiet week — update your status to attract more views 👀',

  // ─── Widget Manager (Phase 3) ─────────────────────────────────
  WIDGET_MANAGER_TITLE: 'Manage Widgets',
  WIDGET_MANAGER_SUBTITLE: 'Toggle widgets visible on your public profile',

  // ─── Spotify Integration (Phase 3) ────────────────────────────
  SPOTIFY_CONNECT: 'Connect Spotify',
  SPOTIFY_DISCONNECT: 'Disconnect Spotify',
  SPOTIFY_LIVE: 'Live from Spotify 🟢',
  SPOTIFY_CONNECTING: 'Connecting…',
  SPOTIFY_APPLE_COMING_SOON: 'Apple Music — Coming Soon',
  SPOTIFY_MANUAL_OVERRIDE: 'Pin a specific song',

  // ─── General ─────────────────────────────────────────────────────
  CANCEL: 'Cancel',
  SAVE: 'Save',
  LOADING: 'Loading…',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  SIGN_OUT: 'Sign Out',
  SIGN_OUT_CONFIRM: 'Are you sure you want to sign out?',
};

export default STRINGS;
