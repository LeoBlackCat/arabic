# Implementation Plan

- [x] 1. Create TitleBar component structure
  - Create new file `src/TitleBar.js` with basic React component structure
  - Define component props interface and default props
  - Set up basic JSX structure with placeholder elements for topic name, selectors, and settings
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement topic name display logic
  - Create topic name mapping from content types to display names
  - Implement dynamic topic name calculation based on selected content
  - Add proper text styling and truncation handling for long names
  - Write unit tests for topic name display functionality
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Build content type selector dropdown
  - Implement dropdown component with current content type selection
  - Add onChange handler to communicate selection changes to parent
  - Style dropdown to match existing design system
  - Ensure dropdown options are properly labeled and accessible
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Build game type selector dropdown
  - Implement game type dropdown with dynamic options based on content type
  - Add logic to filter available games based on selected content
  - Implement onChange handler for game selection changes
  - Add proper styling and accessibility attributes
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 5. Create settings button integration
  - Implement settings button with icon and proper styling
  - Add click handler to trigger settings modal
  - Implement visual indicator for active speech services
  - Ensure button meets touch target size requirements for mobile
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 6. Implement responsive layout system
  - Add CSS classes for different screen size breakpoints
  - Implement layout adjustments for mobile, tablet, and desktop
  - Test and adjust element spacing and sizing across breakpoints
  - Ensure touch-friendly interactions on mobile devices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Integrate TitleBar into GameHub component
  - Import TitleBar component into GameHub.js
  - Replace existing header section with TitleBar component
  - Pass required props from GameHub state to TitleBar
  - Wire up event handlers for content/game selection changes
  - _Requirements: 2.2, 2.4, 3.2_

- [x] 8. Update GameHub state management
  - Modify GameHub to work with TitleBar component's prop requirements
  - Ensure proper state synchronization between TitleBar and game components
  - Test state changes when switching between content types and games
  - Verify settings modal integration continues to work properly
  - _Requirements: 2.2, 2.4, 3.1, 3.2_

- [x] 9. Add error handling and edge cases
  - Implement loading states for when content data is being fetched
  - Add fallback behavior for invalid content/game combinations
  - Handle empty content arrays gracefully
  - Add error boundaries for dropdown interaction failures
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 10. Write comprehensive tests
  - Create unit tests for TitleBar component with various prop combinations
  - Test dropdown state management and selection handling
  - Add integration tests for GameHub and TitleBar interaction
  - Test responsive behavior at different viewport sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Optimize performance and accessibility
  - Add React.memo optimization to TitleBar component if needed
  - Implement proper ARIA labels and keyboard navigation support
  - Test with screen readers and ensure accessibility compliance
  - Optimize re-render performance for dropdown interactions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Final integration and cleanup
  - Remove old header code from GameHub component
  - Clean up any unused CSS classes or imports
  - Test complete user workflow from topic selection to game play
  - Verify all existing functionality continues to work as expected
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_