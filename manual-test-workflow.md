# Manual Test Workflow - Mobile TitleBar Navigation

## Test Checklist

### ✅ Initial State
- [x] Application loads with TitleBar showing "Verbs" as topic name
- [x] Content selector shows "Verbs" selected
- [x] Game selector shows "Speech Recognition" selected
- [x] Settings button is visible and inactive (gray)
- [x] Game content loads below the TitleBar

### ✅ Content Type Changes
- [x] Changing content type updates topic name immediately
- [x] Available games update based on content type
- [x] Invalid game selections are auto-corrected
- [x] Content data loads for each content type

### ✅ Game Type Changes
- [x] Switching games changes the displayed game component
- [x] Game receives correct props (content data, content type)
- [x] State remains consistent between TitleBar and game

### ✅ Settings Integration
- [x] Settings button opens speech configuration modal
- [x] Settings button shows active state when speech is enabled
- [x] Modal can be closed and settings are preserved
- [x] Speech configuration changes are reflected in the TitleBar

### ✅ Responsive Design
- [x] Mobile layout (< 640px): Stacked elements, touch-friendly
- [x] Tablet layout (≥ 640px): Single row layout
- [x] Desktop layout (≥ 768px): Full horizontal layout
- [x] All elements remain accessible at different screen sizes

### ✅ Accessibility
- [x] Screen reader announcements for topic changes
- [x] Proper ARIA labels on all interactive elements
- [x] Keyboard navigation works for all controls
- [x] Focus management is maintained

### ✅ Error Handling
- [x] Loading states display correctly
- [x] Empty content arrays handled gracefully
- [x] Invalid game/content combinations prevented
- [x] Dropdown errors caught by error boundaries

### ✅ Performance
- [x] No unnecessary re-renders during state changes
- [x] Smooth transitions between games
- [x] Responsive interactions without lag

## Workflow Test Steps

1. **Load Application**
   - Verify TitleBar displays "Verbs" topic
   - Verify default game loads (Speech Recognition)

2. **Change Content Type**
   - Select "Colors" from content dropdown
   - Verify topic changes to "Colors"
   - Verify game options update appropriately

3. **Change Game Type**
   - Select different game from game dropdown
   - Verify game component switches correctly
   - Verify content data is passed to new game

4. **Test Settings**
   - Click settings button
   - Configure speech settings
   - Verify button shows active state
   - Close settings and verify state persists

5. **Test Responsive Behavior**
   - Resize browser window to mobile size
   - Verify layout switches to stacked mobile layout
   - Test touch interactions on mobile layout

6. **Test Complete Workflow**
   - Start with Verbs → Speech Recognition
   - Switch to Nouns → Possessive Game
   - Switch to Colors → Image Choice Game
   - Switch to Phrases → Phrase Game
   - Verify each transition works smoothly

## Results
All tests passed successfully. The mobile titlebar navigation feature is fully integrated and working as designed.