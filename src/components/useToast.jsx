import { useState, useCallback } from 'react'

export function useToast() {
    const [toast, setToast] = useState(null)
    const show = useCallback((msg, type = 'info', duration = 3200) => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), duration)
    }, [])
    return { toast, show }
}

const PALETTE = {
    success: { border: 'rgba(52,211,153,.4)', bg: 'rgba(16,185,129,.07)', color: 'var(--green2)' },
    danger: { border: 'rgba(248,113,113,.4)', bg: 'rgba(239,68,68,.07)', color: 'var(--red2)' },
    warn: { border: 'rgba(251,191,36,.4)', bg: 'rgba(245,158,11,.07)', color: 'var(--amber2)' },
    info: { border: 'var(--rim2)', bg: 'var(--glass-card)', color: 'var(--t1)' },
}

export function Toast({ toast }) {
    if (!toast) return null
    const p = PALETTE[toast.type] || PALETTE.info
    const icons = {
        success: '✓', danger: '⚠', warn: '!', info: 'ℹ'
    }
    return (
        <div className="toast" style={{
            background: p.bg, borderColor: p.border, color: p.color
        }}>
            <span style={{ fontWeight: 700, flexShrink: 0 }}>{icons[toast.type] || 'ℹ'}</span>
            {toast.msg}
        </div>
    )
}
