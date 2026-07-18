document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";

    // 1. تفعيل الإحصائيات الحية ومؤشرات الأثر التراكمي واليومي
    fetch(`${API_BASE_URL}/stats`)
        .then(res => res.json())
        .then(stats => {
            if (stats) {
                document.getElementById("stat-hours").textContent = Number(stats.total_volunteer_hours || 0).toLocaleString();
                
                // دالة فرض الأرقام لضمان عرض خانات النطاق الجغرافي بالأرقام العربية المعتمدة
                function formatArabicNumbers(num) {
                    return num.toString().replace(/\d/g, d => '0123456789'[d]);
                }
                document.getElementById("stat-regions").textContent = formatArabicNumbers(stats.total_regions || 0);
                
                document.getElementById("stat-beneficiaries").textContent = Number(stats.total_beneficiaries || 0).toLocaleString();
                document.getElementById("stat-aid").textContent = Number(stats.total_aid_packages || 0).toLocaleString();
                document.getElementById("stat-volunteers").textContent = Number(stats.total_volunteers || 0).toLocaleString();
                
                // منجز اليوم الميداني الحركي الخاضع للتصفير التلقائي
                document.getElementById("daily-families").textContent = Number(stats.daily_families || 0).toLocaleString();
                document.getElementById("daily-meals").textContent = Number(stats.daily_meals || 0).toLocaleString();
                document.getElementById("daily-packages").textContent = Number(stats.daily_packages || 0).toLocaleString();
                document.getElementById("daily-sessions").textContent = Number(stats.daily_sessions || 0).toLocaleString();
            }
        })
        .catch(err => console.error("Error loading stats:", err));

    // 2. تفعيل كروت المخيمات وعرض أول 3 مخيمات نشطة كمعاينة سريعة بالرئيسية
    const campsGrid = document.getElementById("camps-dynamic-grid");
    if (campsGrid) {
        fetch(`${API_BASE_URL}/camps`)
            .then(res => res.json())
            .then(camps => {
                campsGrid.innerHTML = "";
                // فرز المخيمات النشطة واقتطاع أول 3 فقط للعرض المتناسق
                const activeCamps = camps.filter(c => parseInt(c.is_active) === 1).slice(0, 3);
                
                if (activeCamps.length === 0) {
                    campsGrid.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 20px; color: #888;">لا يوجد مخيمات استجابة نشطة حالياً.</div>`;
                    return;
                }

                activeCamps.forEach(c => {
                    const card = document.createElement("div");
                    card.className = "camp-card";
                    card.innerHTML = `
                        <div class="card-image" style="background-image: url('${c.image_path || 'default_camp.jpg'}'); height: 170px; background-size: cover; background-position: center; position: relative;">
                            <span class="badge ${c.camp_type === 'day' ? 'tag-green' : 'tag-blue'}">
                                ${c.camp_type === 'day' ? 'مخيم نهاري' : 'مخيم سكني'}
                            </span>
                        </div>
                        <div class="card-body" style="padding:15px;">
                            <h3 style="color:var(--primary-color); font-size:1.15rem; margin-bottom:8px; font-weight:700;">${c.title}</h3>
                            <p class="location" style="color:var(--secondary-color); font-weight:600; font-size:0.85rem; margin-bottom:12px;">📍 ${c.location}</p>
                            <div class="meta-info" style="font-size:0.8rem; color:var(--text-light); line-height:1.7; margin-bottom:15px;">
                                🎯 الطاقة الاستيعابية: ${c.capacity} مقعداً
                            </div>
                            <div class="card-actions" style="display:flex; gap:8px;">
                                <!-- التوجيه البرمجي المصلح ليفتح صفحة camps.html المخصصة لإدارة المنتسبين بالداتابيز -->
                                <button onclick="window.location.href='camps.html'" class="btn-action join" style="flex:1; padding:8px; background:var(--primary-color); color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:'Cairo'; font-weight:700;">استعراض وانضمام</button>
                                <button onclick="window.location.href='donate.html?camp_id=${c.id}'" class="btn-action support" style="flex:1; padding:8px; background:#fff; color:var(--secondary-color); border:1px solid var(--secondary-color); border-radius:4px; cursor:pointer; font-family:'Cairo'; font-weight:700;">ادعم</button>
                            </div>
                        </div>`;
                    campsGrid.appendChild(card);
                });
            })
            .catch(err => console.error("Error loading database camps context:", err));
    }

    // 3. تفعيل كروت الأخبار والتقارير الميدانية الجارية من الداتابيز
    const newsGrid = document.getElementById("news-dynamic-grid");
    if (newsGrid) {
        fetch(`${API_BASE_URL}/news`)
            .then(res => res.json())
            .then(news => {
                newsGrid.innerHTML = "";
                news.slice(0, 4).forEach(n => {
                    const card = document.createElement("div");
                    card.className = "news-card";
                    card.innerHTML = `
                        <div class="news-img" style="background-image: url('${n.image_path || '/picture/default_news.jpg'}');"></div>
                        <div class="news-body">
                            <h4>${n.title}</h4>
                            <span class="news-date">📅 ${new Date(n.created_at).toLocaleDateString('ar-LB')}</span>
                        </div>`;
                    newsGrid.appendChild(card);
                });
            })
            .catch(err => console.error("Error loading database news feed:", err));
    }

    // 4. تفعيل نموذج المراسلة الفورية والاشتراك الموثق بالنشرة البريدية
    const subscribeBtn = document.querySelector(".btn-subscribe");
    if (subscribeBtn) {
        subscribeBtn.addEventListener("click", async () => {
            const inputEl = document.querySelector(".newsletter-input");
            const email = inputEl ? inputEl.value.trim() : "";

            if (!email) {
                alert("يرجى إدخال عنوان البريد الإلكتروني أولاً.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                alert(data.message);
                if (res.ok && inputEl) inputEl.value = "";
            } catch (err) {
                console.error("Newsletter error connection:", err);
            }
        });
    }
});