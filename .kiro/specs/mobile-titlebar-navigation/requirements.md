# Requirements Document

## Introduction

This feature will redesign the current top panel navigation system to create a more streamlined, mobile-inspired titlebar interface. The current system uses two separate combo boxes for topic and subtopic selection along with speech configuration controls. The new design will consolidate these elements into a single, clean titlebar that displays the current topic name prominently while providing easy access to navigation and settings.

## Requirements

### Requirement 1

**User Story:** As a language learner, I want to see the current topic name displayed prominently in English, so that I can easily identify which lesson I'm currently working on without showing the full app name every time.

#### Acceptance Criteria

1. WHEN the application loads THEN the titlebar SHALL display the current topic name in English (e.g., "Colors", "Verbs")
2. WHEN I switch to a different topic THEN the title SHALL update immediately to reflect the new topic name
3. WHEN viewing the titlebar THEN the topic name SHALL be clearly readable and appropriately sized
4. WHEN the topic name is long THEN the text SHALL be truncated gracefully with ellipsis if needed
5. WHEN displaying the title THEN it SHALL NOT include the full app name "Arabic Learning Games" to save space

### Requirement 2

**User Story:** As a language learner, I want to quickly switch between topics and subtopics using compact controls, so that I can navigate efficiently without the interface taking up too much screen space.

#### Acceptance Criteria

1. WHEN I click on the topic selector THEN the system SHALL show a dropdown with all available topics (verbs, colors, etc.)
2. WHEN I select a new topic THEN the subtopic selector SHALL update to show relevant subtopics for that topic
3. WHEN I click on the subtopic selector THEN the system SHALL show a dropdown with all available subtopics for the current topic
4. WHEN I select a new subtopic THEN the mini game SHALL switch to display content for that subtopic
5. WHEN both selectors are closed THEN they SHALL take up minimal space in the titlebar

### Requirement 3

**User Story:** As a language learner, I want to access speech and other settings from the titlebar, so that I can configure my learning experience without navigating away from the current lesson.

#### Acceptance Criteria

1. WHEN I click the settings control in the titlebar THEN the system SHALL display speech configuration options
2. WHEN I adjust speech settings THEN the changes SHALL apply immediately to the current session
3. WHEN the settings panel is open THEN it SHALL not interfere with the main lesson content
4. WHEN I click outside the settings panel THEN it SHALL close automatically
5. WHEN settings are closed THEN the settings control SHALL take up minimal space in the titlebar

### Requirement 4

**User Story:** As a language learner, I want the titlebar to have a clean, mobile-app-like appearance, so that the interface feels modern and familiar.

#### Acceptance Criteria

1. WHEN viewing the titlebar THEN it SHALL have a single-line layout similar to mobile app titlebars
2. WHEN comparing to the old interface THEN the new titlebar SHALL use less vertical space
3. WHEN viewing on different screen sizes THEN the titlebar SHALL maintain its clean appearance and functionality
4. WHEN elements are arranged in the titlebar THEN they SHALL be properly spaced and aligned
5. WHEN the interface loads THEN the titlebar SHALL have consistent styling with the rest of the application

### Requirement 5

**User Story:** As a language learner, I want the navigation to be responsive and work well on different screen sizes, so that I can use the application on various devices.

#### Acceptance Criteria

1. WHEN viewing on mobile devices THEN the titlebar controls SHALL remain accessible and usable
2. WHEN the screen width is reduced THEN the titlebar elements SHALL adapt appropriately (stack, resize, or hide less critical elements)
3. WHEN using touch interfaces THEN the dropdown controls SHALL be easy to tap and interact with
4. WHEN viewing on desktop THEN the titlebar SHALL make efficient use of the available horizontal space
5. WHEN switching between portrait and landscape orientations THEN the titlebar SHALL maintain its functionality