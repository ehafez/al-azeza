document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    let allArticles = []; 

    // الحاويات الرئيسية
    const newsFeedContainer = document.getElementById("newsFeedContainer");
    const timelineContainer = document.getElementById("timelineContainer");
    const searchInput = document.getElementById("searchNewsInput");
    const regionSelect = document.getElementById("filterRegionSelect");
    const btnReset = document.getElementById("btnResetNewsFilters");
    const newsletterForm = document.getElementById("newsNewsletterForm");
    const btnViewAllTimeline = document.querySelector(".btn-view-all-timeline");

    let selectedCategory = "all";

    // 1. جلب نداء الطوارئ والأخبار
    fetch(`${API_BASE_URL}/news`)
        .then(res => res.json())
        .then(articles => {
            allArticles = articles.length === 0 ? getSampleNewsFallback() : articles;
            renderNewsFeed(allArticles);
            
            const urgentBanner = allArticles.find(a => parseInt(a.is_urgent_banner) === 1);
            if (urgentBanner) {
                document.getElementById("urgentAlertBar").style.display = "block";
                document.getElementById("urgentTitle").textContent = urgentBanner.title;
                const target = urgentBanner.target_quantity || 1000;
                const current = urgentBanner.current_quantity || 420;
                const remaining = target - current;
                const percent = Math.min((current / target) * 100, 100);

                document.getElementById("urgentRemaining").textContent = `${remaining.toLocaleString()} كف`;
                document.getElementById("urgentTarget").textContent = `${target.toLocaleString()} كف`;
                document.getElementById("urgentFillBar").style.width = `${percent}%`;
            }
        })
        .catch(() => {
            allArticles = getSampleNewsFallback();
            renderNewsFeed(allArticles);
        });

    // 2. جلب التحديثات السريعة (Timeline)
    if (timelineContainer) {
        fetch(`${API_BASE_URL}/news/timeline`)
            .then(res => res.json())
            .then(updates => {
                const list = updates.length === 0 ? getSampleTimelineFallback() : updates;
                renderTimeline(list);
            })
            .catch(() => renderTimeline(getSampleTimelineFallback()));
    }

    function renderTimeline(data) {
        timelineContainer.innerHTML = "";
        data.forEach(item => {
            const row = document.createElement("div");
            row.className = "timeline-row-item";
            row.innerHTML = `
                <span class="time-stamp-label">منذ ${item.hours_ago} ساعة</span>
                <p>${item.update_text}</p>
            `;
            timelineContainer.appendChild(row);
        });
    }

    // 3. دالة بناء كروت الأخبار
    function renderNewsFeed(data) {
        if (!newsFeedContainer) return;
        newsFeedContainer.innerHTML = "";
        if (data.length === 0) {
            newsFeedContainer.innerHTML = `<div style="grid-column:span 3; text-align:center; padding:40px; color:#888; font-weight:600;">لا يوجد أخبار مطابقة.</div>`;
            return;
        }

        data.forEach(n => {
            const card = document.createElement("div");
            card.className = "news-main-card";
            const catLabel = translateCategory(n.category);
            const dateStr = new Date(n.created_at || Date.now()).toLocaleDateString('ar-LB', { day: 'numeric', month: 'long' });

            card.innerHTML = `
                <div class="news-card-img" style="background-image: url('${n.image_path || '/picture/default_news.jpg'}');">
                    <span class="news-cat-badge ${'cat-' + n.category}">${catLabel}</span>
                </div>
                <div class="news-card-body">
                    <div class="news-meta-row"><span>📅 ${dateStr}</span><span>📍 ${n.region}</span></div>
                    <h4>${n.title}</h4>
                    <p class="news-excerpt">${n.content.substring(0, 110)}...</p>
                    <button class="btn-read-more" data-full-content="${n.content.replace(/"/g, '&quot;')}">اقرأ المزيد ←</button>
                </div>
            `;
            newsFeedContainer.appendChild(card);
        });
    }

    // 4. الفلاتر والبحث
    function runCombinedFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const region = regionSelect ? regionSelect.value : "all";

        const filtered = allArticles.filter(art => {
            const matchesSearch = art.title.toLowerCase().includes(query) || art.content.toLowerCase().includes(query);
            const matchesRegion = region === "all" || art.region.includes(region);
            const matchesCat = selectedCategory === "all" || art.category === selectedCategory;
            return matchesSearch && matchesRegion && matchesCat;
        });
        renderNewsFeed(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", runCombinedFilters);
    if (regionSelect) regionSelect.addEventListener("change", runCombinedFilters);

    // 5. التفاعلات (أزرار التبويبات، إعادة التعيين، التايم لاين، اقرأ المزيد)
    document.querySelectorAll(".categories-tabs-scroll .tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".categories-tabs-scroll .tab-btn").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            selectedCategory = e.target.dataset.category;
            runCombinedFilters();
        });
    });

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if(searchInput) searchInput.value = "";
            if(regionSelect) regionSelect.value = "all";
            selectedCategory = "all";
            document.querySelectorAll(".categories-tabs-scroll .tab-btn").forEach(t => t.classList.remove("active"));
            document.querySelector('.categories-tabs-scroll [data-category="all"]').classList.add("active");
            renderNewsFeed(allArticles);
        });
    }

    if (btnViewAllTimeline) {
        btnViewAllTimeline.addEventListener("click", () => {
            if(timelineContainer) timelineContainer.style.maxHeight = "none";
            btnViewAllTimeline.style.display = "none";
        });
    }

    if (newsFeedContainer) {
        newsFeedContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-read-more")) {
        const fullContent = e.target.getAttribute("data-full-content");
        const card = e.target.closest(".news-main-card");
        card.querySelector(".news-excerpt").innerText = fullContent;
        e.target.style.display = "none"; // إخفاء الزر بعد العرض
    }
});
    }

    // 6. النشرة البريدية
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("newsNewsletterInput").value.trim();
            const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            alert(data.message);
            if(res.ok) newsletterForm.reset();
        });
    }

    // دوال مساعدة
    function translateCategory(cat) {
        const mapping = {
            news: 'كل الأخبار', urgent_alert: 'نداء عاجل', field_update: 'تحديث ميداني',
            new_operation: 'عملية جديدة', aid_delivery: 'وصول مساعدات',
            partnership: 'شراكة ودعم', report: 'تقرير مختصر'
        };
        return mapping[cat] || 'تحديث';
    }

    function getSampleNewsFallback() {
        return [
            { id: 1, title: "نحتاج إلى 1,000 كف حماية لفرق رفع الركام في بنت جبيل بشكل عاجل-", content: "تأمين سلامة المتطوعين والفرق الميدانية العاملة على فتح الطرقات وإزالة الأنقاض في أحياء بلدة بنت جبيل المتضررة.", category: "urgent_alert", region: "بنت جبيل", image_path: "/picture/2.jpg", is_urgent_banner: 1, target_quantity: 1000, current_quantity: 420 },
            { id: 2, title: "استمرار أعمال رفع الركام وفتح الطرق الفرعية في بنت جبيل.", content: "تواصل فرق الاستجابة الميدانية التابعة للمبادرة جرف الأنقاض وفتح الشوارع الداخلية لتسهيل حركة الأهالي.", category: "field_update", region: "بنت جبيل", image_path: "/picture/1.jpg", is_urgent_banner: 0 },
            { id: 3, title: "وصول شحنة مواد نظافة وأدوات حماية شخصية إلى مستودع صور.", content: "تسلم القسم اللوجستي شحنة عينية جديدة مقدمة من الشركاء لدعم العائلات والفرق العاملة في القرى المحيطة.", category: "aid_delivery", region: "صور", image_path: "/picture/2.jpg", is_urgent_banner: 0 },
            { id: 4, title: "شراكة جديدة مع جمعية الإغاثة الإسلامية لدعم مسار المياه في عيترون.", content: "توقيع اتفاقية تعاون ميداني لربط وصيانة خطوط الضخ المتضررة وتأمين شبكة توزيع مياه صالحة للشرب.", category: "partnership", region: "بيروت", image_path: "/picture/1.jpg", is_urgent_banner: 0 }
        ];
    }

    function getSampleTimelineFallback() {
        return [
            { id: 1, update_text: "توزيع 120 رزمة نظافة في عيترون.", hours_ago: 2 },
            { id: 2, update_text: "أعمال تنظيف في محيط مركز الإيواء - المدرسة الرسمية - الخيام.", hours_ago: 5 },
            { id: 3, update_text: "تأمين 350 كف حماية لفرق العمل.", hours_ago: 9 },
            { id: 4, update_text: "إصلاح تمديد مياه فرعي في عيترون.", hours_ago: 12 }
        ];
    }
});