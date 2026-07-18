document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";

    // 1. جلب وإظهار الاحتياجات العينية المفتوحة حياً من الداتابيز
    const liveNeedsContainer = document.getElementById("liveNeedsContainer");
    if (liveNeedsContainer) {
        fetch(`${API_BASE_URL}/donations/needs`)
            .then(res => res.json())
            .then(needs => {
                if (needs.length === 0) {
                    loadFallbackSampleNeeds();
                } else {
                    renderNeedsCards(needs);
                }
            })
            .catch(() => loadFallbackSampleNeeds());
    }

    function renderNeedsCards(data) {
        liveNeedsContainer.innerHTML = "";
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "need-item-card";
            
            const emoji = getCategoryEmoji(item.need_category);
            const remaining = item.required_quantity - item.received_quantity;

            card.innerHTML = `
                <div class="icon-label">${emoji}</div>
                <h4>${item.need_title}</h4>
                <p class="town">📍 مسار استجابة: ${item.operation_title || 'عام المبادرة'}</p>
                <div class="need-badge-urgency urgency-${item.urgency_level}">
                    ${translateUrgency(item.urgency_level)}
                </div>
                <div class="need-meta-qty">
                    <span>المطلوب: <strong>${item.required_quantity}</strong></span>
                    <span>المتبقي: <strong style="color:var(--secondary-color);">${remaining}</strong></span>
                </div>
                <button class="btn-support-need" data-need-id="${item.id}" data-need-title="${item.need_title}">أريد دعم هذا الاحتياج</button>
            `;
            liveNeedsContainer.appendChild(card);
        });

        // ربط أزرار الكروت لتثبيت الخيار المختار في نموذج التعهد تلقائياً
        attachNeedButtonsEvents();
    }

    // 2. جلب مسارات العمل الميدانية العامة لدعم المسارات بالكامل
    const liveOpsContainer = document.getElementById("liveOpsContainer");
    if (liveOpsContainer) {
        fetch(`${API_BASE_URL}/operations`)
            .then(res => res.json())
            .then(ops => {
                const targets = ops.length === 0 ? getSampleOpsFallback() : ops;
                renderOpsSupportCards(targets);
            })
            .catch(() => renderOpsSupportCards(getSampleOpsFallback()));
    }

    function renderOpsSupportCards(data) {
        liveOpsContainer.innerHTML = "";
        data.slice(0, 3).forEach(op => {
            const card = document.createElement("div");
            card.className = "op-support-card";
            card.innerHTML = `
                <div class="op-card-banner-inside">
                    <h4>${op.title}</h4>
                    <span>قضاء الميدان: جنوب لبنان</span>
                </div>
                <div class="op-card-body-inside">
                    <div class="progress-meta-text">
                        <span>التقدم العام المسجل</span>
                        <strong>${op.progress_percent || op.progress}%</strong>
                    </div>
                    <div class="op-card-progress-bar">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${op.progress_percent || op.progress}%;"></div>
                        </div>
                    </div>
                    <p class="needs-summary-label">📋 أبرز الاحتياجات المفتوحة بالكامل: كفوف، وقود للآليات، طرود ومواد حماية ودعم لوجستي عاجل.</p>
                    <button class="btn-donate-op-general" onclick="scrollToSection('pledge-section-form')">ادعم استجابة ${op.title}</button>
                </div>
            `;
            liveOpsContainer.appendChild(card);
        });
    }

    // 3. معالج تحرك الخطوات التدفقي المتقدم لنموذج التعهد (Wizard Logic)
    let currentStep = 1;
    const btnNext = document.getElementById("btnWizNext");
    const btnBack = document.getElementById("btnWizBack");
    const btnSubmit = document.getElementById("btnWizSubmit");

    if (btnNext && btnBack) {
        btnNext.addEventListener("click", () => {
            if (validateStep(currentStep)) {
                document.getElementById(`wizardStep${currentStep}`).classList.remove("active");
                document.getElementById(`stepIndicator${currentStep}`).classList.remove("active");
                currentStep++;
                document.getElementById(`wizardStep${currentStep}`).classList.add("active");
                document.getElementById(`stepIndicator${currentStep}`).classList.add("active");
                updateWizardButtons();
            }
        });

        btnBack.addEventListener("click", () => {
            document.getElementById(`wizardStep${currentStep}`).classList.remove("active");
            document.getElementById(`stepIndicator${currentStep}`).classList.remove("active");
            currentStep--;
            document.getElementById(`wizardStep${currentStep}`).classList.add("active");
            document.getElementById(`stepIndicator${currentStep}`).classList.add("active");
            updateWizardButtons();
        });
    }

    function updateWizardButtons() {
        if (currentStep === 1) {
            btnBack.style.display = "none";
            btnNext.style.display = "block";
            btnSubmit.style.display = "none";
        } else if (currentStep === 4) {
            btnBack.style.display = "block";
            btnNext.style.display = "none";
            btnSubmit.style.display = "block";
        } else {
            btnBack.style.display = "block";
            btnNext.style.display = "block";
            btnSubmit.style.display = "none";
        }
    }

    function validateStep(step) {
        if (step === 3) {
            const details = document.getElementById("amount_or_details").value.trim();
            if (!details) {
                alert("الرجاء كتابة القيمة النقدية أو تفاصيل المواد العينية أولاً.");
                return false;
            }
        }
        return true;
    }

    // 4. معالجة إرسال التعهد الحقيقي وحفظه بجدول قاعدة البيانات
    const pledgeForm = document.getElementById("donationPledgeForm");
    if (pledgeForm) {
        pledgeForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                donor_type: document.querySelector('input[name="donation_type"]:checked').value === 'partnership' ? 'institution' : 'individual',
                donor_name: document.getElementById("donor_name").value.trim(),
                donor_phone: document.getElementById("donor_phone").value.trim(),
                donor_email: document.getElementById("donor_email").value.trim() || null,
                donation_type: document.querySelector('input[name="donation_type"]:checked').value,
                target_type: document.querySelector('input[name="target_type"]:checked').value,
                target_id: pledgeForm.dataset.selectedNeedId ? parseInt(pledgeForm.dataset.selectedNeedId) : null,
                amount_or_details: document.getElementById("amount_or_details").value.trim()
            };

            btnSubmit.disabled = true;
            btnSubmit.textContent = "جاري تسجيل التعهد الميداني... ⏳";

            try {
                const response = await fetch(`${API_BASE_URL}/donations/pledge`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    alert(data.message);
                    pledgeForm.reset();
                    location.reload(); // إعادة تحميل الواجهة لتحديث الأرقام المتبقية حياً
                } else {
                    alert(data.message || "حدث خطأ أثناء معالجة التعهد.");
                }
            } catch (err) {
                console.error("Pledge submission link error:", err);
                alert("خطأ في الاتصال بالخادم المالي للمنصة.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "إرسال وتأكيد التعهد للمبادرة 🚀";
            }
        });
    }

    // دالة ربط كروت الاحتياجات بالنموذج مباشرة عند الضغط
    function attachNeedButtonsEvents() {
        document.querySelectorAll(".btn-support-need").forEach(button => {
            button.addEventListener("click", (e) => {
                const needId = e.target.dataset.needId;
                const needTitle = e.target.dataset.needTitle;
                
                // الانتقال التلقائي لخانة التفاصيل وتثبيت البند المختار
                document.getElementById("amount_or_details").value = `تعهد عيني لتقديم بند: (${needTitle})`;
                pledgeForm.dataset.selectedNeedId = needId;
                
                // تحديد الراديو الخاص بـ "دعم بند عيني محدد"
                const specificNeedRadio = document.querySelector('input[name="target_type"][value="specific_need"]');
                if (specificNeedRadio) specificNeedRadio.checked = true;

                scrollToSection('pledge-section-form');
            });
        });
    }

    // منسدل الأسئلة الشائعة التفاعلي (Accordion Logic)
    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => {
            const item = header.parentElement;
            item.classList.toggle("open");
            header.querySelector("span").textContent = item.classList.contains("open") ? "-" : "+";
        });
    });

    // دالات الترجمة والرموز المساعدة
    function getCategoryEmoji(cat) {
        if(cat === 'material') return "📦";
        if(cat === 'logistic') return "🚛";
        if(cat === 'service') return "🛠️";
        return "💵";
    }
    function translateUrgency(level) {
        if(level === 'urgent') return 'عاجل جداً';
        if(level === 'medium') return 'مرتفع';
        return 'متوسط';
    }
    function loadFallbackSampleNeeds() {
        const fallbacks = [
            { id: 1, need_title: "مواد عزل مؤقتة", need_category: "material", urgency_level: "medium", required_quantity: 150, received_quantity: 110 },
            { id: 2, need_title: "شاحنة وقود ونقل إمداد", need_category: "logistic", urgency_level: "urgent", required_quantity: 4, received_quantity: 2 },
            { id: 3, need_title: "500 متر كابلات كهربائية", need_category: "material", urgency_level: "urgent", required_quantity: 390, received_quantity: 110 },
            { id: 4, need_title: "مضخة مياه غاطسة 5HP", need_category: "material", urgency_level: "urgent", required_quantity: 2, received_quantity: 0 }
        ];
        renderNeedsCards(fallbacks);
    }
    function getSampleOpsFallback() {
        return [
            { title: "استجابة بنت جبيل", progress: 42 },
            { title: "استجابة عيترون", progress: 30 },
            { title: "استجابة الخيام", progress: 15 }
        ];
    }
});

// دالة التمرير الانسيابي السلس (Smooth Scroll)
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
}