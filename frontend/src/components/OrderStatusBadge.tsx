type OrderStatus = 'confirmed' | 'processing' | 'in-transit' | 'delivered' | 'failed';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'processing':
        return {
          label: 'Processing',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'in-transit':
        return {
          label: 'In Transit',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          className: 'bg-green-100 text-green-800',
        };
      case 'failed':
        return {
          label: 'Failed',
          className: 'bg-red-100 text-red-800',
        };
      case 'confirmed':
      default:
        return {
          label: 'Confirmed',
          className: 'bg-green-100 text-green-800',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
