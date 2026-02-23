import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import API_URL from "../../config/api";
import "./contactUsAdmin.css";

export default function ContactUsAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  async function fetchMessages() {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const [messagesRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/contact/get-all-messages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/users/get-all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const data = Array.isArray(messagesRes.data)
        ? messagesRes.data
        : messagesRes.data?.messages || [];

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const mappedUsers = users.reduce((acc, user) => {
        if (user.email) {
          acc[user.email.toLowerCase()] = user.profilePicture || "";
        }
        return acc;
      }, {});

      setMessages(data);
      setUserMap(mappedUsers);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل الرسائل");
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  const getInitial = (name) => {
    if (!name) return "؟";
    return name.trim().charAt(0);
  };

  const resolveAvatar = (email) => {
    if (!email) return "";
    const picture = userMap[email.toLowerCase()];
    if (!picture) return "";
    return picture.startsWith("/images/") ? `${API_URL}${picture}` : picture;
  };

  async function handleDeleteMessage(id) {
    const confirmed = window.confirm("هل تريد حذف هذه الرسالة؟");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/contact/delete-message/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("تم حذف الرسالة بنجاح");
      fetchMessages();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الرسالة");
      console.error("Error deleting message:", error);
    }
  }

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const handleCloseModal = (e) => {
    if (e.target.classList.contains("image-modal")) {
      setSelectedImage(null);
    }
  };

  const isArabicText = (text) => /[\u0600-\u06FF]/.test(text || "");

  return (
    <div className="content-dashboard" dir="rtl">
      <h2 className="dashboard-title">📬 رسائل التواصل</h2>

      {loading ? (
        <p className="loading">جاري تحميل الرسائل...</p>
      ) : messages.length === 0 ? (
        <p className="no-messages">لا توجد رسائل.</p>
      ) : (
        <div className="table-container">
          <table className="messages-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>البريد</th>
                <th>الرسالة</th>
                <th>التاريخ</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, index) => (
                <tr key={msg._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="name-cell">
                      {resolveAvatar(msg.email) ? (
                        <img
                          className="name-avatar-img"
                          src={resolveAvatar(msg.email)}
                          alt={msg.name}
                          onClick={() =>
                            handleImageClick(resolveAvatar(msg.email))
                          }
                          style={{ cursor: "pointer" }}
                        />
                      ) : (
                        <span className="name-avatar">
                          {getInitial(msg.name)}
                        </span>
                      )}
                      <span className="name-text">{msg.name}</span>
                    </div>
                  </td>
                  <td>{msg.email}</td>
                  <td
                    className="message-cell"
                    dir={isArabicText(msg.message) ? "rtl" : "ltr"}
                  >
                    {msg.message}
                  </td>
                  <td>
                    {new Date(msg.createdAt).toLocaleString("ar-EG", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <button
                      className="delete-btn-admin"
                      onClick={() => handleDeleteMessage(msg._id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content">
            <img src={selectedImage} alt="Preview" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}
