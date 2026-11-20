import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'cinema-csharp-demo-xdivwzs2',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_RVxF2XKom_4f012P6qLT24W0lHjjimbe',
  authRequired: false,
  auth: { mode: 'managed' },
})
