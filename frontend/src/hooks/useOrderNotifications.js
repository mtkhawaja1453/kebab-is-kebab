import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOrderNotifications(token, onNewOrders, active = true, audioRef = null) {
  const internalAudioRef = useRef(null)
  const effectiveAudio   = audioRef || internalAudioRef
  const playingRef       = useRef(false)
  const knownOrderIds    = useRef(new Set())

  useEffect(() => {
    if (!audioRef) {
      internalAudioRef.current = new Audio('/notification.wav')
      internalAudioRef.current.loop = true
    }
    return () => {
      if (!audioRef) internalAudioRef.current?.pause()
    }
  }, [audioRef])

  const startSound = useCallback(() => {
    if (playingRef.current) return
    playingRef.current = true
    effectiveAudio.current?.play().catch(() => {
      console.warn('Audio autoplay blocked')
    })
  }, [effectiveAudio])

  const stopSound = useCallback(() => {
    playingRef.current = false
    effectiveAudio.current?.pause()
    if (effectiveAudio.current) effectiveAudio.current.currentTime = 0
  }, [effectiveAudio])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const showBrowserNotification = useCallback((order) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌯 New Order!', {
        body: `${order.order_number} — $${Number(order.total).toFixed(2)} — ${order.pickup_fmt || ''}`,
        icon: '/favicon.ico',
        tag:  order.id,
      })
    }
  }, [])

  const fetchUnacknowledged = useCallback(async () => {
    try {
      const API       = import.meta.env.VITE_API_URL || '/api'
      const ADMIN_API = API.replace('/api', '/api/admin')
      const res = await fetch(`${ADMIN_API}/orders?status=confirmed&limit=50`, {
        headers: { 'X-Admin-Token': token }
      })
      if (!res.ok) return []
      const data = await res.json()
      return (data.orders || []).filter(o => !o.acknowledged)
    } catch (e) {
      console.error('Failed to fetch orders:', e)
      return []
    }
  }, [token])

  useEffect(() => {
    if (!active || !token) return

    // Initial fetch on mount
    fetchUnacknowledged().then(unack => {
      if (unack.length > 0) {
        unack.forEach(o => knownOrderIds.current.add(o.id))
        onNewOrders(unack)
        startSound()
      }
    })

    // Subscribe to realtime inserts on orders table
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('🆕 New order received:', payload.new.order_number)
          const newOrder = payload.new
          if (knownOrderIds.current.has(newOrder.id)) return
          knownOrderIds.current.add(newOrder.id)
          showBrowserNotification(newOrder)
          startSound()
          // Always notify so AdminOrders reloads
          const unack = await fetchUnacknowledged()
          onNewOrders(unack.length > 0 ? unack : [newOrder])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async () => {
          // Order was updated (e.g. acknowledged) — refresh unack list
          const unack = await fetchUnacknowledged()
          onNewOrders(unack)
          if (unack.length === 0) stopSound()
        }
      )
      .subscribe()

    const fallbackInterval = setInterval(async () => {
      const unack = await fetchUnacknowledged()
      onNewOrders(unack)
      if (unack.length > 0) startSound()
    }, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(fallbackInterval)
      stopSound()
    }
  }, [active, token, fetchUnacknowledged, onNewOrders, startSound, stopSound, showBrowserNotification])

  return { stopSound }
}