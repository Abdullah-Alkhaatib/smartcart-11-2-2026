import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Headset, RefreshCw, Send, MessageSquare } from "lucide-react";
import API_URL from "../../config/api";
import { getSocket } from "../../utils/socket";
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

	const appendMessageUnique = useCallback((incomingMessage) => {
		if (!incomingMessage?._id) return;
		setMessages((prev) => {
			if (prev.some((message) => message._id === incomingMessage._id)) return prev;
			return [...prev, incomingMessage];
		});
	}, []);

	const chatItems = useMemo(() => {
		const items = [];
		let previousDateKey = "";

		messages.forEach((message, index) => {
			const createdAt = message?.createdAt ? new Date(message.createdAt) : null;
			if (!createdAt || Number.isNaN(createdAt.getTime())) {
				items.push({
					type: "message",
					key: message?._id || `msg-${index}`,
					data: message,
					time: "--:--",
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
				key: message?._id || `msg-${dateKey}-${index}`,
				data: message,
				time: createdAt.toLocaleTimeString("ar-EG", {
					hour: "2-digit",
					minute: "2-digit",
				}),
			});
		});

		return items;
	}, [messages]);

	const requestConfig = useMemo(
		() => ({
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}),
		[token],
	);

	const fetchConversations = useCallback(async (options = {}) => {
		const { silent = false } = options;
		if (!token) return;

		try {
			if (!silent) setLoadingConversations(true);
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
			if (!silent) {
				toast.error(error.response?.data?.message || "فشل تحميل المحادثات");
			}
		} finally {
			if (!silent) setLoadingConversations(false);
		}
	}, [requestConfig, token]);

	const fetchUserMessages = useCallback(
		async (userId, options = {}) => {
			const { silent = false } = options;
			if (!token || !userId) return;

			try {
				if (!silent) setLoadingMessages(true);
				const { data } = await axios.get(
					`${API_URL}/api/support/user-messages/${userId}`,
					requestConfig,
				);

				setMessages(Array.isArray(data.messages) ? data.messages : []);
			} catch (error) {
				if (!silent) {
					setMessages([]);
					toast.error(error.response?.data?.message || "فشل تحميل رسائل المستخدم");
				}
			} finally {
				if (!silent) setLoadingMessages(false);
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

	useEffect(() => {
		if (!token) return undefined;

		const socket = getSocket();
		socket.emit("join:admin");

		const handleIncoming = (incomingMessage) => {
			if (!incomingMessage?.userId) return;

			fetchConversations({ silent: true });

			if (
				selectedConversation?._id &&
				String(selectedConversation._id) === String(incomingMessage.userId)
			) {
				appendMessageUnique(incomingMessage);
			}
		};

		const handleConversationUpdated = ({ userId } = {}) => {
			fetchConversations({ silent: true });
			if (selectedConversation?._id && String(selectedConversation._id) === String(userId)) {
				fetchUserMessages(selectedConversation._id, { silent: true });
			}
		};

		socket.on("support:new-message", handleIncoming);
		socket.on("support:conversation-updated", handleConversationUpdated);

		return () => {
			socket.off("support:new-message", handleIncoming);
			socket.off("support:conversation-updated", handleConversationUpdated);
		};
	}, [
		appendMessageUnique,
		fetchConversations,
		fetchUserMessages,
		token,
		selectedConversation?._id,
	]);

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
				appendMessageUnique(data.newMessage);
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
									chatItems.map((item) => {
										if (item.type === "date") {
											return (
												<div key={item.key} className="sdb-date-separator">
													<span>{item.label}</span>
												</div>
											);
										}

										const message = item.data;
										return (
											<article
												key={item.key}
												className={`sdb-message ${
													message.sender === "admin"
														? "sdb-message--admin"
														: "sdb-message--user"
												}`}
											>
												<p>{message.message}</p>
												<span>{item.time}</span>
											</article>
										);
									})
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
