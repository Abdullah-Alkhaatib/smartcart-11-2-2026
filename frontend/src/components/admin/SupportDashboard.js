import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Headset, RefreshCw, Send, MessageSquare } from "lucide-react";
import API_URL from "../../config/api";
import "./supportDashboard.css";

export default function SupportDashboard() {
	const [conversations, setConversations] = useState([]);
	const [selectedConversation, setSelectedConversation] = useState(null);
	const [messages, setMessages] = useState([]);
	const [messageText, setMessageText] = useState("");
	const [loadingConversations, setLoadingConversations] = useState(false);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [sendingReply, setSendingReply] = useState(false);

	const messagesEndRef = useRef(null);
	const token = useMemo(() => localStorage.getItem("token"), []);

	const requestConfig = useMemo(
		() => ({
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}),
		[token],
	);

	const fetchConversations = useCallback(async () => {
		if (!token) return;

		try {
			setLoadingConversations(true);
			const { data } = await axios.get(
				`${API_URL}/api/support/all-conversations`,
				requestConfig,
			);

			const normalized = Array.isArray(data) ? data : [];
			setConversations(normalized);

			if (normalized.length === 0) {
				setSelectedConversation(null);
				setMessages([]);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "فشل تحميل المحادثات");
		} finally {
			setLoadingConversations(false);
		}
	}, [requestConfig, token]);

	const fetchUserMessages = useCallback(
		async (userId) => {
			if (!token || !userId) return;

			try {
				setLoadingMessages(true);
				const { data } = await axios.get(
					`${API_URL}/api/support/user-messages/${userId}`,
					requestConfig,
				);

				setMessages(Array.isArray(data.messages) ? data.messages : []);
			} catch (error) {
				setMessages([]);
				toast.error(error.response?.data?.message || "فشل تحميل رسائل المستخدم");
			} finally {
				setLoadingMessages(false);
			}
		},
		[requestConfig, token],
	);

	useEffect(() => {
		fetchConversations();
	}, [fetchConversations]);

	useEffect(() => {
		if (!selectedConversation?._id) return;
		fetchUserMessages(selectedConversation._id);
	}, [fetchUserMessages, selectedConversation]);

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	async function handleSendReply(event) {
		event.preventDefault();
		const trimmedMessage = messageText.trim();

		if (!trimmedMessage || !selectedConversation?._id) return;

		try {
			setSendingReply(true);

			const payload = {
				userId: selectedConversation._id,
				sender: "admin",
				message: trimmedMessage,
			};

			const { data } = await axios.post(
				`${API_URL}/api/support/send-message`,
				payload,
				requestConfig,
			);

			if (data?.newMessage) {
				setMessages((prev) => [...prev, data.newMessage]);
			} else {
				await fetchUserMessages(selectedConversation._id);
			}

			setMessageText("");
			await fetchConversations();
		} catch (error) {
			toast.error(error.response?.data?.message || "فشل إرسال الرد");
		} finally {
			setSendingReply(false);
		}
	}

	return (
		<section className="sdb-root" dir="rtl">
			<header className="sdb-header">
				<div>
					<h2>
						<Headset size={22} />
						دعم المستخدمين
					</h2>
					<p>إدارة المحادثات والرد على استفسارات العملاء.</p>
				</div>

				<button
					type="button"
					className="sdb-refresh-btn"
					onClick={fetchConversations}
					disabled={loadingConversations}
				>
					<RefreshCw size={16} />
					{loadingConversations ? "جار التحميل" : "تحديث"}
				</button>
			</header>

			<div className="sdb-grid">
				<aside className="sdb-conversations">
					<div className="sdb-conversations-head">
						<h3>المحادثات</h3>
						<span>{conversations.length}</span>
					</div>

					{loadingConversations ? (
						<p className="sdb-state">جاري تحميل المحادثات...</p>
					) : conversations.length === 0 ? (
						<p className="sdb-state">لا توجد محادثات حالياً.</p>
					) : (
						<div className="sdb-conversations-list">
							{conversations.map((conversation) => (
								<button
									type="button"
									key={conversation._id}
									className={`sdb-conversation-item ${
										selectedConversation?._id === conversation._id
											? "is-active"
											: ""
									}`}
									onClick={() => setSelectedConversation(conversation)}
								>
									<div className="sdb-conversation-item__top">
										<strong>{conversation.userName || "مستخدم"}</strong>
										<small>
											{conversation.updatedAt
												? new Date(conversation.updatedAt).toLocaleDateString("ar-EG")
												: ""}
										</small>
									</div>

									<p>{conversation.lastMessage || "لا توجد رسالة"}</p>
								</button>
							))}
						</div>
					)}
				</aside>

				<div className="sdb-chat">
					{!selectedConversation ? (
						<div className="sdb-empty-chat">
							<MessageSquare size={28} />
							<p>اختر محادثة من القائمة لعرض الرسائل.</p>
						</div>
					) : (
						<>
							<div className="sdb-chat-head">
								<h3>{selectedConversation.userName || "مستخدم"}</h3>
								{/* <span>ID: {selectedConversation._id}</span> */}
							</div>

							<div className="sdb-messages">
								{loadingMessages ? (
									<p className="sdb-state">جاري تحميل الرسائل...</p>
								) : messages.length === 0 ? (
									<p className="sdb-state">لا توجد رسائل في هذه المحادثة.</p>
								) : (
									messages.map((message) => (
										<article
											key={message._id}
											className={`sdb-message ${
												message.sender === "admin"
													? "sdb-message--admin"
													: "sdb-message--user"
											}`}
										>
											<p>{message.message}</p>
											<span>
												{new Date(message.createdAt).toLocaleString("ar-EG", {
													year: "numeric",
													month: "2-digit",
													day: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</article>
									))
								)}

								<div ref={messagesEndRef} />
							</div>

							<form className="sdb-reply" onSubmit={handleSendReply}>
								<input
									type="text"
									placeholder="اكتب ردك للمستخدم..."
									value={messageText}
									onChange={(event) => setMessageText(event.target.value)}
									disabled={sendingReply}
								/>

								<button
									type="submit"
									disabled={sendingReply || !messageText.trim()}
								>
									<Send size={15} />
									{sendingReply ? "جار الإرسال" : "إرسال"}
								</button>
							</form>
						</>
					)}
				</div>
			</div>
		</section>
	);
}
