# Usability

## Navigation & Layout

I replaced the blank dashboard with a "Select a thread" placeholder so users aren't greeted by an empty screen. I added a close button to the create-thread page and tracked the last page state so users can back out without losing their place.

## Thread Browsing

I replaced the "load more" button with infinite scroll for smoother browsing. I made private threads visually distinguishable with an accent border and used text-overflow ellipsis on sidebar titles to keep the list clean.

## Optimistic Updates

I implemented optimistic like/unlike updates that reflect immediately in both the thread view and sidebar, rather than waiting for the API round-trip. If the request fails, the UI rolls back and shows an error.

## Comments

I restructured comment layout with clear header (avatar, author, date) and actions (like, edit, reply) sections for better visual hierarchy. I indented nested comments with a left border to make threading obvious. I also preserved textarea input during live-update polling so users don't lose what they've typed.

## Profiles

I moved profile editing into a modal overlay so users stay in context rather than navigating to a separate page.

## Error Handling

I surfaced all API errors through a consistent error popup with a dismiss button. I also added client-side password mismatch validation on registration before hitting the backend.

## Notifications

I implemented ping notifications for watched threads that auto-dismiss after 10 seconds and are clickable to navigate directly to the relevant thread.

## Delete Confirmation

I added a confirmation dialog before deleting threads so users don't accidentally lose content with a single misclick.

## Null Checks

I added null checks across the frontend to prevent crashes from empty or unexpected data. In `auth.js`, I validate that email, password, and name fields are non-empty before submitting login and registration requests. In `comments.js` and `thread.js`, I guard against empty comments and empty title before posting or editing.

## Dark Mode

I added a theme toggle that syncs with the user's OS preference via `prefers-color-scheme` and persists the choice in localStorage. A synchronous theme-init script prevents flash of wrong theme on page load.

## Offline Support

I cached thread and comment data in localStorage so users can view previously loaded content in a read-only mode when offline. An offline banner clearly indicates the read-only state, and the sidebar falls back to showing the last cached thread.

## Animations & Transitions

I added card entrance animations, button hover/active transforms, and modal fade-ins to make interactions feel smoother without distracting from content.

## Mobile Navigation

I added a back button and sidebar/content view toggling on mobile so sidebar/content is more visibly accessible for the users and they can switch between the thread list and thread content without losing context.

## Responsiveness

I added breakpoints at 768px and 480px so the sidebar stacks above content on smaller viewports. I sized touch targets for comfortable mobile interaction.
