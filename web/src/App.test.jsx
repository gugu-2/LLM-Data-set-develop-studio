import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Routing & Layout', () => {
  it('renders the sidebar navigation', () => {
    window.history.pushState({}, 'Home', '/');
    render(<App />);
    
    // Check for logo
    expect(screen.getAllByText(/Hypasia AI/i).length).toBeGreaterThan(0);
    
    // Check for main nav items
    expect(screen.getAllByText(/Data Miner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fine-Tune Studio/i).length).toBeGreaterThan(0);
  });


  it('renders the Dashboard on the root route', () => {
    window.history.pushState({}, 'Home', '/');
    render(<App />);
    expect(screen.getByText(/The end-to-end platform/i)).toBeDefined();
  });


  it('renders Data Miner on the /mine route', () => {
    window.history.pushState({}, 'Mine', '/mine');
    render(<App />);
    expect(screen.getByText(/Turn any website, PDF/i)).toBeDefined();
  });
});

