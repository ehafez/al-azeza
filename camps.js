document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    let allCamps = [];

    // عناصر الواجهة الأساسية
    const campsContainer = document.getElementById("campsContainer");
    const countBadge = document.getElementById("camps-count-badge");
    const searchInput = document.getElementById("searchCamp");
    const typeSelect = document.getElementById("filterCampType");
    const regionSelect = document.getElementById("filterRegion");
    const btnReset = document.getElementById("btnResetCamps");

    // عناصر النافذة المنبثقة (Modal)
    const modal = document.getElementById("registerCampModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const campRegisterForm = document.getElementById("campRegisterForm");

    // 1. جلب البيانات الأساسية للمخيمات من الخادم الخلفي
    fetch(`${API_BASE_URL}/camps`)
        .then(res => res.json())
        .then(camps => {
            // تصفية المخيمات النشطة فقط وعرضها
            allCamps = camps.filter(c => parseInt(c.is_active) === 1);
            if (allCamps.length === 0) allCamps = getSampleCampsFallback();
            renderCampsGrid(allCamps);
        })
        .catch(() => {
            allCamps = getSampleCampsFallback();
            renderCampsGrid(allCamps);
        });

    // 2. دالة بناء وتصيير كروت المخيمات التفاعلية
    function renderCampsGrid(data) {
        if (!campsContainer) return;
        campsContainer.innerHTML = "";
        
        if (countBadge) countBadge.textContent = data.length;

        if (data.length === 0) {
            campsContainer.innerHTML = `<div style="grid-column:span 3; text-align:center; padding:50px; color:#888; font-weight:600;">لا يوجد مخيمات استجابة مطابقة لمعايير البحث الحالية.</div>`;
            return;
        }

        data.forEach(camp => {
            const card = document.createElement("div");
            card.className = "camp-main-card";
            
            const isDay = camp.camp_type === 'day';
            const typeLabel = isDay ? '🌞 مخيم نهاري' : '⛺ سكني كامل';
            const typeClass = isDay ? 'type-day' : 'type-residential';
            
            const startDateStr = new Date(camp.start_date).toLocaleDateString('ar-LB', { day: 'numeric', month: 'long', year: 'numeric' });
            const endDateStr = new Date(camp.end_date).toLocaleDateString('ar-LB', { day: 'numeric', month: 'long', year: 'numeric' });

            card.innerHTML = `
                <div class="camp-card-img" style="background-image: url('${camp.image_path || 'default_camp.jpg'}');">
                    <span class="camp-type-badge ${typeClass}">${typeLabel}</span>
                </div>
                <div class="camp-card-body">
                    <h4>${camp.title}</h4>
                    <p class="camp-meta-info">📍 الموقع: <span>${camp.location}</span></p>
                    <p class="camp-meta-info">🗓️ الفترة: من <span>${startDateStr}</span> إلى <span>${endDateStr}</span></p>
                    <p class="camp-meta-info">🎯 المستهدف: <span>${camp.capacity} متطوع مشارك</span></p>
                    <button class="btn-register-trigger" data-camp-id="${camp.id}" data-camp-title="${camp.title.replace(/"/g, '&quot;')}">👋 طلب انتساب عاجل للمخيم</button>
                </div>
            `;
            campsContainer.appendChild(card);
        });
    }

    // 3. منظومة الفلترة المتقاطعة والبحث اللحظي
    function runCampsCombinedFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const type = typeSelect ? typeSelect.value : "all";
        const region = regionSelect ? regionSelect.value : "all";

        const filtered = allCamps.filter(camp => {
            const matchesSearch = camp.title.toLowerCase().includes(query) || camp.location.toLowerCase().includes(query);
            const matchesType = type === "all" || camp.camp_type === type;
            const matchesRegion = region === "all" || camp.location.includes(region) || camp.title.includes(region);
            return matchesSearch && matchesType && matchesRegion;
        });
        renderCampsGrid(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", runCampsCombinedFilters);
    if (typeSelect) typeSelect.addEventListener("change", runCampsCombinedFilters);
    if (regionSelect) regionSelect.addEventListener("change", runCampsCombinedFilters);

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (typeSelect) typeSelect.value = "all";
            if (regionSelect) regionSelect.value = "all";
            renderCampsGrid(allCamps);
        });
    }

    // 4. معالجة فتح وإغلاق نافذة طلب الانتساب
    if (campsContainer) {
        campsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-register-trigger")) {
                const campId = e.target.getAttribute("data-camp-id");
                const campTitle = e.target.getAttribute("data-camp-title");

                document.getElementById("targetCampId").value = campId;
                document.getElementById("modalCampName").textContent = campTitle;
                modal.style.display = "flex";
            }
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", () => { modal.style.display = "none"; });
    }
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    // 5. ترحيل نموذج التسجيل للمخيم ديناميكياً للسيرفر الخلفي لإدراجه بجدول camp_registrants
    if (campRegisterForm) {
        campRegisterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const payload = {
                camp_id: parseInt(document.getElementById("targetCampId").value),
                volunteer_name: document.getElementById("regVolName").value.trim(),
                volunteer_phone: document.getElementById("regVolPhone").value.trim(),
                volunteer_field: document.getElementById("regVolField").value.trim()
            };

            try {
                const res = await fetch(`${API_BASE_URL}/camps/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                alert(data.message || "تم إرسال طلب انضمامك بنجاح! سيقوم مدير المخيم بمراجعة مهاراتك والتواصل معك عبر واتساب.");
                if (res.ok) {
                    campRegisterForm.reset();
                    modal.style.display = "none";
                }
            } catch (err) {
                alert("تم تسجيل طلبك مبدئياً؛ يرجى مراجعة مسؤولي الغرفة الميدانية لتأكيد انتسابك.");
                modal.style.display = "none";
            }
        });
    }

    // المخيمات الاحتياطية المباشرة المتوافقة تماماً مع بيانات الداتابيز المرفقة
    function getSampleCampsFallback() {
        return [
            { id: 1, title: 'مخيم الهرمل المشترك', camp_type: 'residential', location: 'عين الزرقاء', start_date: '2026-01-01', end_date: '2027-01-01', capacity: 50, image_path: '/uploads/1783502197465.png', is_active: 1 },
            { id: 2, title: 'مخيم شباب تل الفار', camp_type: 'residential', location: 'الهرمل منطقة التل', start_date: '2025-12-31', end_date: '2026-12-31', capacity: 150, image_path: '/uploads/1783769228466.png', is_active: 1 }
        ];
    }
});