import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./footer.css";

export default function Footer() {
	const currentYear = new Date().getFullYear();
	const siteUrl = window.location.origin;
	const qrLongPressTimerRef = useRef(null);
	const qrLongPressTriggeredRef = useRef(false);

	useEffect(() => {
		return () => {
			if (qrLongPressTimerRef.current) {
				clearTimeout(qrLongPressTimerRef.current);
			}
		};
	}, []);

	const copySiteLink = async () => {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(siteUrl);
			} else {
				const tempInput = document.createElement("input");
				tempInput.value = siteUrl;
				document.body.appendChild(tempInput);
				tempInput.select();
				document.execCommand("copy");
				document.body.removeChild(tempInput);
			}
			toast.success("تم نسخ رابط الموقع");
		} catch {
			toast.error("تعذر نسخ الرابط");
		}
	};

	const startQrLongPress = () => {
		qrLongPressTriggeredRef.current = false;
		if (qrLongPressTimerRef.current) {
			clearTimeout(qrLongPressTimerRef.current);
		}

		qrLongPressTimerRef.current = setTimeout(() => {
			qrLongPressTriggeredRef.current = true;
			copySiteLink();
		}, 600);
	};

	const stopQrLongPress = (event) => {
		if (qrLongPressTimerRef.current) {
			clearTimeout(qrLongPressTimerRef.current);
			qrLongPressTimerRef.current = null;
		}

		if (qrLongPressTriggeredRef.current) {
			event.preventDefault();
			event.stopPropagation();
		}
	};

	const handleQrClick = (event) => {
		if (qrLongPressTriggeredRef.current) {
			event.preventDefault();
			qrLongPressTriggeredRef.current = false;
		}
	};

	return (
		<footer className="site-footer" dir="rtl">
			<div className="site-footer__container">
				<div className="site-footer__grid">
					<div className="site-footer__brand">
						<h3 className="site-footer__title">SmartCart</h3>
						<p className="site-footer__text">
							متجر إلكتروني سريع وبسيط يوفر أفضل المنتجات بأسعار مناسبة وتجربة شراء
							مريحة.
						</p>
					</div>

					<div className="site-footer__section">
						<h4 className="site-footer__heading">روابط سريعة</h4>
						<ul className="site-footer__list">
							<li>
								<Link to="/" onClick={() => window.scrollTo(0, 0)}>الرئيسية</Link>
							</li>
							<li>
								<Link to="/products" onClick={() => window.scrollTo(0, 0)}>المنتجات</Link>
							</li>
                            <li>
                                <Link to="/categories" onClick={() => window.scrollTo(0, 0)}>الفئات</Link>
                            </li>
							<li>
								<Link to="/cart" onClick={() => window.scrollTo(0, 0)}>سلة المشتريات</Link>
							</li>
							<li>
								<Link to="/orders" onClick={() => window.scrollTo(0, 0)}>طلباتي</Link>
							</li>
						</ul>
					</div>

					<div className="site-footer__section">
						<h4 className="site-footer__heading">الدعم</h4>
						<ul className="site-footer__list">
							<li>
								<Link to="/contactUs" onClick={() => window.scrollTo(0, 0)}>تواصل معنا</Link>
							</li>
                            <li>
                                <Link to="/support" onClick={() => window.scrollTo(0, 0)}>الدعم الفني</Link>
                            </li>
						</ul>
					</div>

					<div className="site-footer__section">
						<h4 className="site-footer__heading">المتابعة</h4>
						<div className="socials">
							<a
								href="https://www.facebook.com/abdullah.alkhatib.647755?locale=ar_AR"
								aria-label="facebook"
								className="social"
								target="_blank"
								rel="noopener noreferrer"
							>
								<img
									src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Facebook_icon.svg"
									alt="Facebook"
									width="22"
									height="22"
								/>
							</a>

							<a
								href="https://www.instagram.com/aa.__.7_/"
								aria-label="instagram"
								className="social"
								target="_blank"
								rel="noopener noreferrer"
							>
								<img
									src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
									alt="Instagram"
									width="22"
									height="22"
								/>
							</a>
						</div>

						<div className="site-footer__qr-wrapper">
							<p className="site-footer__qr-text">امسح الكود لفتح الموقع مباشرة</p>
							<a
								href={siteUrl}
								target="_blank"
								rel="noopener noreferrer"
								onTouchStart={startQrLongPress}
								onTouchEnd={stopQrLongPress}
								onTouchCancel={stopQrLongPress}
								onMouseDown={startQrLongPress}
								onMouseUp={stopQrLongPress}
								onMouseLeave={stopQrLongPress}
								onClick={handleQrClick}
								className="site-footer__qr-link"
								aria-label="SmartCart website QR"
							>
								<img
									src="/qrcode.png"
									alt="QR Code for SmartCart website"
									className="site-footer__qr-image"
								/>
							</a>
							{/* <p className="site-footer__qr-hint">اضغط مطولًا لنسخ رابط الموقع</p> */}
						</div>
					</div>
				</div>

				<div className="site-footer__divider" />

				<div className="site-footer__bottom">
					<span>© {currentYear} SmartCart. جميع الحقوق محفوظة.</span>
				</div>
			</div>
		</footer>
	);
}
