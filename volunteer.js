document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";

    // 1. جلب وإظهار الفرص التطوعية الحية المتاحة الآن من قاعدة البيانات
    const liveOpportunitiesContainer = document.getElementById("liveOpportunitiesContainer");
    if (liveOpportunitiesContainer) {
        fetch(`${API_BASE_URL}/volunteer/opportunities`)
            .then(res => res.json())
            .then(opps => {
                if (opps.length === 0) {
                    loadFallbackOpportunities();
                } else {
                    renderOpportunities(opps);
                }
            })
            .catch(() => loadFallbackOpportunities());
    }

    function renderOpportunities(data) {
        liveOpportunitiesContainer.innerHTML = "";
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "opp-live-card";
            
            card.innerHTML = `
                <span class="opp-card-badge-tag">${item.camp_type_display || 'تطوع ميداني'}</span>
                <h4>${item.title}</h4>
                <p class="meta-town">📍 النطاق: ${item.region}</p>
                <p class="desc">${item.description}</p>
                <div class="opp-meta-row-info">
                    <span>⏱️ الوقت: ${item.work_time}</span>
                    <span>👤 المطلوب: ${item.required_count} متطوعين</span>
                </div>
                <button class="btn-apply-opp" data-opp-title="${item.title}" data-opp-field="${item.title}">سجل كفني / انضم للمهمة</button>
            `;
            liveOpportunitiesContainer.appendChild(card);
        });

        // ربط أزرار الفرص المتاحة لتثبيت الاختيار بالنموذج تلقائياً
        attachOpportunityButtons();
    }

    // 2. إدارة تحرك معالج خطوات التسجيل الأربعة (Wizard Steps Switcher)
    let currentStep = 1;
    const btnNext = document.getElementById("btnNextWiz");
    const btnBack = document.getElementById("btnBackWiz");
    const btnSubmit = document.getElementById("btnSubmitWiz");

    if (btnNext && btnBack) {
        btnNext.addEventListener("click", () => {
            if (validateStepFields(currentStep)) {
                document.getElementById(`panelStep${currentStep}`).classList.remove("active");
                document.getElementById(`indicator${currentStep}`).classList.remove("active");
                currentStep++;
                document.getElementById(`panelStep${currentStep}`).classList.add("active");
                document.getElementById(`indicator${currentStep}`).classList.add("active");
                updateWizardControls();
            }
        });

        btnBack.addEventListener("click", () => {
            document.getElementById(`panelStep${currentStep}`).classList.remove("active");
            document.getElementById(`indicator${currentStep}`).classList.remove("active");
            currentStep--;
            document.getElementById(`panelStep${currentStep}`).classList.add("active");
            document.getElementById(`indicator${currentStep}`).classList.add("active");
            updateWizardControls();
        });
    }

    function updateWizardControls() {
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

    function validateStepFields(step) {
        if (step === 1) {
            const name = document.getElementById("vName").value.trim();
            const phone = document.getElementById("vPhone").value.trim();
            const gov = document.getElementById("vGovernorate").value.trim();
            const dist = document.getElementById("vDistrict").value.trim();
            const reg = document.getElementById("vRegion").value.trim();

            if (!name || !phone || !gov || !dist || !reg) {
                alert("الرجاء ملء كافة الحقول الأساسية والنطاق الجغرافي للاستمرار.");
                return false;
            }
        }
        return true;
    }

    // 3. معالجة إرسال وحفظ نموذج المتطوعين بقاعدة البيانات حياً
    const volunteerForm = document.getElementById("volunteerRegisterForm");
    if (volunteerForm) {
        volunteerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!document.getElementById("vAgreedCharter").checked) {
                alert("الرجاء الموافقة على ميثاق المتطوع لتأكيد الانضمام.");
                return;
            }

            const payload = {
                volunteer_type: "individual",
                name: document.getElementById("vName").value.trim(),
                phone: document.getElementById("vPhone").value.trim(),
                governorate: document.getElementById("vGovernorate").value.trim(),
                district: document.getElementById("vDistrict").value.trim(),
                region: document.getElementById("vRegion").value.trim(),
                age_group: document.getElementById("vAgeGroup").value,
                languages: document.getElementById("vLanguages").value.trim(),
                field: document.getElementById("vField").value.trim() || "تطوع ميداني عام",
                specialty: document.getElementById("vSpecialty").value,
                available_days: document.getElementById("vAvailableDays").value.trim() || "حسب التنسيق",
                origin: "inside",
                agreed_to_charter: 1
            };

            btnSubmit.disabled = true;
            btnSubmit.textContent = "جاري حفظ بياناتك في قاعدة المتطوعين... ⏳";

            try {
                const response = await fetch(`${API_BASE_URL}/volunteer/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (response.ok && data.success) {
                    alert(data.message);
                    volunteerForm.reset();
                    location.reload();
                } else {
                    alert(data.message || "حدث خطأ أثناء حفظ طلب التطوع.");
                }
            } catch (err) {
                console.error("Volunteer register connection link error:", err);
                alert("خطأ في الاتصال بالخادم الرئيسي للمنصة.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "تأكيد وإرسال طلب الانضمام للفرق 🚀";
            }
        });
    }

    // دالة ربط ضغطات كروت الفرص لتثبيتها في خانة نوع التطوع تلقائياً
    function attachOpportunityButtons() {
        document.querySelectorAll(".btn-apply-opp").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const title = e.target.dataset.oppTitle;
                document.getElementById("vField").value = `مهمة ميدانية ملحة: ${title}`;
                scrollToForm();
            });
        });
    }
    
    function loadFallbackOpportunities() {
        const fallbacks = [
            { title: "إزالة مخلفات وفتح ممرات", region: "بنت جبيل", description: "تنظيف ممرات، فرز مواد، دعم فرق العمل الميدانية في الأحياء القديمة.", required_count: 15, work_time: "السبت - 8:00 صباحاً", camp_type_display: "تطوع ميداني" },
            { title: "صيانة تمديدات مياه", region: "عيترون", description: "مساعدة الفنيين في صيانة شبكة الضخ الفرعية وتوصيل الخطوط المتضررة.", required_count: 5, work_time: "حسب التنسيق", camp_type_display: "سجل كفني" },
            { title: "توضيب مساعدات", region: "الخيام", description: "فرز وتعبئة الحصص الغذائية والوجبات الساخنة وتجهيزها للتوزيع الميداني.", required_count: 20, work_time: "الأحد - 10:00 صباحاً", camp_type_display: "تطوع ميداني" }
        ];
        renderOpportunities(fallbacks);
    }
});

function scrollToForm() {
    const el = document.getElementById("volunteerFormSection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

function scrollToOpportunities() {
    const el = document.getElementById("opportunitiesSection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
}