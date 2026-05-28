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
  const iconBg  = variant === 'danger' ? 'bg-red-50'    : 'bg-amber-50'
  const iconCol = variant === 'danger' ? 'text-red-500'  : 'text-amber-500'
  const btnBg   = variant === 'danger' ? '#dc2626'       : '#d97706'
  const btnHover= variant === 'danger' ? '#b91c1c'       : '#b45309'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <DialogHeader>
          <div className="flex items-start gap-4 mb-2">
            <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
              <AlertTriangle size={20} className={iconCol} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-gray-900 leading-snug">{title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1 leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}
            className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 text-white"
            style={{ backgroundColor: btnBg }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = btnHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = btnBg)}
          >
            {loading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
