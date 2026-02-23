import { Link } from "react-router-dom";
import "./footer.css";

export default function Footer() {
	const currentYear = new Date().getFullYear();

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
