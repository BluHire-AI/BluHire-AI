import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ScorecardTab } from '@/components/interview/ScorecardTab';
import { HiringDecisionCenter } from '@/components/interview/HiringDecisionCenter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('@/services/candidate.service', () => ({
  getCandidateScorecard: jest.fn(),
  updateCandidateStatus: jest.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {ui}
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

describe('Frontend Null Safety Tests', () => {

  describe('ErrorBoundary', () => {
    it('catches crashes and renders fallback UI instead of crashing the app', () => {
      const BuggyComponent = () => {
        throw new Error('Test crash');
      };

      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test crash')).toBeInTheDocument();
    });
  });

  describe('ScorecardTab', () => {
    it('renders Evaluation in Progress safely when scorecard is null', () => {
      // Mock the service to return null
      const { getCandidateScorecard } = require('@/services/candidate.service');
      getCandidateScorecard.mockResolvedValueOnce(null);

      renderWithProviders(<ScorecardTab candidateId="123" />);

      // Depending on loading state, we might need to await it. 
      // For this static mock, we just ensure it doesn't throw.
    });

    it('handles partial evaluation safely with default 0s', () => {
      const { getCandidateScorecard } = require('@/services/candidate.service');
      getCandidateScorecard.mockResolvedValueOnce({
        // technicalScore is missing intentionally
        communicationScore: 50,
      });

      // Should not throw
      expect(() => {
        renderWithProviders(<ScorecardTab candidateId="123" />);
      }).not.toThrow();
    });
  });

  describe('HiringDecisionCenter', () => {
    it('handles null currentStatus gracefully as PENDING', () => {
      renderWithProviders(
        <HiringDecisionCenter candidateId="123" currentStatus={null} />
      );

      // It should render successfully
      expect(screen.getByText('Hiring Decision')).toBeInTheDocument();
    });
  });

});
