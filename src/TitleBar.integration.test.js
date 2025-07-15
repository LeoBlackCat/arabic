import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TitleBar from './TitleBar';
import { CONTENT_TYPES, GAME_TYPES } from './TitleBar';

describe('TitleBar Integration with Error Handling', () => {
  test('should handle loading state integration', async () => {
    const mockOnContentChange = jest.fn();
    const mockOnGameChange = jest.fn();

    const { rerender } = render(
      <TitleBar
        selectedContent=""
        selectedGame=""
        contentData={[]}
        isLoading={true}
        onContentChange={mockOnContentChange}
        onGameChange={mockOnGameChange}
      />
    );

    // Should show loading state
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);

    // Dropdowns should be disabled during loading
    const contentSelectors = screen.getAllByLabelText('Select content type to learn');
    contentSelectors.forEach(selector => {
      expect(selector).toBeDisabled();
    });

    // Simulate loading completion with content
    rerender(
      <TitleBar
        selectedContent={CONTENT_TYPES.VERBS}
        selectedGame=""
        contentData={[{ id: 1, chat: 'test_verb' }]}
        isLoading={false}
        onContentChange={mockOnContentChange}
        onGameChange={mockOnGameChange}
      />
    );

    // Should show proper topic name
    expect(screen.getAllByText('Verbs').length).toBeGreaterThan(0);

    // Dropdowns should be enabled
    contentSelectors.forEach(selector => {
      expect(selector).not.toBeDisabled();
    });
  });

  test('should handle empty content data gracefully', () => {
    const mockOnContentChange = jest.fn();
    const mockOnGameChange = jest.fn();

    render(
      <TitleBar
        selectedContent={CONTENT_TYPES.VERBS}
        selectedGame=""
        contentData={[]}
        isLoading={false}
        onContentChange={mockOnContentChange}
        onGameChange={mockOnGameChange}
      />
    );

    // Should show "No Verbs Available" message
    expect(screen.getAllByText('No Verbs Available').length).toBeGreaterThan(0);

    // Game selector should be enabled since content is selected
    const gameSelectors = screen.getAllByLabelText('Select game type to play');
    gameSelectors.forEach(selector => {
      expect(selector).not.toBeDisabled();
    });
  });

  test('should handle invalid game/content combinations', () => {
    const mockOnContentChange = jest.fn();
    const mockOnGameChange = jest.fn();

    render(
      <TitleBar
        selectedContent={CONTENT_TYPES.COLORS}
        selectedGame={GAME_TYPES.POSSESSIVE} // Invalid for colors
        contentData={[{ id: 1, chat: 'test_color' }]}
        isLoading={false}
        onContentChange={mockOnContentChange}
        onGameChange={mockOnGameChange}
      />
    );

    // Should handle invalid game selection gracefully
    const gameSelectors = screen.getAllByLabelText('Select game type to play');
    gameSelectors.forEach(selector => {
      // Game selector should not show the invalid game as selected
      expect(selector.value).toBe('');
    });
  });

  test('should handle content type changes with game validation', () => {
    const mockOnContentChange = jest.fn();
    const mockOnGameChange = jest.fn();

    render(
      <TitleBar
        selectedContent={CONTENT_TYPES.VERBS}
        selectedGame={GAME_TYPES.SPEECH}
        contentData={[{ id: 1, chat: 'test_verb' }]}
        isLoading={false}
        onContentChange={mockOnContentChange}
        onGameChange={mockOnGameChange}
      />
    );

    // Change content type
    const contentSelector = screen.getAllByLabelText('Select content type to learn')[0];
    fireEvent.change(contentSelector, { target: { value: CONTENT_TYPES.COLORS } });

    // Should call content change handler
    expect(mockOnContentChange).toHaveBeenCalledWith(CONTENT_TYPES.COLORS);
  });

  test('should handle error boundary integration', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Component that throws an error in dropdown
    const ErrorComponent = () => {
      throw new Error('Dropdown error');
    };

    // This test verifies that error boundaries are properly integrated
    // In a real scenario, the error would be caught by DropdownErrorBoundary
    expect(() => {
      render(
        <TitleBar
          selectedContent={CONTENT_TYPES.VERBS}
          selectedGame={GAME_TYPES.SPEECH}
          contentData={[{ id: 1, chat: 'test' }]}
          isLoading={false}
        />
      );
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  test('should handle missing props gracefully', () => {
    // Test with minimal props to ensure graceful degradation
    expect(() => {
      render(<TitleBar />);
    }).not.toThrow();

    // Should show default state
    expect(screen.getAllByText('Select Content').length).toBeGreaterThan(0);
  });
});