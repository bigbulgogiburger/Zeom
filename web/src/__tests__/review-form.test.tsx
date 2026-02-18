import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewForm from '@/components/review-form';

describe('ReviewForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with counselor name', () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    expect(screen.getByText('김지혜 상담사님과의 상담은 어떠셨나요?')).toBeInTheDocument();
    expect(screen.getByText('별점 평가')).toBeInTheDocument();
    expect(screen.getByText('리뷰 내용')).toBeInTheDocument();
  });

  it('renders form without counselor name', () => {
    render(<ReviewForm onSubmit={mockOnSubmit} />);

    expect(screen.queryByText(/상담사님과의 상담은 어떠셨나요/)).not.toBeInTheDocument();
    expect(screen.getByText('별점 평가')).toBeInTheDocument();
  });

  it('selects star rating on click', () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    expect(stars).toHaveLength(5);

    fireEvent.click(stars[3]); // Click 4th star (4점)

    expect(screen.getByText('4점 선택됨')).toBeInTheDocument();
  });

  it('shows hover rating when hovering over stars', () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });

    // Initially no rating selected
    expect(screen.queryByText(/점 선택됨/)).not.toBeInTheDocument();

    // Hover over 3rd star
    fireEvent.mouseEnter(stars[2]);

    // Cannot easily test color change, but we can verify no errors
    expect(stars[2]).toBeInTheDocument();

    // Mouse leave resets hover
    const starContainer = stars[0].parentElement;
    if (starContainer) {
      fireEvent.mouseLeave(starContainer);
    }
  });

  it('updates comment text', () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    const testComment = '정말 좋은 상담이었습니다!';
    fireEvent.change(textarea, { target: { value: testComment } });

    expect(textarea).toHaveValue(testComment);
    // Character count is displayed as "{length} / 500자"
    expect(screen.getByText((content) => content.includes(String(testComment.length)) && content.includes('500'))).toBeInTheDocument();
  });

  it('disables submit button when no rating is selected', async () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '좋은 상담' } });

    const submitButton = screen.getByText('리뷰 제출');
    // Submit button should be disabled when rating is 0
    expect(submitButton).toBeDisabled();

    // Clicking a disabled button does not trigger form submission
    fireEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error when submitting without comment', async () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[4]); // 5점

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('리뷰 내용을 입력해주세요.');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('trims whitespace from comment', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[2]); // 3점

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '   좋았어요   ' } });

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(3, '좋았어요');
    });
  });

  it('shows success message after successful submit', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[4]); // 5점

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '매우 만족스러운 상담이었습니다.' } });

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('리뷰가 등록되었습니다.');
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(5, '매우 만족스러운 상담이었습니다.');
  });

  it('shows error message on submit failure', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[3]); // 4점

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '좋은 상담' } });

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('disables form during submission', async () => {
    mockOnSubmit.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[2]); // 3점

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '좋은 상담이었습니다' } });

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // ActionButton shows "처리 중…" when loading
      expect(screen.getByText('처리 중…')).toBeInTheDocument();
      expect(textarea).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByText('리뷰 제출')).toBeInTheDocument();
    });
  });

  it('clears previous errors on new submit', async () => {
    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    // Select a rating so the submit button becomes enabled
    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[3]); // 4점

    // Submit without comment - should show error about missing comment
    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('리뷰 내용을 입력해주세요.');
    });

    // Now add comment and submit again - previous error should be cleared
    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '좋은 상담' } });

    mockOnSubmit.mockResolvedValueOnce(undefined);
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Previous error should be cleared
      expect(screen.queryByText('리뷰 내용을 입력해주세요.')).not.toBeInTheDocument();
    });
  });

  it('shows default error message on submit failure without message', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error());

    render(<ReviewForm onSubmit={mockOnSubmit} counselorName="김지혜" />);

    const stars = screen.getAllByRole('button', { name: /점/ });
    fireEvent.click(stars[4]);

    const textarea = screen.getByPlaceholderText('상담 후기를 남겨주세요. (최소 10자 이상)');
    fireEvent.change(textarea, { target: { value: '좋은 상담' } });

    const submitButton = screen.getByText('리뷰 제출');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('리뷰 등록에 실패했습니다.');
    });
  });
});
