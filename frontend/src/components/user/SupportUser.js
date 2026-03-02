import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageCircle, Send, Headset, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config/api";
import { getSocket } from "../../utils/socket";
import "./supportUser.css";

export default function SupportUser() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");

  const navigate = useNavigate();
  const messagesContainerRef = useRef(null);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const petals = useMemo(
    () =>
      Array.from({ length: 15 }, () => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
      })),
    [],
  );

  const flyingLetters = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${8 + Math.random() * 4}s`,
      })),
    [],
  );

  const appendMessageUnique = useCallback((incomingMessage) => {
    if (!incomingMessage?._id) return;
    setMessages((prev) => {
      if (prev.some((msg) => msg._id === incomingMessage._id)) return prev;
      return [...prev, incomingMessage];
    });
  }, []);

  const chatItems = useMemo(() => {
    const items = [];
    let previousDateKey = "";

    messages.forEach((msg, index) => {
      const createdAt = msg?.createdAt ? new Date(msg.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        items.push({
          type: "message",
          data: msg,
          key: msg?._id || `msg-${index}`,
        });
        return;
      }

      const dateKey = `${createdAt.getFullYear()}-${createdAt.getMonth()}-${createdAt.getDate()}`;
      if (dateKey !== previousDateKey) {
        items.push({
          type: "date",
          key: `date-${dateKey}-${index}`,
          label: createdAt.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });
        previousDateKey = dateKey;
      }

      items.push({
        type: "message",
        key: msg?._id || `msg-${dateKey}-${index}`,
        data: msg,
        time: createdAt.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    });

    return items;
  }, [messages]);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    const { data } = await axios.get(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUserId(data._id);
  }, [navigate, token]);

  const fetchMyMessages = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!token) return;

      try {
        if (!silent) setLoading(true);
        const { data } = await axios.get(
          `${API_URL}/api/support/user-messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (error) {
        if (!silent) {
          toast.error(error.response?.data?.error || "فشل تحميل رسائل الدعم");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    async function loadData() {
      try {
        await fetchProfile();
        await fetchMyMessages();
      } catch (error) {
        toast.error(error.response?.data?.message || "يرجى تسجيل الدخول أولًا");
        navigate("/login");
      }
    }

    loadData();
  }, [fetchMyMessages, fetchProfile, navigate]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!token || !userId) return undefined;

    const socket = getSocket();

    const emitUserActive = () => {
      socket.emit("join:user", userId);
      socket.emit("support:user:active", { userId });
    };

    const emitUserInactive = () => {
      socket.emit("support:user:inactive");
    };

    emitUserActive();

    const handleIncoming = (incomingMessage) => {
      if (String(incomingMessage?.userId) !== String(userId)) return;
      appendMessageUnique(incomingMessage);
    };

    const handleConnect = () => {
      emitUserActive();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        emitUserInactive();
        return;
      }

      emitUserActive();
    };

    const handlePageHide = () => {
      emitUserInactive();
    };

    const handlePageShow = () => {
      emitUserActive();
    };

    socket.on("support:new-message", handleIncoming);
    socket.on("connect", handleConnect);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      emitUserInactive();
      socket.off("support:new-message", handleIncoming);
      socket.off("connect", handleConnect);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, [appendMessageUnique, token, userId]);

  async function handleSend(event) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;

    if (!userId) {
      toast.error("تعذر معرفة المستخدم الحالي");
      return;
    }

    try {
      setSending(true);

      const payload = {
        userId,
        sender: "user",
        message: trimmedMessage,
      };

      const { data } = await axios.post(
        `${API_URL}/api/support/send-message`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data?.newMessage) {
        appendMessageUnique(data.newMessage);
      } else {
        await fetchMyMessages();
      }

      setMessageText("");
    } catch (error) {
      toast.error(error.response?.data?.error || "فشل إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="support-user" dir="rtl">
      <div className="support-user__nana-bg" aria-hidden="true">
        <div className="support-user__petals">
          {petals.map((petalStyle, index) => (
            <span
              key={`petal-${index}`}
              className="support-user__petal"
              style={petalStyle}
            />
          ))}
        </div>

        <div className="support-user__roses">
          <div className="support-user__rose support-user__rose-1">✿</div>
          <div className="support-user__rose support-user__rose-2">✿</div>
          <div className="support-user__rose support-user__rose-3">✿</div>
          <div className="support-user__rose support-user__rose-4">✿</div>
          <div className="support-user__rose support-user__rose-5">✿</div>
          <div className="support-user__rose support-user__rose-6">✿</div>
        </div>

        <div className="support-user__butterflies">
          <div className="support-user__butterfly support-user__butterfly-1">🦋</div>
          <div className="support-user__butterfly support-user__butterfly-2">🦋</div>
          <div className="support-user__butterfly support-user__butterfly-3">🦋</div>
          <div className="support-user__butterfly support-user__butterfly-4">🦋</div>
        </div>

        <div className="support-user__stars">
          {stars.map((starStyle, index) => (
            <div
              key={`star-${index}`}
              className="support-user__star"
              style={starStyle}
            >
              ⭐
            </div>
          ))}
        </div>

        <div className="support-user__glowing-hearts">
          <div className="support-user__growing-heart support-user__heart-1">💕</div>
          <div className="support-user__growing-heart support-user__heart-2">💕</div>
          <div className="support-user__growing-heart support-user__heart-3">💕</div>
        </div>

        <div className="support-user__flying-letters">
          {flyingLetters.map((letterStyle, index) => (
            <div
              key={`letter-${index}`}
              className="support-user__flying-n"
              style={letterStyle}
            >
              N
            </div>
          ))}
        </div>

        <div className="support-user__heart-wrapper">
          <div className="support-user__heart">
            <div className="support-user__heart-text">Nana</div>
          </div>
          <div className="support-user__sparkles">
            <span className="support-user__sparkle">✨</span>
            <span className="support-user__sparkle">✨</span>
            <span className="support-user__sparkle">✨</span>
            <span className="support-user__sparkle">💫</span>
            <span className="support-user__sparkle">💫</span>
            <span className="support-user__sparkle">✨</span>
          </div>
        </div>

        <h2 className="support-user__nana-title">نعنوع</h2>
        {/* <p className="support-user__nana-subtitle">نعنوعي</p> */}
      </div>

      <div className="support-user__content">
      <header className="support-user__header">
        <div className="support-user__headline">
          <Headset size={26} />
          <div>
            <h1>الدعم الفني</h1>
            <p>تواصل معنا وسنقوم بالرد عليك بأسرع وقت.</p>
          </div>
        </div>
      </header>

      <div className="support-user__chat-box">
        <div className="support-user__chat-header">
          <MessageCircle size={18} />
          <span>المحادثة</span>
          <small>
            <Clock3 size={14} />
            آخر التحديثات مباشرة
          </small>
        </div>

        <div className="support-user__messages" ref={messagesContainerRef}>
          {loading ? (
            <p className="support-user__state">جاري تحميل الرسائل...</p>
          ) : messages.length === 0 ? (
            <p className="support-user__state">
              لا توجد رسائل بعد، ابدأ محادثتك الآن.
            </p>
          ) : (
            chatItems.map((item) => {
              if (item.type === "date") {
                return (
                  <div key={item.key} className="support-user__date-separator">
                    <span>{item.label}</span>
                  </div>
                );
              }

              const msg = item.data;
              return (
                <div
                  key={item.key}
                  className={`support-user__message ${
                    msg.sender === "user"
                      ? "support-user__message--me"
                      : "support-user__message--admin"
                  }`}
                >
                  <p>{msg.message}</p>
                  <span>{item.time || "--:--"}</span>
                </div>
              );
            })
          )}
        </div>

        <form className="support-user__composer" onSubmit={handleSend}>
          <input
            type="text"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="اكتب رسالتك هنا..."
            disabled={sending}
          />
          <button type="submit" disabled={sending || !messageText.trim()}>
            <Send size={16} />
            {sending ? "جاري الإرسال..." : "إرسال"}
          </button>
        </form>
      </div>
      </div>
    </section>
  );
}
