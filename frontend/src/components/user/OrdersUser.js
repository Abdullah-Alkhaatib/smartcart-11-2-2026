import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ClipboardList, RefreshCw, Ban } from "lucide-react";
import API_URL from "../../config/api";
import "./ordersUser.css";

const statusLabels = {
  Pending: "قيد الانتظار",
  Confirmed: "تم التأكيد",
  Shipped: "تم الشحن",
  Delivered: "تم التسليم",
  Cancelled: "ملغية",
};

export default function OrdersUser() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState(null);

  const token = localStorage.getItem("token");

  const requestConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token],
  );

  const fetchOrders = useCallback(
    async (page = 1) => {
      if (!token) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setRefreshing(true);
        const { data } = await axios.get(
          `${API_URL}/api/orders/my-orders?page=${page}`,
          requestConfig,
        );

        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setCurrentPage(Number(data?.page || page));
        setTotalPages(Number(data?.totalPages || 1));
      } catch (error) {
        toast.error(error.response?.data?.message || "فشل تحميل الطلبات");
        setOrders([]);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [requestConfig, token],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  async function handleCancelOrder(orderId) {
    const confirmed = window.confirm("هل تريد إلغاء هذا الطلب؟");
    if (!confirmed) return;

    try {
      setCancellingId(orderId);

      await axios.put(
        `${API_URL}/api/orders/cancel/${orderId}`,
        {},
        requestConfig,
      );

      toast.success("تم إلغاء الطلب بنجاح");
      await fetchOrders(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر إلغاء الطلب");
    } finally {
      setCancellingId(null);
    }
  }

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ar-EG", {
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
      maximumFractionDigits: 2, //
    }).format(numericValue);
  };

  const resolveStatusLabel = (status) => statusLabels[status] || status || "-";

  const statusClassName = (status) => {
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

  return (
    <section className="uord-root" dir="rtl">
      <header className="uord-header">
        <div>
          <h2>
            <ClipboardList size={22} />
            طلباتي
          </h2>
          <p>عرض الطلبات الحالية والسابقة.</p>
        </div>

        <button
          type="button"
          className="uord-refresh-btn"
          onClick={() => fetchOrders(currentPage)}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "جار التحميل" : "تحديث"}
        </button>
      </header>

      {loading ? (
        <p className="uord-state">جاري تحميل الطلبات...</p>
      ) : orders.length === 0 ? (
        <p className="uord-state">لا يوجد طلبات حتى الآن.</p>
      ) : (
        <>
          <div className="uord-list">
            {orders.map((order) => (
              <article key={order._id} className="uord-card">
                <div className="uord-card-top">
                  <div>
                    <h3>طلب</h3>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>

                  <span
                    className={`uord-status ${statusClassName(order.orderStatus)}`}
                  >
                    {resolveStatusLabel(order.orderStatus)}
                  </span>
                </div>

                <div className="uord-meta">
                  <p>
                    <strong>الإجمالي:</strong> {formatPrice(order.totalPrice)}
                  </p>
                  <p>
                    <strong>الدفع:</strong> {order.paymentMethod || "COD"}
                  </p>
                  <p>
                    <strong>المدينة:</strong>{" "}
                    {order.shippingAddress?.city || "-"}
                  </p>
                </div>

                <div className="uord-items">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={`${item.product || index}-${index}`}>
                          <span>{item.name || "منتج"}</span>
                          <span>اللون: {item.color || "-"}</span>
                          <span>الكمية: {item.quantity || 0}</span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="uord-state-small">لا توجد عناصر.</p>
                  )}
                </div>

                {order.orderStatus === "Pending" ? (
                  <div className="uord-actions">
                    <button
                      type="button"
                      className="uord-cancel-btn"
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={cancellingId === order._id}
                    >
                      <Ban size={15} />
                      {cancellingId === order._id
                        ? "جار الإلغاء"
                        : "إلغاء الطلب"}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="uord-pagination">
              <button
                type="button"
                onClick={() => fetchOrders(currentPage - 1)}
                disabled={currentPage <= 1 || refreshing}
              >
                السابق
              </button>

              <span>
                صفحة {currentPage} من {totalPages}
              </span>

              <button
                type="button"
                onClick={() => fetchOrders(currentPage + 1)}
                disabled={currentPage >= totalPages || refreshing}
              >
                التالي
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
