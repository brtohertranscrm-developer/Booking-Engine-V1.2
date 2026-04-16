import React, { useState, useEffect } from 'react';

const BookingModal = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    status: 'pending',
    payment_status: 'unpaid'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        status: initialData.status,
        payment_status: initialData.payment_status
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(initialData.order_id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Update Status Booking</h2>
        <div className="mb-4 text-sm text-gray-600">
          <p><strong>Order ID:</strong> {initialData?.order_id}</p>
          <p><strong>Pelanggan:</strong> {initialData?.user_name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status Pembayaran</label>
            <select name="payment_status" value={formData.payment_status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
              <option value="unpaid">Unpaid (Belum Lunas)</option>
              <option value="paid">Paid (Lunas)</option>
              <option value="refunded">Refunded (Dikembalikan)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status Booking</label>
            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
              <option value="pending">Pending</option>
              <option value="active">Active (Sedang Sewa)</option>
              <option value="completed">Completed (Selesai)</option>
              <option value="cancelled">Cancelled (Batal)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">Simpan Update</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;