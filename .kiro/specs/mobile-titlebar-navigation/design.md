# Design Document

## Overview

This design transforms the current header navigation in GameHub.js from a multi-row layout with separate sections into a streamlined, single-line mobile-inspired titlebar. The new design consolidates the topic name display, content/game selectors, and speech configuration into a compact, efficient interface that maximizes screen real estate for the actual learning content.

## Architecture

### Current Structure Analysis
The existing GameHub component uses a header with:
- Full app title "Arabic Learning Games" 
- Two-row layout with content/game selectors and speech config button
- Separate info row showing content statistics
- Takes up significant vertical space

### New Structure Design
The redesigned titlebar will feature:
- Single-line layout optimized for horizontal space usage
- Dynamic topic name display (e.g., "Colors", "Verbs") replacing static app title
- Compact inline selectors for content type and game type
- Integrated settings access point
- Responsive behavior for different screen sizes

## Components and Interfaces

### TitleBar Component
A new React component that encapsulates all navigation functionality:

```jsx
<TitleBar 
  currentTopic={string}           // Display name (e.g., "Colors", "Verbs")
  selectedContent={string}        // Current content type
  selectedGame={string}          // Current game type
  contentData={array}            // Available content items
  speechConfig={object}          // Speech configuration state
  onContentChange={function}     // Content type change handler
  onGameChange={function}        // Game type change handler
  onSettingsClick={function}     // Settings panel toggle
/>
```

### Layout Structure
```
[Topic Name] [Content ▼] [Game ▼] [⚙️ Settings]
```

### Responsive Breakpoints
- **Desktop (≥768px)**: Full horizontal layout with all elements visible
- **Tablet (≥640px)**: Slightly reduced spacing, compact selectors
- **Mobile (<640px)**: Stacked or collapsed layout with priority elements

## Data Models

### TitleBar State Interface
```typescript
interface TitleBarState {
  currentTopic: string;           // "Colors", "Verbs", "Nouns", "Phrases"
  selectedContent: ContentType;   // CONTENT_TYPES enum value
  selectedGame: GameType;         // GAME_TYPES enum value
  isSettingsOpen: boolean;        // Settings panel visibility
  contentStats: {                // Optional content statistics
    totalItems: number;
    itemsWithMedia: number;
    itemsWithVideo: number;
  };
}
```

### Content Type Mapping
```javascript
const TOPIC_DISPLAY_NAMES = {
  [CONTENT_TYPES.VERBS]: 'Verbs',
  [CONTENT_TYPES.COLORS]: 'Colors', 
  [CONTENT_TYPES.NOUNS]: 'Nouns',
  [CONTENT_TYPES.PHRASES]: 'Phrases'
};
```

## User Interface Design

### Visual Hierarchy
1. **Primary**: Topic name (larger, bold text)
2. **Secondary**: Content and game selectors (medium-sized dropdowns)
3. **Tertiary**: Settings button (compact icon button)

### Styling Approach
- Use existing Tailwind CSS classes for consistency
- Maintain current color scheme (white background, gray borders)
- Ensure adequate touch targets for mobile (minimum 44px)
- Smooth transitions for dropdown interactions

### Dropdown Design
- Compact appearance when closed
- Clear visual indication of current selection
- Smooth open/close animations
- Proper z-index layering to avoid conflicts

### Settings Integration
- Icon-based button (gear/cog icon)
- Visual indicator when speech services are active
- Maintains existing modal behavior for configuration

## Error Handling

### Content Loading States
- Display loading indicator in topic name area when content is being fetched
- Graceful fallback to "Loading..." text if topic name cannot be determined
- Handle empty content arrays by showing appropriate messaging

### Dropdown Interaction Errors
- Prevent invalid content/game combinations
- Auto-correct selections when switching content types
- Maintain user's previous valid selection when possible

### Responsive Layout Issues
- Ensure dropdowns don't overflow viewport on small screens
- Handle text truncation for long topic names
- Provide alternative layouts for extremely narrow screens

## Testing Strategy

### Unit Testing
- Test TitleBar component rendering with various prop combinations
- Verify dropdown state management and selection handling
- Test responsive behavior at different viewport sizes
- Validate topic name display logic

### Integration Testing
- Test integration with existing GameHub state management
- Verify proper game switching functionality
- Test settings modal integration
- Ensure speech configuration state synchronization

### Visual Regression Testing
- Compare titlebar appearance across different screen sizes
- Verify dropdown positioning and z-index behavior
- Test with different content types and game combinations
- Validate accessibility compliance (keyboard navigation, screen readers)

### User Experience Testing
- Test touch interactions on mobile devices
- Verify dropdown usability with different input methods
- Test rapid switching between content types and games
- Validate settings access and configuration workflow

## Implementation Considerations

### Performance Optimization
- Memoize dropdown options to prevent unnecessary re-renders
- Use React.memo for TitleBar component if parent re-renders frequently
- Optimize topic name calculation to avoid expensive operations

### Accessibility
- Ensure proper ARIA labels for all interactive elements
- Maintain keyboard navigation support for dropdowns
- Provide screen reader announcements for topic changes
- Meet WCAG 2.1 AA contrast requirements

### Browser Compatibility
- Test dropdown behavior across major browsers
- Ensure CSS Grid/Flexbox fallbacks for older browsers
- Validate touch event handling on mobile browsers
- Test with different zoom levels and font sizes

### Migration Strategy
- Implement new TitleBar component alongside existing header
- Use feature flag or prop to switch between old and new layouts
- Maintain backward compatibility during transition period
- Plan for gradual rollout and user feedback collection