// Basic setup test to verify Jest and React Testing Library configuration
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple test component
const TestComponent = () => {
  return (
    <div>
      <h1>Hello LUMO Testing</h1>
      <p>Jest and React Testing Library are working correctly!</p>
    </div>
  )
}

describe('Testing Setup', () => {
  test('renders test component correctly', () => {
    render(<TestComponent />)
    
    // Test that elements are rendered
    expect(screen.getByText('Hello LUMO Testing')).toBeInTheDocument()
    expect(screen.getByText('Jest and React Testing Library are working correctly!')).toBeInTheDocument()
  })

  test('jest matchers are working', () => {
    // Test basic Jest functionality
    expect(true).toBe(true)
    expect('test').toMatch(/test/)
    expect([1, 2, 3]).toContain(2)
  })

  test('dom queries are working', () => {
    render(<TestComponent />)
    
    // Test various query methods
    expect(screen.getByRole('heading', { name: /hello lumo testing/i })).toBeInTheDocument()
    expect(screen.queryByText('Non-existent text')).not.toBeInTheDocument()
  })
}) 