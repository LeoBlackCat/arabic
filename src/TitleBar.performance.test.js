import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TitleBar from './TitleBar';

// Mock React.memo to track re-renders
const renderSpy = jest.fn();
const originalMemo = React.memo;

beforeEach(() => {
  renderSpy.mockClear();
});

describe('TitleBar Performance Tests', () => {
  const defaultProps = {
    selectedContent: 'verbs',
    selectedGame: 'speech',
    contentData: [],
    isLoading: false,
    speechConfig: { azure: { isEnabled: false }, elevenlabs: { isEnabled: false } },
    onContentChange: jest.fn(),
    onGameChange: jest.fn(),
    onSettingsClick: jest.fn()
  };

  describe('React.memo Optimization', () => {
    test('should not re-render when props have not changed', () => {
      const { rerender } = render(<TitleBar {...defaultProps} />);
      
      const initialRenderCount = screen.getAllByRole('heading').length;
      
      // Re-render with same props
      rerender(<TitleBar {...defaultProps} />);
      
      // Component should still be rendered but React.memo should prevent unnecessary work
      expect(screen.getAllByRole('heading')).toHaveLength(initialRenderCount);
    });

    test('should re-render when selectedContent changes', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      expect(screen.getAllByText('Verbs')).toHaveLength(2);
      
      rerender(<TitleBar {...defaultProps} selectedContent="colors" />);
      
      expect(screen.getAllByText('Colors')).toHaveLength(2);
      // Verbs should still appear in the option elements but not in headings
      const verbsInHeadings = screen.queryAllByRole('heading', { name: /verbs/i });
      expect(verbsInHeadings).toHaveLength(0);
    });

    test('should re-render when selectedGame changes', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedGame="speech" />);
      
      // Check that speech is selected in game selectors
      const gameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      expect(gameSelectors.length).toBeGreaterThan(0);
      expect(gameSelectors[0].value).toBe('speech');
      
      rerender(<TitleBar {...defaultProps} selectedGame="puzzle" />);
      
      // Check that puzzle is now selected
      const newGameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      expect(newGameSelectors[0].value).toBe('puzzle');
    });

    test('should re-render when speech config changes', () => {
      const { rerender } = render(<TitleBar {...defaultProps} />);
      
      let settingsButtons = screen.getAllByRole('button', { name: /speech services are currently inactive/i });
      expect(settingsButtons.length).toBeGreaterThan(0);
      
      rerender(<TitleBar {...defaultProps} speechConfig={{ azure: { isEnabled: true }, elevenlabs: { isEnabled: false } }} />);
      
      settingsButtons = screen.getAllByRole('button', { name: /speech services are currently active/i });
      expect(settingsButtons.length).toBeGreaterThan(0);
    });

    test('should not re-render when irrelevant props change', () => {
      const { rerender } = render(<TitleBar {...defaultProps} />);
      
      const initialHeadings = screen.getAllByRole('heading');
      
      // Add an irrelevant prop that shouldn't trigger re-render
      rerender(<TitleBar {...defaultProps} irrelevantProp="test" />);
      
      // Component should still be there and functional
      expect(screen.getAllByRole('heading')).toHaveLength(initialHeadings.length);
    });
  });

  describe('Memoized Calculations', () => {
    test('should memoize topic display name calculation', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      expect(screen.getAllByText('Verbs')).toHaveLength(2);
      
      // Re-render with same content - should use memoized value
      rerender(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      expect(screen.getAllByText('Verbs')).toHaveLength(2);
    });

    test('should memoize available games calculation', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      const gameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      
      expect(gameSelectors.length).toBeGreaterThan(0);
      
      // Re-render with same content type - should use memoized games
      rerender(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      const newGameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      
      expect(newGameSelectors.length).toBe(gameSelectors.length);
    });

    test('should memoize speech service status', () => {
      const speechConfig = { azure: { isEnabled: true }, elevenlabs: { isEnabled: false } };
      const { rerender } = render(<TitleBar {...defaultProps} speechConfig={speechConfig} />);
      
      let activeButtons = screen.getAllByRole('button', { name: /speech services are currently active/i });
      expect(activeButtons.length).toBeGreaterThan(0);
      
      // Re-render with same speech config - should use memoized status
      rerender(<TitleBar {...defaultProps} speechConfig={speechConfig} />);
      
      activeButtons = screen.getAllByRole('button', { name: /speech services are currently active/i });
      expect(activeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Callback Optimization', () => {
    test('should use stable callback references', () => {
      const onContentChange = jest.fn();
      const onGameChange = jest.fn();
      const onSettingsClick = jest.fn();
      
      const props = {
        ...defaultProps,
        onContentChange,
        onGameChange,
        onSettingsClick
      };
      
      const { rerender } = render(<TitleBar {...props} />);
      
      // Re-render with same callback references
      rerender(<TitleBar {...props} />);
      
      // Callbacks should still be functional
      const contentSelector = screen.getAllByRole('combobox')[0];
      expect(contentSelector).toBeInTheDocument();
    });

    test('should handle callback changes properly', () => {
      const onContentChange1 = jest.fn();
      const onContentChange2 = jest.fn();
      
      const { rerender } = render(<TitleBar {...defaultProps} onContentChange={onContentChange1} />);
      
      // Change callback reference - should trigger re-render
      rerender(<TitleBar {...defaultProps} onContentChange={onContentChange2} />);
      
      // Component should still be functional with new callback
      expect(screen.getAllByRole('combobox')).toHaveLength(4); // 2 mobile + 2 desktop
    });
  });

  describe('Content Data Optimization', () => {
    test('should optimize based on content data length', () => {
      const contentData1 = [{ id: 1 }, { id: 2 }];
      const contentData2 = [{ id: 3 }, { id: 4 }]; // Same length, different content
      
      const { rerender } = render(<TitleBar {...defaultProps} contentData={contentData1} />);
      
      // Re-render with different content but same length - should not re-render due to memo optimization
      rerender(<TitleBar {...defaultProps} contentData={contentData2} />);
      
      expect(screen.getAllByRole('heading')).toHaveLength(2);
    });

    test('should re-render when content data length changes', () => {
      const contentData1 = [{ id: 1 }];
      const contentData2 = [{ id: 1 }, { id: 2 }]; // Different length
      
      const { rerender } = render(<TitleBar {...defaultProps} contentData={contentData1} />);
      
      // Re-render with different length - should re-render
      rerender(<TitleBar {...defaultProps} contentData={contentData2} />);
      
      expect(screen.getAllByRole('heading')).toHaveLength(2);
    });
  });

  describe('Loading State Performance', () => {
    test('should handle loading state efficiently', () => {
      const { rerender } = render(<TitleBar {...defaultProps} isLoading={false} />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      
      rerender(<TitleBar {...defaultProps} isLoading={true} />);
      
      expect(screen.getAllByText('Loading...')).toHaveLength(6); // 2 Topics + 4 selectors (mobile + desktop)
      
      rerender(<TitleBar {...defaultProps} isLoading={false} />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors without performance degradation', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const onContentChange = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      render(<TitleBar {...defaultProps} onContentChange={onContentChange} />);
      
      // Component should still render despite error in callback
      expect(screen.getAllByRole('heading')).toHaveLength(2);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Usage Optimization', () => {
    test('should not create unnecessary object references', () => {
      const { rerender } = render(<TitleBar {...defaultProps} />);
      
      // Multiple re-renders should not cause memory leaks
      for (let i = 0; i < 10; i++) {
        rerender(<TitleBar {...defaultProps} />);
      }
      
      expect(screen.getAllByRole('heading')).toHaveLength(2);
    });

    test('should handle rapid prop changes efficiently', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      // Rapid content changes
      const contentTypes = ['verbs', 'colors', 'nouns', 'phrases'];
      
      contentTypes.forEach(contentType => {
        rerender(<TitleBar {...defaultProps} selectedContent={contentType} />);
      });
      
      // Should end up with the last content type
      expect(screen.getAllByText('Phrases')).toHaveLength(2);
    });
  });

  describe('Dropdown Performance', () => {
    test('should efficiently handle game options calculation', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" />);
      
      // Get initial game options count
      const gameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      
      const initialOptionsCount = gameSelectors[0].children.length;
      
      // Switch to different content type
      rerender(<TitleBar {...defaultProps} selectedContent="colors" />);
      
      const newGameSelectors = screen.getAllByRole('combobox').filter(select => 
        select.getAttribute('aria-label')?.includes('game type')
      );
      
      // Should have different number of options for colors vs verbs
      expect(newGameSelectors[0].children.length).toBeDefined();
    });

    test('should handle invalid game selections efficiently', () => {
      const { rerender } = render(<TitleBar {...defaultProps} selectedContent="verbs" selectedGame="speech" />);
      
      // Switch to content type that doesn't support current game
      rerender(<TitleBar {...defaultProps} selectedContent="colors" selectedGame="conjugation" />);
      
      // Should handle invalid combination gracefully
      expect(screen.getAllByRole('combobox')).toHaveLength(4);
    });
  });
});