import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageCircle, Send, Headset, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config/api";
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

	const fetchMyMessages = useCallback(async () => {
		if (!token) return;

		try {
			setLoading(true);
			const { data } = await axios.get(`${API_URL}/api/support/user-messages`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			setMessages(Array.isArray(data.messages) ? data.messages : []);
		} catch (error) {
			toast.error(error.response?.data?.error || "فشل تحميل رسائل الدعم");
		} finally {
			setLoading(false);
		}
	}, [token]);

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

			const { data } = await axios.post(`${API_URL}/api/support/send-message`, payload, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (data?.newMessage) {
				setMessages((prev) => [...prev, data.newMessage]);
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
						<p className="support-user__state">لا توجد رسائل بعد، ابدأ محادثتك الآن.</p>
					) : (
						messages.map((msg) => (
							<div
								key={msg._id}
								className={`support-user__message ${
									msg.sender === "user" ? "support-user__message--me" : "support-user__message--admin"
								}`}
							>
								<p>{msg.message}</p>
								<span>
									{new Date(msg.createdAt).toLocaleString("ar-EG", {
										hour: "2-digit",
										minute: "2-digit",
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
									})}
								</span>
							</div>
						))
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
		</section>
	);
}
