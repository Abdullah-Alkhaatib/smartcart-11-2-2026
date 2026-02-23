import { useState } from "react";
import { Mail, PhoneCall, MapPin, Send } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import API_URL from "../../config/api";
import "./contactUsUser.css";

export default function ContactUsUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim(),
    };

    if (!trimmed.name || !trimmed.email || !trimmed.message) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`${API_URL}/api/contact/send-message`, trimmed);
      toast.success("تم إرسال الرسالة بنجاح");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "حدث خطأ أثناء الإرسال";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-us" dir="rtl">
      <div className="contact-us__header">
        <div className="contact-us__headline">
          <span className="contact-us__tag">نحن هنا للمساعدة</span>
          <h1>تواصل معنا</h1>
        </div>
        <p>أرسل رسالتك وسنرد عليك بأسرع وقت ممكن.</p>
      </div>

      <div className="contact-us__content">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__group">
            <label htmlFor="name">الاسم الكامل</label>
            <input
              id="name"
              name="name"
              type="text"
              dir="auto"
              placeholder="اكتب اسمك"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="contact-form__group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="contact-form__group">
            <label htmlFor="message">رسالتك</label>
            <textarea
              id="message"
              name="message"
              placeholder="اكتب رسالتك هنا..."
              rows="5"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <button
            className="contact-form__submit"
            type="submit"
            disabled={isSubmitting}
          >
            <Send size={18} />
            {isSubmitting ? "جارٍ الإرسال..." : "إرسال الرسالة"}
          </button>
        </form>

        <div className="contact-info">
          <div className="contact-info__card">
            <Mail size={20} />
            <div>
              <h4>البريد الإلكتروني</h4>
              <p>support@smartcart.com</p>
            </div>
          </div>
          <div className="contact-info__card">
            <PhoneCall size={20} />
            <div>
              <h4>رقم الهاتف</h4>
              <p style={{direction: "ltr"}}>+965 5555 1234</p>
            </div>
          </div>
          <div className="contact-info__card">
            <MapPin size={20} />
            <div>
              <h4>الموقع</h4>
              <p>الكويت - مدينة الكويت</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
