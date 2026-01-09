import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileAsksTab from '@/components/profile/ProfileAsksTab';

// Wrapper component for routing context
const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('ProfileAsksTab', () => {
  it('renders loading state', () => {
    renderWithRouter(
      <ProfileAsksTab
        loading={true}
        asks={[]}
        onPostAsk={vi.fn()}
        onViewRequests={vi.fn()}
      />
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no asks', () => {
    const onPostAsk = vi.fn();

    renderWithRouter(
      <ProfileAsksTab
        loading={false}
        asks={[]}
        onPostAsk={onPostAsk}
        onViewRequests={vi.fn()}
      />
    );

    expect(screen.getByText('No asks yet')).toBeInTheDocument();
    expect(screen.getByText('Post Your First Ask')).toBeInTheDocument();
  });

  it('calls onPostAsk when post button is clicked', () => {
    const onPostAsk = vi.fn();

    renderWithRouter(
      <ProfileAsksTab
        loading={false}
        asks={[]}
        onPostAsk={onPostAsk}
        onViewRequests={vi.fn()}
      />
    );

    const postButton = screen.getByText('Post Your First Ask');
    fireEvent.click(postButton);

    expect(onPostAsk).toHaveBeenCalled();
  });

  it('renders asks list', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mockAsks = [
      {
        id: '1',
        is_active: true,
        expires_at: futureDate.toISOString(),
        description: 'Looking for Series A investors',
        category: 'fundraising',
        sector: 'FinTech',
        amount: '$2M',
        stage: 'Series A',
        connection_requests: [{ count: 3 }],
      },
    ];

    renderWithRouter(
      <ProfileAsksTab
        loading={false}
        asks={mockAsks}
        onPostAsk={vi.fn()}
        onViewRequests={vi.fn()}
      />
    );

    expect(screen.getByText('My Asks')).toBeInTheDocument();
    expect(screen.getByText('Looking for Series A investors')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('FinTech')).toBeInTheDocument();
  });

  it('shows expired status for expired asks', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const mockAsks = [
      {
        id: '1',
        is_active: false,
        expires_at: pastDate.toISOString(),
        description: 'Old ask',
        category: 'general_advice',
        sector: 'Tech',
        connection_requests: [],
      },
    ];

    renderWithRouter(
      <ProfileAsksTab
        loading={false}
        asks={mockAsks}
        onPostAsk={vi.fn()}
        onViewRequests={vi.fn()}
      />
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows View Requests button when helpers count > 0', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const onViewRequests = vi.fn();

    const mockAsks = [
      {
        id: '1',
        is_active: true,
        expires_at: futureDate.toISOString(),
        description: 'Need help',
        category: 'cofounder',
        sector: 'AI',
        connection_requests: [{ count: 5 }],
      },
    ];

    renderWithRouter(
      <ProfileAsksTab
        loading={false}
        asks={mockAsks}
        onPostAsk={vi.fn()}
        onViewRequests={onViewRequests}
      />
    );

    expect(screen.getByText('5 people offered to help')).toBeInTheDocument();

    const viewRequestsButton = screen.getByText('View Requests');
    fireEvent.click(viewRequestsButton);

    expect(onViewRequests).toHaveBeenCalled();
  });
});
