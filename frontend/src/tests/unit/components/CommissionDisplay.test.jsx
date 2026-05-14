import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CommissionDisplay } from '@/design-system/components/composite/CommissionDisplay'

describe('CommissionDisplay', () => {
  it('se renderiza sin errores', () => {
    const { getByText } = render(<CommissionDisplay commission={500} />)
    expect(getByText('Comisión Ganada')).toBeInTheDocument()
  })

  it('muestra desglose si se pasa breakdown', () => {
    const breakdown = { '1g': 100, '14g': 200 }
    const { getByText } = render(
      <CommissionDisplay commission={300} breakdown={breakdown} />
    )
    expect(getByText('Desglose:')).toBeInTheDocument()
    expect(getByText('1g:')).toBeInTheDocument()
  })

  it('no muestra desglose si breakdown esta vacio', () => {
    const { queryByText } = render(<CommissionDisplay commission={100} breakdown={{}} />)
    expect(queryByText('Desglose:')).not.toBeInTheDocument()
  })
})
