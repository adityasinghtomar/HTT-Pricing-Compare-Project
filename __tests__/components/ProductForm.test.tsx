import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProductForm from '@/components/ProductForm'

describe('ProductForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders all form fields', () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/part number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/brand/i), { target: { value: '3M' } })
    fireEvent.change(screen.getByLabelText(/part number/i), { target: { value: '2091' } })
    fireEvent.change(screen.getByLabelText(/size/i), { target: { value: 'Medium' } })
    
    fireEvent.click(screen.getByRole('button', { name: /add product/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        brand: '3M',
        partNumber: '2091',
        size: 'Medium'
      })
    })
  })

  it('shows alert for missing required fields', async () => {
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    fireEvent.click(screen.getByRole('button', { name: /add product/i }))
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Please fill in both Brand and Part Number')
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
    
    alertSpy.mockRestore()
  })

  it('trims whitespace from inputs', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/brand/i), { target: { value: '  3M  ' } })
    fireEvent.change(screen.getByLabelText(/part number/i), { target: { value: '  2091  ' } })
    fireEvent.change(screen.getByLabelText(/size/i), { target: { value: '  Medium  ' } })
    
    fireEvent.click(screen.getByRole('button', { name: /add product/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        brand: '3M',
        partNumber: '2091',
        size: 'Medium'
      })
    })
  })

  it('resets form after successful submission', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    const brandInput = screen.getByLabelText(/brand/i) as HTMLInputElement
    const partNumberInput = screen.getByLabelText(/part number/i) as HTMLInputElement
    const sizeInput = screen.getByLabelText(/size/i) as HTMLInputElement
    
    fireEvent.change(brandInput, { target: { value: '3M' } })
    fireEvent.change(partNumberInput, { target: { value: '2091' } })
    fireEvent.change(sizeInput, { target: { value: 'Medium' } })
    
    fireEvent.click(screen.getByRole('button', { name: /add product/i }))
    
    await waitFor(() => {
      expect(brandInput.value).toBe('')
      expect(partNumberInput.value).toBe('')
      expect(sizeInput.value).toBe('')
    })
  })
})
