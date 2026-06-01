import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  variant = 'danger', onConfirm, loading = false,
}: ConfirmDialogProps) {

  // Quản lý class màu sắc động theo variant bằng Tailwind class thay vì dùng inline style màu hex
  const iconBg = variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
  const confirmBtnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500'
    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Loại bỏ font-family inline, nên cấu hình font chung ở file tailwind.config.js hoặc layout */}
      <DialogContent className="max-w-md rounded p-6 shadow-xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-4">
            {/* Icon Wrapper */}
            <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center shrink-0 shadow-sm transition-colors`}>
              <AlertTriangle size={22} strokeWidth={2.2} />
            </div>

            {/* Content text */}
            <div className="flex-1 space-y-1.5 pt-0.5">
              <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 leading-relaxed font-normal">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Nút bấm khoảng cách rộng rãi, căn đều 2 bên mượt mà */}
        <DialogFooter className="mt-6 flex flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-none sm:px-5 py-2 font-medium border-gray-200 hover:bg-[#f8f5ee] text-gray-700 rounded-lg transition-colors"
          >
            {cancelLabel}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 sm:flex-none sm:px-5 py-2 font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${confirmBtnClass}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}