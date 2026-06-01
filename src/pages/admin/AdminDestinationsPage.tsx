import DestinationManagement from '../../components/destination/DestinationManagement'

export default function AdminDestinationsPage() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" className="text-primary">Quản lý địa điểm</h1>
        <p className="text-sm text-gray-400 mt-0.5">Thêm, sửa, ẩn/hiện các địa điểm du lịch</p>
      </div>
      <DestinationManagement />
    </div>
  )
}
