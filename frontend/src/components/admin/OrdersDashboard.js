import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ClipboardList, RefreshCw, PackageCheck } from "lucide-react";
import API_URL from "../../config/api";
import "./ordersDashboard.css";

const statusOptions = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const token = localStorage.getItem("token");

  const requestConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setOrders([]);
      return;
    }

    try {
      setRefreshing(true);
      const { data } = await axios.get(
        `${API_URL}/api/orders/getAllOrders`,
        requestConfig,
      );

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "فشل تحميل الطلبات");
      setOrders([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [requestConfig, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleStatusUpdate(orderId, status) {
    try {
      setUpdatingOrderId(orderId);

      await axios.put(
        `${API_URL}/api/orders/update-status/${orderId}`,
        { status },
        requestConfig,
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, orderStatus: status } : order,
        ),
      );

      toast.success("تم تحديث حالة الطلب");
    } catch (error) {
      toast.error(error.response?.data?.message || "فشل تحديث الحالة");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const getStatusClassName = (status) => {
    switch (status) {
      case "Delivered":
        return "is-delivered";
      case "Cancelled":
        return "is-cancelled";
      case "Shipped":
        return "is-shipped";
      case "Confirmed":
        return "is-confirmed";
      default:
        return "is-pending";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-KW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (value) => {
    const numericValue = Number(value || 0);
    return new Intl.NumberFormat("ar-KW", {
      style: "currency",
      currency: "KWD",
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  return (
    <section className="odb-root" dir="rtl">
      <header className="odb-header">
        <div>
          <h2>
            <ClipboardList size={22} />
            إدارة الطلبات
          </h2>
          <p>عرض جميع الطلبات وتحديث حالة كل طلب.</p>
        </div>

        <button
          type="button"
          className="odb-refresh-btn"
          onClick={fetchOrders}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحميل" : "تحديث"}
        </button>
      </header>

      {loading ? (
        <p className="odb-state">جاري تحميل الطلبات...</p>
      ) : orders.length === 0 ? (
        <p className="odb-state">لا توجد طلبات حالياً.</p>
      ) : (
        <div className="odb-list">
          {orders.map((order) => (
            <article key={order._id} className="odb-card">
              <div className="odb-card-top">
                <div>
                  <h3>
                    <PackageCheck size={18} />
                    طلب
                  </h3>
                  <p>{formatDate(order.createdAt)}</p>
                </div>

                <span
                  className={`odb-status ${getStatusClassName(order.orderStatus)}`}
                >
                  {order.orderStatus || "Pending"}
                </span>
              </div>

              <div className="odb-meta">
                <p>
                  <strong>العميل:</strong>{" "}
                  {order.user?.username || order.user?.email || "-"}
                </p>
                <p>
                  <strong>المدينة:</strong> {order.shippingAddress?.city || "-"}
                </p>
                <p>
                  <strong>طريقة الدفع:</strong> {order.paymentMethod || "COD"}
                </p>
                <p>
                  <strong>الإجمالي:</strong> {formatPrice(order.totalPrice)}
                </p>
              </div>

              <div className="odb-items">
                <h4>العناصر</h4>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={`${item.product || index}-${index}`}>
                        <span>{item.name || "منتج"}</span>
                        <span>اللون: {item.color}</span>
                        <span>الكمية: {item.quantity}</span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="odb-state-small">لا توجد عناصر.</p>
                )}
              </div>

              <div className="odb-actions">
                <label htmlFor={`status-${order._id}`}>تحديث الحالة</label>
                <select
                  id={`status-${order._id}`}
                  value={order.orderStatus || "Pending"}
                  disabled={updatingOrderId === order._id}
                  onChange={(event) =>
                    handleStatusUpdate(order._id, event.target.value)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
