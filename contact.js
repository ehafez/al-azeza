document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";

    // معالجة إرسال وحفظ رسالة الاتصال الجديدة بقاعدة البيانات حياً
    const contactForm = document.getElementById("contactSendMessageForm");
    const btnSubmit = document.getElementById("btnSubmitContact");

    if (contactForm && btnSubmit) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // تجهيز حمولة البيانات (Payload) لمطابقة جدول الداتابيز المحدث
            const payload = {
                full_name: document.getElementById("cFullName").value.trim(),
                phone: document.getElementById("cPhone").value.trim(),
                email: document.getElementById("cEmail").value.trim() || null,
                msg_type: document.getElementById("cMsgType").value,
                subject: document.getElementById("cSubject").value.trim(),
                message: document.getElementById("cMessage").value.trim()
            };

            // تعطيل الزر مؤقتاً لمنع تكرار الإرسال العشوائي
            btnSubmit.disabled = true;
            btnSubmit.textContent = "جاري إرسال الرسالة لغرفة العمليات... ⏳";

            try {
                const response = await fetch(`${API_BASE_URL}/contact/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                
                if (response.ok && data.success) {
                    // إظهار رسالة النجاح وتصفير الحقول بالكامل
                    alert(data.message);
                    contactForm.reset();
                } else {
                    alert(data.message || "عذراً، حدث خطأ غير متوقع أثناء محاولة إرسال الرسالة.");
                }
            } catch (err) {
                console.error("Contact send connection link error:", err);
                alert("فشل الاتصال بالخادم الرئيسي للمنصة، يرجى التحقق من الشبكة.");
            } finally {
                // إعادة تنشيط الزر للوضع الافتراضي
                btnSubmit.disabled = false;
                btnSubmit.textContent = "إرسال الرسالة إلى إدارة المبادرة الآن 🚀";
            }
        });
    }
});