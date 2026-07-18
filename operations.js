document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    let allOperations = []; // لحفظ مصفوفة العمليات كاملة للفلترة محلياً دون إرهاق السيرفر

    // 1. جلب إحصائيات عدادات العمليات المتقدمة
    fetch(`${API_BASE_URL}/stats`)
        .then(res => res.json())
        .then(stats => {
            // تحديث العدادات من داتابيز المنصة ديناميكياً
            if (stats.total_volunteers) {
                document.getElementById("stat-volunteers").textContent = Number(stats.total_volunteers).toLocaleString();
                document.getElementById("stat-beneficiaries").textContent = Number(stats.total_beneficiaries).toLocaleString();
            }
        }).catch(err => console.error("Error loading statistics counters:", err));

    // 2. جلب مصفوفة العمليات النشطة والميدانية كاملة
    const opsContainer = document.getElementById("opsContainer");
    if (opsContainer) {
        fetch(`${API_BASE_URL}/operations`)
            .then(res => res.json())
            .then(operations => {
                // إذا كانت الداتابيز فارغة، قم بضخ البيانات الافتراضية الثمانية المطابقة تماماً للصورة
                allOperations = operations.length === 0 ? getSampleOperationsFull() : operations;
                document.getElementById("ops-count-badge").textContent = allOperations.length;
                renderOperationsGrid(allOperations);
            })
            .catch(err => {
                console.error("Error loading operations, active fallbacks:", err);
                allOperations = getSampleOperationsFull();
                renderOperationsGrid(allOperations);
            });
    }

    // دالة بناء ورسم كروت العمليات الميدانية
    function renderOperationsGrid(data) {
        opsContainer.innerHTML = "";
        if (data.length === 0) {
            opsContainer.innerHTML = `<div style="grid-column:span 4; text-align:center; padding:40px; color:#888; font-weight:600;">عذراً، لم يتم العثور على مسارات استجابة مطابقة للبحث.</div>`;
            return;
        }

        data.forEach(op => {
            const card = document.createElement("div");
            card.className = "op-main-card";
            
            // تحويل النص المخزن للأيقونات إلى أشكال تفاعلية
            const iconsHTML = parseNeededIconsToEmoji(op.needed_icons || op.icons);
            const statusText = translateStatusToArabic(op.status);

            card.innerHTML = `
                <div class="card-img-wrapper" style="background-image: url('${op.image_path || '/picture/default_op.jpg'}');">
                    <span class="region-badge">📍 ${op.region}</span>
                    <span class="status-badge badge-${op.status}">${statusText}</span>
                </div>
                <div class="card-content-inside">
                    <h3>${op.title}</h3>
                    <p class="desc">${op.description || 'تأهيل البنية التحتية والمرافق العامة ودعم العائلات المتضررة وعمليات الاستجابة السريعة.'}</p>
                    
                    <div class="progress-container-meta">
                        <div class="progress-text-label">
                            <span>نسبة الإنجاز</span>
                            <strong>${op.progress_percent || op.progress}%</strong>
                        </div>
                        <div class="progress-bar-bg-inside">
                            <div class="progress-bar-fill-inside" style="width: ${op.progress_percent || op.progress}%;"></div>
                        </div>
                    </div>

                    <div class="needs-icons-area">
                        <p>أبرز الاحتياجات المفتوحة بالمسار</p>
                        <div class="icons-wrapper-flex">${iconsHTML}</div>
                    </div>

                    <button class="btn-view-details">عرض التفاصيل والمهام</button>
                </div>
            `;
            opsContainer.appendChild(card);
        });
    }

    // 3. محرك الفلترة والبحث المتقدم في الوقت الحقيقي (Real-time Filter)
    const searchInput = document.getElementById("searchOp");
    const regionSelect = document.getElementById("filterRegion");
    const statusSelect = document.getElementById("filterStatus");

    function filterData() {
        const searchText = searchInput.value.toLowerCase();
        const selectedRegion = regionSelect.value;
        const selectedStatus = statusSelect.value;

        const filtered = allOperations.filter(op => {
            const matchesSearch = op.title.toLowerCase().includes(searchText) || op.region.toLowerCase().includes(searchText);
            const matchesRegion = selectedRegion === "all" || op.region.includes(selectedRegion);
            const matchesStatus = selectedStatus === "all" || op.status === selectedStatus;

            return matchesSearch && matchesRegion && matchesStatus;
        });

        document.getElementById("ops-count-badge").textContent = filtered.length;
        renderOperationsGrid(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", filterData);
    if (regionSelect) regionSelect.addEventListener("change", filterData);
    if (statusSelect) statusSelect.addEventListener("change", filterData);

    // زر إعادة تعيين الفلاتر
    const btnReset = document.getElementById("btnReset");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            searchInput.value = "";
            regionSelect.value = "all";
            statusSelect.value = "all";
            document.getElementById("ops-count-badge").textContent = allOperations.length;
            renderOperationsGrid(allOperations);
        });
    }

    // دالات مساعدة ومترجمات للهوية البصرية
    function translateStatusToArabic(status) {
        switch (status) {
            case 'active': return 'نشطة';
            case 'in_progress': return 'قيد التنفيذ';
            case 'recent': return 'حديثة';
            case 'planned': return 'مخططة';
            default: return 'نشطة';
        }
    }

    function parseNeededIconsToEmoji(iconsString) {
        if (!iconsString) return "📦";
        const iconsMap = {
            water: "💧", electricity: "⚡", rubble: "🚜", food: "🍏",
            medical: "🩺", shelter: "🏠", education: "📚", solidarity: "🧺",
            livelihood: "🌾", tools: "🛠️", other: "📦"
        };
        return iconsString.split(',').map(item => `<span>${iconsMap[item.trim()] || "📦"}</span>`).join(' ');
    }

    // مصفوفة البيانات الافتراضية الـ 8 المطابقة تماماً لبطاقات الصورة المرفقة للاحتياط الجغرافي
    function getSampleOperationsFull() {
        return [
            { title: "استجابة بنت جبيل", region: "بنت جبيل", status: "active", progress: 65, description: "رفع الركام - تنظيف الطرق - إعادة تأهيل البنية التحتية - دعم الأسر المتضررة.", needed_icons: "rubble,tools,shelter" },
            { title: "استجابة عيترون", region: "عيترون", status: "active", progress: 50, description: "إزالة الأنقاض - إصلاح شبكات المياه - دعم الكهرباء - المأوى المؤقت.", needed_icons: "water,electricity,food,shelter" },
            { title: "استجابة الخيام", region: "الخيام", status: "active", progress: 40, description: "رفع الركام - دعم المزارعين - تأهيل المرافق الأساسية - توزيع مواد إغاثة.", needed_icons: "water,food,shelter,solidarity" },
            { title: "استجابة مرون الراس", region: "مرون الراس", status: "active", progress: 35, description: "فتح الطرقات - إصلاح شبكات المياه - دعم المدارس - خدمات صحية متنقلة.", needed_icons: "tools,medical,shelter,water" },
            { title: "استجابة دير ميماس", region: "دير ميماس", status: "in_progress", progress: 25, description: "إزالة الركام - دعم الطاقة البديلة - مساعدات غذائية - تأهيل المنازل.", needed_icons: "rubble,electricity,food,solidarity" },
            { title: "استجابة برج قلاويه", region: "برج قلاويه", status: "in_progress", progress: 20, description: "تأهيل شبكات المياه - دعم سبل العيش - خدمات إغاثة - أنشطة دعم نفسي.", needed_icons: "water,livelihood,shelter" },
            { title: "استجابة الناقورة", region: "الناقورة", status: "recent", progress: 10, description: "تقييم الأضرار - توزيع مساعدات عاجلة - تأمين احتياجات أولية.", needed_icons: "solidarity,medical,other" },
            { title: "استجابة حولا", region: "حولا", status: "planned", progress: 0, description: "تقييم الاحتياجات - تجهيز فرق الاستجابة - التخطيط للتدخل.", needed_icons: "tools,water,electricity,food" }
        ];
    }
});