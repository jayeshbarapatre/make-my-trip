// Reusable loading skeleton components for better UX
import React from 'react'

export function FlightCardSkeleton() {
  return (
    <div className="skeleton-card" style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '12px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        height: '20px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        marginBottom: '12px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }} />
      <div style={{
        height: '16px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        marginBottom: '8px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        width: '70%'
      }} />
      <div style={{
        height: '16px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        width: '50%'
      }} />
    </div>
  )
}

export function HotelCardSkeleton() {
  return (
    <div className="skeleton-hotel" style={{
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        height: '180px',
        backgroundColor: '#e5e7eb',
        marginBottom: '12px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }} />
      <div style={{ padding: '12px' }}>
        <div style={{
          height: '18px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '8px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }} />
        <div style={{
          height: '14px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          width: '60%',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }} />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr style={{ backgroundColor: '#f9fafb' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{
            height: '16px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
        </td>
      ))}
    </tr>
  )
}

export default function LoadingSkeleton() {
  return <FlightCardSkeleton />
}
