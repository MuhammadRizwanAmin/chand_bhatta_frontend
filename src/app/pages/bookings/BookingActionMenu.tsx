import { MoreVertical, Eye, Edit, DollarSign, Calendar, Trash2, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';
import { PaymentModal } from './PaymentModal';
import { usePermissions } from '../../hooks/usePermissions';

export function BookingActionMenu({
  booking,
  onDelete,
  onExtend,
  onChangeRoom,
  onSuccess,
}: {
  booking: any;
  onDelete?: (id: string) => void;
  onExtend?: any;
  onChangeRoom?: (booking: any) => void;
  onSuccess?: any;
}) {
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const bookingId = booking?.dbId || booking?.id;
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const btnClass =
    'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer outline-none';

  const numericBalance = 
    booking?.balanceAmount1 !== undefined && booking?.balanceAmount1 !== null
      ? Number(booking.balanceAmount1)
      : parseFloat(String(booking?.balanceAmount || '0').replace(/[^\d.-]/g, '')) || 0;

  const shouldShowPayment = numericBalance > 0;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
            <MoreVertical size={20} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-[9999]"
            style={{ minWidth: '160px' }}
          >
            <DropdownMenu.Item
              className={btnClass}
              onSelect={() => navigate(`/booking/${bookingId}`)}
            >
              <Eye size={16} /> View
            </DropdownMenu.Item>

            {canEdit && booking?.status !== 'checked_out' && (
              <DropdownMenu.Item
                className={btnClass}
                onSelect={() => navigate(`/booking/${bookingId}/edit`)}
              >
                <Edit size={16} /> Edit
              </DropdownMenu.Item>
            )}

            {canEdit && booking?.status !== 'checked_out' && booking?.status !== 'cancelled' && (
              <DropdownMenu.Item
                className={btnClass}
                onSelect={(event) => {
                  event.preventDefault();
                  onChangeRoom?.(booking);
                }}
              >
                <ArrowRightLeft size={16} /> Change Room
              </DropdownMenu.Item>
            )}

            {shouldShowPayment && booking?.status !== 'cancelled' &&(
              <DropdownMenu.Item
                className={btnClass}
                onSelect={(event) => {
                  event.preventDefault();
                  setIsPaymentOpen(true);
                }}
              >
                <DollarSign size={16} /> Payment
              </DropdownMenu.Item>
            )}

            {booking?.status !== 'checked_out' && (
              <DropdownMenu.Item
                onSelect={() => onExtend?.(booking)}
                className={btnClass}
              >
                <Calendar size={16} /> Extend
              </DropdownMenu.Item>
            )}

            {canDelete  && onDelete && (
              <>
                <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                <DropdownMenu.Item
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer outline-none"
                  onSelect={() => onDelete(bookingId)}
                >
                  <Trash2 size={16} /> Delete
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        booking={booking}
        onSuccess={onSuccess}
      />
    </>
  );
}