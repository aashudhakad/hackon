'use client';

import { useEffect, useState } from 'react';

interface DeliveryTimerProps {
  orderCreatedAt: string;
  deliveryMinutes?: number;
  onDelivered?: () => void;
}

export function DeliveryTimer({ orderCreatedAt, deliveryMinutes = 5, onDelivered }: DeliveryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [status, setStatus] = useState<'processing' | 'in-transit' | 'delivered'>('processing');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const deliveryTimeMs = deliveryMinutes * 60 * 1000;
    const orderTime = new Date(orderCreatedAt).getTime();
    const deliveryTime = orderTime + deliveryTimeMs;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = deliveryTime - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus('delivered');
        if (onDelivered) onDelivered();
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        return;
      }

      setTimeLeft(remaining);

      // Update status based on time
      const elapsed = now - orderTime;
      const elapsedMinutes = elapsed / 60000;
      
      if (elapsedMinutes < 1) {
        setStatus('processing');
      } else if (elapsedMinutes < deliveryMinutes) {
        setStatus('in-transit');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [orderCreatedAt, deliveryMinutes, onDelivered]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress = ((deliveryMinutes * 60 * 1000 - timeLeft) / (deliveryMinutes * 60 * 1000)) * 100;

  const statusConfig = {
    processing: {
      label: 'Processing Order',
      color: 'blue',
      icon: '📦',
      description: 'Preparing your items...',
    },
    'in-transit': {
      label: 'Out for Delivery',
      color: 'yellow',
      icon: '🚚',
      description: 'On the way to you!',
    },
    delivered: {
      label: 'Delivered',
      color: 'green',
      icon: '✅',
      description: 'Enjoy your order!',
    },
  };

  const currentStatus = statusConfig[status];

  if (status === 'delivered') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 text-center">
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce">
            🎉
          </div>
        )}
        <div className="text-5xl mb-3">{currentStatus.icon}</div>
        <h3 className="text-2xl font-bold text-green-800 mb-1">{currentStatus.label}</h3>
        <p className="text-green-700 font-medium">{currentStatus.description}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${
      status === 'processing' 
        ? 'from-blue-50 to-indigo-50 border-2 border-blue-200' 
        : 'from-amber-50 to-orange-50 border-2 border-amber-200'
    } p-6`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-pulse">{currentStatus.icon}</div>
          <div>
            <h3 className={`text-lg font-bold ${
              status === 'processing' ? 'text-blue-800' : 'text-amber-800'
            }`}>
              {currentStatus.label}
            </h3>
            <p className={`text-sm ${
              status === 'processing' ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              status === 'processing' ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {String(minutes).padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-600 font-medium">MIN</div>
          </div>
          <div className={`text-3xl font-bold ${
            status === 'processing' ? 'text-blue-700' : 'text-amber-700'
          }`}>
            :
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              status === 'processing' ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-600 font-medium">SEC</div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 font-medium">
          until delivery
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-white rounded-full overflow-hidden shadow-inner">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-linear ${
            status === 'processing' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-pulse" />
        </div>
      </div>

      {/* Progress Stages */}
      <div className="mt-4 flex justify-between items-center text-xs">
        <div className={`flex items-center gap-1 ${
          progress >= 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'
        }`}>
          <span className={progress >= 0 ? 'scale-125' : ''}>📦</span>
          <span>Order Placed</span>
        </div>
        <div className={`flex items-center gap-1 ${
          progress >= 20 ? 'text-amber-600 font-semibold' : 'text-gray-400'
        }`}>
          <span className={progress >= 20 ? 'scale-125' : ''}>🚚</span>
          <span>In Transit</span>
        </div>
        <div className={`flex items-center gap-1 ${
          progress >= 100 ? 'text-green-600 font-semibold' : 'text-gray-400'
        }`}>
          <span className={progress >= 100 ? 'scale-125' : ''}>✅</span>
          <span>Delivered</span>
        </div>
      </div>
    </div>
  );
}
