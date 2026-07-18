// ============================================================
// ملف admin.js - لوحة التحكم الإدارية لمنصة أعزاء
// تم إعادة هيكلته بالكامل وتصحيح جميع الأخطاء
// ============================================================

// ===== المتغيرات العامة =====
let currentEditUserId = null;
let currentEditOperationId = null;
let currentEditCampId = null;
let currentEditNeedId = null;

let currentEditPledgeId = null;
let currentAllocatingPledgeId = null;
let currentEditOpportunityId = null;
let allVolunteersMemoryCache = [];  
let currentEditVolunteerId = null;
let currentEditNewsId = null;
// ===== الحدث الرئيسي عند تحميل الصفحة =====
document.addEventListener("DOMContentLoaded", () => {
    // 1. التحقق من صلاحية الجلسة وهوية المستخدم
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const userRegion = user.region || "";

    // عرض بيانات المستخدم
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.textContent = `${user.full_name} (${user.role_display})`;
    }

    const nameEl = document.getElementById('userInfoName');
    const roleEl = document.getElementById('userInfoRole');
    if (nameEl) nameEl.textContent = user.full_name;
    if (roleEl) roleEl.textContent = `💼 ${user.role_display} ${userRegion ? '• 📍 ' + userRegion : ''}`;

    // إعداد التاريخ
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString('ar-LB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 2. تطبيق نظام التحكم بالصلاحيات
    applyRoleBasedAccessControl(user.role_display, userRegion);

    // 3. تحميل البيانات الأساسية
    loadSubscribers();
    loadIncomingPledges();
    loadRegisteredVolunteers();
    loadIncomingContactMessages();
    loadSystemUsersList();
    loadLiveOperationsForProgressUpdate(user.role_display, userRegion);
    loadSystemCampsDashboardList();
    loadSystemOverviewStats();

    // 4. تعبئة قائمة العمليات في نموذج الاحتياج
    const needOpTarget = document.getElementById('needOpTarget');
    if (needOpTarget) {
        fetch('http://localhost:3000/api/operations')
            .then(res => res.json())
            .then(ops => {
                needOpTarget.innerHTML = '<option value="">عام للمبادرة (بدون ربط)</option>';
                ops.forEach(op => {
                    const opt = document.createElement('option');
                    opt.value = op.id;
                    opt.textContent = `${op.title} (📍 ${op.region})`;
                    needOpTarget.appendChild(opt);
                });
            }).catch(err => console.error("Error populating operations dropdown:", err));
    }

    // 5. التحكم بحقول النداء العاجل في الأخبار
    const newsCategorySelect = document.getElementById('newsCategory');
    const urgentFieldsWrapper = document.getElementById('urgentFieldsWrapper');
    if (newsCategorySelect && urgentFieldsWrapper) {
        newsCategorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'urgent_alert') {
                urgentFieldsWrapper.style.display = 'block';
            } else {
                urgentFieldsWrapper.style.display = 'none';
                const isUrgentBanner = document.getElementById('isUrgentBanner');
                const targetQty = document.getElementById('targetQty');
                const currentQty = document.getElementById('currentQty');
                if (isUrgentBanner) isUrgentBanner.checked = false;
                if (targetQty) targetQty.value = '';
                if (currentQty) currentQty.value = '';
            }
        });
    }

    // 6. إعداد جميع نماذج الإضافة والتعديل
    setupUserForm();
    setupStatsForms();
    setupOperationForm();
    setupCampForm();
    setupNeedForm();
    setupOpportunityForm();
    setupNewsForm();
    setupNewsletterForm();
    loadVolunteerOpportunitiesDashboardList();
    loadAdminNewsArchiveTableList()
});

// ============================================================
// === دوال إعداد النماذج ===
// ============================================================

// 6.1 نموذج المستخدمين
function setupUserForm() {
    const addUserForm = document.getElementById('addUserForm');
    if (!addUserForm) return;

    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            full_name: document.getElementById('newUserName').value.trim(),
            email: document.getElementById('newUserEmail').value.trim(),
            phone: document.getElementById('newUserPhone').value.trim() || null,
            role_id: parseInt(document.getElementById('newUserRole').value),
            region: document.getElementById('newUserRegion').value,
            password: document.getElementById('newUserPass').value
        };

        let url = 'http://localhost:3000/api/users';
        let method = 'POST';

        if (currentEditUserId !== null) {
            url = `http://localhost:3000/api/users/${currentEditUserId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                addUserForm.reset();
                currentEditUserId = null;
                const submitBtn = addUserForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'إضافة وتفعيل حساب المستخدم الجديد 🔑';
                    submitBtn.style.background = '#2980b9';
                }
                loadSystemUsersList();
            } else {
                alert(data.message || 'حدث خطأ أثناء معالجة طلب الحساب.');
            }
        } catch (err) {
            alert('خطأ في الاتصال بالسيرفر لمعالجة بيانات المستخدم.');
        }
    });
}

// 6.2 نماذج المؤشرات الإحصائية
function setupStatsForms() {
    // النموذج العام
    const statsGeneralForm = document.getElementById('statsGeneralForm');
    if (statsGeneralForm) {
        statsGeneralForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser.role_display !== 'مدير عام المنصة' && 
                currentUser.role_display !== '🛡️ مدير النظام' && 
                currentUser.role_display !== 'admin') {
                alert("⚠️ حظر صلاحيات: لا تمتلك الصلاحية الإدارية لتعديل المؤشرات التراكمية.");
                return;
            }

            const payload = {
                stat_key: document.getElementById('statKeyGeneral').value,
                stat_value: parseInt(document.getElementById('statValueGeneral').value)
            };

            const res = await fetch('http://localhost:3000/api/stats/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('تم تحديث مؤشر الأثر التراكمي العام ونشره بالمنصة بنجاح! 📈');
                statsGeneralForm.reset();
                loadSystemOverviewStats();
            }
        });
    }

    // النموذج اليومي
    const statsDailyForm = document.getElementById('statsDailyForm');
    if (statsDailyForm) {
        statsDailyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser.role_display !== 'مدير عام المنصة' && 
                currentUser.role_display !== '🛡️ مدير النظام' && 
                currentUser.role_display !== 'admin') {
                alert("⚠️ حظر صلاحيات: لا تمتلك الصلاحية الإدارية لتعديل المنجزات اليومية.");
                return;
            }

            const payload = {
                stat_key: document.getElementById('statKeyDaily').value,
                stat_value: parseInt(document.getElementById('statValueDaily').value)
            };

            const res = await fetch('http://localhost:3000/api/stats/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('تم حفظ منجز اليوم الميداني الحركي وتحديث الخريطة التفاعلية بنجاح! 🚀');
                statsDailyForm.reset();
                loadSystemOverviewStats();
            }
        });
    }
}

// 6.3 نموذج العمليات الميدانية
function setupOperationForm() {
    const opForm = document.getElementById('opForm');
    if (!opForm) return;

    opForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserRegion = currentUser.region || "";
        const selectedRegion = document.getElementById('opRegion').value;

        if (currentUser.role_display !== '🛡️ مدير النظام' && 
            currentUser.role_display !== '🏛️ الإدارة المركزية' && 
            currentUserRegion !== "عام" && currentUserRegion !== "") {
            if (selectedRegion !== currentUserRegion) {
                alert(`⚠️ حظر صلاحيات جغرافي: نطاق حسابك مخصص لقضاء (${currentUserRegion}) فقط. لا يمكنك إضافة/تعديل عمليات في (${selectedRegion}).`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('opTitle').value);
        formData.append('region', selectedRegion);
        formData.append('progress_percent', document.getElementById('opProgress').value);
        formData.append('allocated_budget', document.getElementById('opAllocatedBudget').value);
        formData.append('consumed_budget', document.getElementById('opConsumedBudget').value);
        formData.append('heavy_equipment', document.getElementById('opHeavyEquipment').value);
        if (document.getElementById('opImage').files[0]) {
            formData.append('operation_image', document.getElementById('opImage').files[0]);
        }

        let url = 'http://localhost:3000/api/admin/operations';
        let method = 'POST';

        if (currentEditOperationId !== null) {
            url = `http://localhost:3000/api/admin/operations/${currentEditOperationId}`;
            method = 'PUT';
        }

        const res = await fetch(url, { method: method, body: formData });
        const data = await res.json();
        if (res.ok && data.success) {
            alert(data.message);
            opForm.reset();
            currentEditOperationId = null;
            const submitBtn = opForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'حفظ ونشر مسار الاستجابة الجديد 🚀';
                submitBtn.style.background = 'var(--primary-color)';
            }
            loadLiveOperationsForProgressUpdate(currentUser.role_display, currentUserRegion);
            loadSystemOverviewStats();
        }
    });
}

// 6.4 نموذج المخيمات (مطور مع دعم التعديل)
function setupCampForm() {
    const campForm = document.getElementById('campForm');
    if (!campForm) return;

    campForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserRegion = currentUser.region || "";
        const campLocationValue = document.getElementById('campLocation').value.trim();

        // فحص الصلاحيات الجغرافية
        if (currentUser.role_display !== '🛡️ مدير النظام' && 
            currentUser.role_display !== 'Central Admin' && 
            currentUserRegion !== "عام" && currentUserRegion !== "") {
            if (!campLocationValue.includes(currentUserRegion)) {
                alert(`⚠️ حظر أمني جغرافي: صلاحية حسابك مخصصة لمنطقة (${currentUserRegion}) فقط.`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('campTitle').value.trim());
        formData.append('camp_type', document.getElementById('campType').value);
        formData.append('capacity', document.getElementById('campCapacity').value);
        formData.append('location', campLocationValue);
        formData.append('start_date', document.getElementById('campStart').value);
        formData.append('end_date', document.getElementById('campEnd').value);
        if (document.getElementById('campImage').files[0]) {
            formData.append('camp_image', document.getElementById('campImage').files[0]);
        }

        let url = 'http://localhost:3000/api/admin/camps';
        let method = 'POST';

        if (currentEditCampId !== null) {
            url = `http://localhost:3000/api/admin/camps/${currentEditCampId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, { method: method, body: formData });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                campForm.reset();
                currentEditCampId = null;
                const submitBtn = campForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'حفظ وجدولة المخيم الميداني فوراً ⛺';
                    submitBtn.style.background = 'var(--primary-color)';
                }
                loadSystemCampsDashboardList();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحفظ بيانات المخيم.");
        }
    });
}

// 6.5 نموذج الاحتياجات

// أ) إعادة صياغة معالج نموذج الاحتياج ليتولى الإضافة والتحديث وتمرير الكمية المستلمة
function setupNeedForm() {
    const addNeedForm = document.getElementById('addNeedForm');
    if (!addNeedForm) return;

    addNeedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            need_title: document.getElementById('needTitle').value.trim(),
            need_category: document.getElementById('needCategory').value,
            urgency_level: document.getElementById('urgencyLevel').value,
            required_quantity: parseInt(document.getElementById('reqQty').value),
            received_quantity: parseInt(document.getElementById('recQty').value), // حقل مطور حياً
            unit_name: document.getElementById('unitName').value.trim(),
            operation_id: document.getElementById('needOpTarget').value || null
        };

        let url = 'http://localhost:3000/api/admin/needs';
        let method = 'POST';

        if (currentEditNeedId !== null) {
            url = `http://localhost:3000/api/admin/needs/${currentEditNeedId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
            alert(data.message);
            addNeedForm.reset();
            currentEditNeedId = null;
            
            const submitBtn = addNeedForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'نشر وتعميم الاحتياج في صفحة التبرع حياً 🚀';
                submitBtn.style.background = 'var(--primary-color)';
            }
            loadOperationNeedsDashboardList(); // تحديث الجدول فوراً
            loadSystemOverviewStats(); // تحديث شاشة المراقبة الرئيسية
        }
    });
}

// ب) دالة استعراض وحساب شريط التقدم العيني حياً وإخفاء المكتمل آلياً
// ب) دالة استعراض وحساب شريط التقدم العيني حياً وإخفاء المكتمل آلياً بستايل نظيف
async function loadOperationNeedsDashboardList() {
    const tbody = document.getElementById('operationNeedsTableBody');
    if (!tbody) return;

    try {
        const res = await fetch('http://localhost:3000/api/donations/needs');
        if (res.ok) {
            const needs = await res.json();
            tbody.innerHTML = '';

            if (needs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد بنود احتياج مسجلة حالياً.</td></tr>`;
                return;
            }

            needs.forEach(n => {
                const req = parseInt(n.required_quantity || 1);
                const rec = parseInt(n.received_quantity || 0);
                const rem = req - rec >= 0 ? req - rec : 0;
                const percentage = Math.min(Math.round((rec / req) * 100), 100);

                const categoryMap = { material: '📦 مواد', logistic: '🚛 لوجستي', service: '🛠️ صيانة' };
                const urgencyMap = { urgent: '🚨 عاجل', medium: '🔸 مرتفع', casual: '🔹 متوسط' };

                // تحديد لون البار بناء على مستوى التقدم
                const barColor = percentage === 100 ? '#52c41a' : '#c19a4b';
                const textColor = percentage > 55 ? '#ffffff' : '#333333';

                tbody.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600;">
                            ${n.need_title}
                            <br><span style="font-size:0.75rem; color:#777; font-weight:normal;">🔗 مسار الربط: ${n.operation_title || 'عام للمبادرة'}</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600;">
                            ${categoryMap[n.need_category] || n.need_category} 
                            <span style="font-size:0.8rem; font-weight:normal; margin-right:5px;">[${urgencyMap[n.urgency_level] || n.urgency_level}]</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; vertical-align:middle; width:35%;">
                            <!-- شريط تقدم التمويل العيني المصحح هندسياً ومنعاً لتداخل الرموز -->
                            <div style="position:relative; background:#f0f0f0; border-radius:4px; height:24px; overflow:hidden; direction:ltr; text-align:left; box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
                                <div style="width:${percentage}%; height:100%; background-color:${barColor}; position:absolute; left:0; top:0; transition:width 0.5s ease;"></div>
                                <span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:0.75rem; font-weight:700; color:${textColor}; white-space:nowrap; z-index:2;">
                                    ${rec} مستلم / ${req} ${n.unit_name} (${percentage}%) - متبقي عاجل: ${rem}
                                </span>
                            </div>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                            <button onclick="editNeedLive(${n.id})" style="padding:3px 8px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer;">✏️</button>
                            <button onclick="deleteNeedLive(${n.id})" style="padding:3px 8px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer; margin-right:2px;">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error("Error loading operation needs layout table:", err);
    }
}

// ج) دالة تعديل البند وسحبه ديناميكياً للأعلى لملء حقول المعالج
async function editNeedLive(needId) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/needs/${needId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.need) {
                const n = data.need;

                document.getElementById('needTitle').value = n.need_title;
                document.getElementById('needCategory').value = n.need_category;
                document.getElementById('urgencyLevel').value = n.urgency_level;
                document.getElementById('reqQty').value = n.required_quantity;
                document.getElementById('recQty').value = n.received_quantity || 0;
                document.getElementById('unitName').value = n.unit_name;
                document.getElementById('needOpTarget').value = n.operation_id || '';

                currentEditNeedId = needId;
                const submitBtn = document.querySelector('#addNeedForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'تحديث وتأكيد بند الاحتياج الحالي 💾';
                    submitBtn.style.background = '#27ae60';
                }
                document.getElementById('addNeedForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error("Error loading need context for edit:", err);
    }
}

// د) دالة حذف البند عاجلاً من السيرفر الخلفي
async function deleteNeedLive(needId) {
    if (confirm("هل أنت متأكد من حذف وإلغاء تعميم بند الاحتياج هذا نهائياً من كشوفات المنصة؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/needs/${needId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                loadOperationNeedsDashboardList();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحذف البند.");
        }
    }
}


// 6.6 نموذج الفرص التطوعية
function setupOpportunityForm() {
    const addOpportunityForm = document.getElementById('addOpportunityForm');
    if (!addOpportunityForm) return;

    addOpportunityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            title: document.getElementById('oppTitle').value.trim(),
            region: document.getElementById('oppRegion').value.trim(),
            description: document.getElementById('oppDesc').value.trim(),
            required_specialty: document.getElementById('oppRequiredSpecialty').value, // شارة الفرز الفني المضافة
            required_count: parseInt(document.getElementById('oppReqCount').value),
            camp_type_display: document.getElementById('oppCampDisplay').value.trim(),
            work_time: document.getElementById('oppWorkTime').value.trim()
        };

        let url = 'http://localhost:3000/api/admin/volunteer/opportunities';
        let method = 'POST';

        if (currentEditOpportunityId !== null) {
            url = `http://localhost:3000/api/admin/volunteer/opportunities/${currentEditOpportunityId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                addOpportunityForm.reset();
                currentEditOpportunityId = null;

                const submitBtn = addOpportunityForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'تعميم ونشر الفرصة التطوعية المخصصة فوراً 🚀';
                    submitBtn.style.background = 'var(--primary-color)';
                }
                loadVolunteerOpportunitiesDashboardList(); // تحديث كشف جدول الفرص
                loadSystemOverviewStats(); // تحديث عدادات الواجهة الرئيسية
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لمعالجة النداء التطوعي.");
        }
    });
}
// ب) دالة استعراض الفرص وضخ شارات الفرز اللوني الفني (Skill Badges)
async function loadVolunteerOpportunitiesDashboardList() {
    const tbody = document.getElementById('volunteerOpportunitiesTableBody');
    if (!tbody) return;

    try {
        const res = await fetch('http://localhost:3000/api/volunteer/opportunities');
        if (res.ok) {
            const opps = await res.json();
            tbody.innerHTML = '';

            if (opps.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد نداءات فرص تطوعية منشورة حالياً.</td></tr>`;
                return;
            }

            opps.forEach(o => {
                // خريطة الشارات التخصصية اللوجستية واللونية
                const specialtyMap = {
                    none: { txt: '🟢 ميداني عام', bg: '#e6f7fd', col: '#1890ff' },
                    engineering: { txt: '📐 هندسة وتخطيط', bg: '#f6ffed', col: '#52c41a' },
                    electricity: { txt: '⚡ صيانة كهرباء', bg: '#fffbe6', col: '#d46b08' },
                    logistics: { txt: '📦 لوجستيات وإمداد', bg: '#e6fffb', col: '#13c2c2' },
                    materials: { txt: '🛠️ مواد فنية وترميم', bg: '#fff7e6', col: '#fa8c16' }
                };

                const badge = specialtyMap[o.required_specialty] || specialtyMap['none'];

                tbody.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600;">
                            ${o.title}
                            <br><span style="font-size:0.75rem; color:#666; font-weight:normal;">${o.description.substring(0, 80)}...</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600; color:#555;">
                            📍 ${o.region}
                            <br><span style="font-size:0.75rem; color:#888; font-weight:normal;">⏰ الموعد: ${o.work_time}</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; vertical-align:middle;">
                            <!-- حقن الشارة الملونة التفاعلية حركيّاً داخل الجدول -->
                            <span style="display:inline-block; font-size:0.75rem; font-weight:700; padding:4px 12px; border-radius:12px; background:${badge.bg}; color:${badge.col};">
                                ${badge.txt}
                            </span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; vertical-align:middle; width:20%;">
                            <span style="font-weight:700; color:var(--primary-color);">👥 ${o.current_count} / ${o.required_count} مبادر</span>
                            <br><div style="margin-top:5px; display:flex; justify-content:center; gap:3px;">
                                <button onclick="editOpportunityLive(${o.id})" style="padding:2px 6px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.72rem; font-weight:600; cursor:pointer;">✏️</button>
                                <button onclick="deleteOpportunityLive(${o.id})" style="padding:2px 6px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.72rem; font-weight:600; cursor:pointer;">🗑️</button>
                            </div>
                        </td>
                    </tr>`;
            });
        }
    } catch (err) {
        console.error("Error drawing opportunities dashboard list:", err);
    }
}
// ج) دالة سحب بيانات النداء لملء الاستمارة بالأعلى وإجراء التعديل الفوري
async function editOpportunityLive(oppId) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/volunteer/opportunities/${oppId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.opportunity) {
                const o = data.opportunity;

                document.getElementById('oppTitle').value = o.title;
                document.getElementById('oppDesc').value = o.description;
                document.getElementById('oppRegion').value = o.region;
                document.getElementById('oppRequiredSpecialty').value = o.required_specialty || 'none';
                document.getElementById('oppReqCount').value = o.required_count;
                document.getElementById('oppWorkTime').value = o.work_time;
                document.getElementById('oppCampDisplay').value = o.camp_type_display || 'تطوع ميداني';

                currentEditOpportunityId = oppId;
                const submitBtn = document.querySelector('#addOpportunityForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'تحديث وتأكيد نداء الفرصة التطوعية الحالية 💾';
                    submitBtn.style.background = '#27ae60';
                }
                document.getElementById('addOpportunityForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error("Error staging opportunity context for update:", err);
    }
}
/*
// د) دالة الحذف النهائي للفرصة والمستند التطوعي من المنصة
async function deleteOpportunityLive(oppId) {
    if (confirm("هل أنت متأكد من إلغاء وسحب هذا النداء الاستدعائي الميداني للمتطوعين نهائياً من اللوحة الإعلانية؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/volunteer/opportunities/${oppId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                loadVolunteerOpportunitiesDashboardList();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحذف الفرصة.");
        }
    }
}*/
// دالة الحذف النهائي للفرصة والمستند التطوعي (المصححة والمحدثة بالكامل)
async function deleteOpportunityLive(oppId) {
    if (confirm("هل أنت متأكد من إلغاء وسحب هذا النداء الاستدعائي الميداني للمتطوعين نهائياً من اللوحة الإعلانية؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/volunteer/opportunities/${oppId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                // تم مسح التداخل المطبعي المسبب للـ undefined وتثبيت الدالة بالشكل السليم
                loadVolunteerOpportunitiesDashboardList(); 
                loadSystemOverviewStats(); // تحديث عدادات الشاشة الرئيسية
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحذف الفرصة التطوعية.");
        }
    }
}
// 6.7 نموذج الأخبار
function setupNewsForm() {
    const addNewsForm = document.getElementById('addNewsForm');
    if (!addNewsForm) return;

    addNewsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addNewsForm);
        
        // ربط يدوي للحقول المتغيرة طردياً
        formData.set('title', document.getElementById('newsTitle').value);
        formData.set('content', document.getElementById('newsContent').value);
        formData.set('category', document.getElementById('newsCategory').value);
        formData.set('region', document.getElementById('newsRegion').value);
        formData.set('is_urgent_banner', document.getElementById('isUrgentBanner').checked ? 1 : 0);
        formData.set('target_quantity', document.getElementById('targetQty').value);
        formData.set('current_quantity', document.getElementById('currentQty').value);

        let url = 'http://localhost:3000/api/admin/news';
        let method = 'POST';

        if (currentEditNewsId !== null) {
            url = `http://localhost:3000/api/admin/news/${currentEditNewsId}`;
            method = 'PUT';
        }

        const res = await fetch(url, { method: method, body: formData });
        if (res.ok) {
            alert('تم حفظ ونشر التقرير الإخباري الميداني بنجاح! 🚀');
            addNewsForm.reset();
            currentEditNewsId = null;
            document.getElementById('newsFormHeaderTitle').textContent = '📰 نشر خبر أو نداء ميداني على المنصة';
            document.getElementById('newsSubmitBtn').textContent = 'نشر التحديث الإخباري الميداني الآن 🚀';
            document.getElementById('newsSubmitBtn').style.background = '#c19a4b';
            loadAdminNewsArchiveTableList();
            loadSystemOverviewStats();
        }
    });
}

// 6.8 نموذج النشرة البريدية
function setupNewsletterForm() {
    const sendNewsletterForm = document.getElementById('sendNewsletterForm');
    if (!sendNewsletterForm) return;

    sendNewsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري إرسال البريد الجماعي للمشتركين... ⏳';

        try {
            const res = await fetch('http://localhost:3000/api/admin/newsletter/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: document.getElementById('emailSubject').value,
                    messageContent: document.getElementById('emailContent').value
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                sendNewsletterForm.reset();
            }
        } catch (err) {
            alert('خطأ في الاتصال بالبريد السريع.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال النشرة إلى كافة المشتركين الآن 🚀';
        }
    });
}

// ============================================================
// === دوال تحميل وعرض البيانات ===
// ============================================================

// دالة جلب وتغذية عدادات الملخص العام
async function loadSystemOverviewStats() {
    try {
        // 1. المستخدمين
        const resUsers = await fetch('http://localhost:3000/api/users');
        if (resUsers.ok) {
            const users = await resUsers.json();
            const el = document.getElementById('overview-count-users');
            if (el) el.textContent = users.length;
        }

        // 2. العمليات
        const resOps = await fetch('http://localhost:3000/api/operations');
        if (resOps.ok) {
            const ops = await resOps.json();
            const el = document.getElementById('overview-count-ops');
            if (el) el.textContent = ops.length;
            const activeOpsCount = ops.filter(op => parseInt(op.progress_percent) < 100).length;
            const subBadge = document.getElementById('kpi-sub-ops-active');
            if (subBadge) subBadge.textContent = `🚜 ${activeOpsCount} مسارات ميدانية جارية الآن`;
        }

        // 3. المخيمات
        const resCamps = await fetch('http://localhost:3000/api/camps');
        if (resCamps.ok) {
            const camps = await resCamps.json();
            const el = document.getElementById('overview-count-camps');
            if (el) el.textContent = camps.length;
            const totalCapacity = camps.reduce((sum, camp) => sum + parseInt(camp.capacity || 0), 0);
            const subBadge = document.getElementById('kpi-sub-camps-capacity');
            if (subBadge) subBadge.textContent = `🎯 سعة استيعابية: ${totalCapacity} مقعداً`;
        }

        // 4. التبرعات
        const resPledges = await fetch('http://localhost:3000/api/admin/donations/pledges');
        if (resPledges.ok) {
            const pledges = await resPledges.json();
            const el = document.getElementById('overview-count-pledges');
            if (el) el.textContent = pledges.length;
            const pendingPledges = pledges.filter(p => p.pledge_status === 'pending').length;
            const subBadge = document.getElementById('kpi-sub-pledges-pending');
            if (subBadge) subBadge.textContent = `⏳ ${pendingPledges} تعهدات قيد المراجعة والتدقيق`;
        }

        // 5. المتطوعين
        const resVolunteers = await fetch('http://localhost:3000/api/admin/volunteers/list');
        if (resVolunteers.ok) {
            const volunteers = await resVolunteers.json();
            const el = document.getElementById('overview-count-volunteers');
            if (el) el.textContent = volunteers.length;
            const activeVolunteers = volunteers.filter(v => v.available_days && v.available_days.includes('أيام')).length;
            const subBadge = document.getElementById('kpi-sub-volunteers-active');
            if (subBadge) subBadge.textContent = `⚡ ${activeVolunteers || volunteers.length} مبادرين بجاهزية عالية`;
        }

        // 6. الرسائل
        const resMessages = await fetch('http://localhost:3000/api/contact/messages');
        if (resMessages.ok) {
            const messages = await resMessages.json();
            const el = document.getElementById('overview-count-messages');
            if (el) el.textContent = messages.length;
            const emergencyComplaints = messages.filter(m => m.msg_type === 'complaint').length;
            const subBadge = document.getElementById('kpi-sub-messages-complaints');
            if (subBadge) subBadge.textContent = `🚨 ${emergencyComplaints} بلاغات/شكاوى طارئة عاجلة`;
        }

        // 7. النداءات العاجلة
        const resNews = await fetch('http://localhost:3000/api/news');
        if (resNews.ok) {
            const newsArticles = await resNews.json();
            const urgentAlerts = newsArticles.filter(n => parseInt(n.is_urgent_banner) === 1);
            const tickerWrapper = document.getElementById('urgentLiveTickerWrapper');
            const tickerText = document.getElementById('urgentLiveMarqueeText');
            if (urgentAlerts.length > 0 && tickerWrapper && tickerText) {
                const marqueeContent = urgentAlerts.map(a => 
                    `[ 📍 النطاق الجغرافي: ${a.region} ] : ${a.title} - ${a.content.substring(0, 120)}...`
                ).join(' ⚠️ || ⚠️ ');
                tickerText.textContent = marqueeContent;
                tickerWrapper.style.display = 'flex';
            } else if (tickerWrapper) {
                tickerWrapper.style.display = 'none';
            }
        }

    } catch (err) {
        console.error("Error loading dashboard KPI stats:", err);
    }
}

// ===== دالة التحكم بالصلاحيات =====
function applyRoleBasedAccessControl(roleDisplay, userRegion) {
    if (roleDisplay === 'مدير عام المنصة' || 
        roleDisplay === '🛡️ مدير النظام' || 
        roleDisplay === '🏛️ الإدارة المركزية' || 
        roleDisplay === 'admin') {
        console.log("👑 تم منح صلاحيات الإدارة المطلقة لكافة الأقسام.");
        return;
    }

    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
    });

    if (userRegion) {
        console.log(`🔒 تم تفعيل نظام الفرز والحظر الجغرافي للمنطقة: ${userRegion}`);
    }
}

// ============================================================
// === دوال إدارة العمليات الميدانية ===
// ============================================================

async function loadLiveOperationsForProgressUpdate(userRole, userRegion) {
    const container = document.getElementById('liveOpsStatusContainer');
    if (!container) return;
    try {
        const res = await fetch('http://localhost:3000/api/operations');
        if (res.ok) {
            let ops = await res.json();
            container.innerHTML = '';

            if (userRole !== '🛡️ مدير النظام' && 
                userRole !== '🏛️ الإدارة المركزية' && 
                userRegion !== "عام" && userRegion !== "") {
                ops = ops.filter(op => op.region.includes(userRegion) || userRegion.includes(op.region));
            }

            if (ops.length === 0) {
                container.innerHTML = '<div style="font-size:0.85rem; color:#888; text-align:center; padding:15px; background:#fff; border:1px solid #eee;">لا يوجد مسارات عمل جارية ضمن نطاقك الجغرافي حالياً.</div>';
                return;
            }

            ops.forEach(op => {
                const remainingBudget = parseFloat(op.allocated_budget || 0) - parseFloat(op.consumed_budget || 0);
                container.innerHTML += `
                    <div style="background:#fff; border:1px solid #eef2f0; border-radius:6px; padding:15px; margin-bottom:12px; box-shadow:0 2px 4px rgba(0,0,0,0.01);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span style="font-weight:700; color:var(--primary-color); font-size:0.95rem;">📍 ${op.title} (${op.region})</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:0.85rem; font-weight:600;">نسبة الإنجاز الميداني:</span>
                                <input type="number" value="${op.progress_percent}" min="0" max="100" onchange="updateOpProgressLive(${op.id}, this.value)" style="width:55px; padding:4px; text-align:center; border:1px solid #ccc; border-radius:4px; font-weight:700;">
                                <span style="font-weight:700;">%</span>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#fafbfc; padding:10px; border-radius:4px; font-size:0.82rem; border:1px solid #f1f1f1; margin-bottom:10px;">
                            <div>💵 <b>الميزانية المرصودة:</b> <span style="color:#0E4736; font-weight:700;">$${op.allocated_budget || 0}</span></div>
                            <div>📉 <b>المستهلك حتى الآن:</b> <span style="color:#cf1322; font-weight:700;">$${op.consumed_budget || 0}</span></div>
                            <div>💰 <b>الرصيد المتبقي:</b> <span style="color:${remainingBudget >= 0 ? '#52c41a' : '#f5222d'}; font-weight:700;">$${remainingBudget}</span></div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:6px;">
                            <button onclick="showOperationDetailsLive(${op.id})" style="padding:4px 10px; background:#0E4736; color:#fff; border:none; border-radius:4px; font-family:'Cairo'; font-size:0.78rem; font-weight:600; cursor:pointer;">👁️ عرض التفاصيل</button>
                            <button onclick="editOperationLive(${op.id})" style="padding:4px 10px; background:#f39c12; color:#fff; border:none; border-radius:4px; font-family:'Cairo'; font-size:0.78rem; font-weight:600; cursor:pointer;">✏️ تعديل الإحصائيات</button>
                            <button onclick="deleteOperationLive(${op.id})" style="padding:4px 10px; background:#e74c3c; color:#fff; border:none; border-radius:4px; font-family:'Cairo'; font-size:0.78rem; font-weight:600; cursor:pointer;">🗑️ حذف المسار</button>
                        </div>
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error("Error loading operations progress list:", e);
    }
}

async function showOperationDetailsLive(opId) {
    try {
        const res = await fetch(`http://localhost:3000/api/operations/${opId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.operation) {
                const op = data.operation;
                document.getElementById('modalOpTitle').textContent = `🚜 تفاصيل مسار: ${op.title}`;
                document.getElementById('modalOpRegion').textContent = op.region;
                document.getElementById('modalOpProgress').textContent = `${op.progress_percent}%`;
                document.getElementById('modalOpAllocated').textContent = `$${op.allocated_budget || 0}`;
                document.getElementById('modalOpConsumed').textContent = `$${op.consumed_budget || 0}`;
                document.getElementById('modalOpEquipment').textContent = op.heavy_equipment || 'بدون معدات ثقيلة';
                document.getElementById('operationDetailsModal').style.display = 'block';
            }
        }
    } catch (err) {
        console.error("Error showing operations details modal:", err);
    }
}

function closeOperationModal() {
    document.getElementById('operationDetailsModal').style.display = 'none';
}

async function editOperationLive(opId) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRegion = currentUser.region || "";

    try {
        const res = await fetch(`http://localhost:3000/api/operations/${opId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.operation) {
                const op = data.operation;

                if (currentUser.role_display !== '🛡️ مدير النظام' && 
                    currentUser.role_display !== '🏛️ الإدارة المركزية' && 
                    currentUserRegion !== "عام" && currentUserRegion !== "") {
                    if (op.region !== currentUserRegion) {
                        alert(`⚠️ حظر صلاحيات: لا يمكنك تعديل مسارات عمل تقع خارج نطاق منطقتك المخصصة (${op.region}).`);
                        return;
                    }
                }

                document.getElementById('opTitle').value = op.title;
                document.getElementById('opRegion').value = op.region;
                document.getElementById('opProgress').value = op.progress_percent;
                document.getElementById('opAllocatedBudget').value = op.allocated_budget || 0;
                document.getElementById('opConsumedBudget').value = op.consumed_budget || 0;
                document.getElementById('opHeavyEquipment').value = op.heavy_equipment || 'بدون معدات ثقيلة';

                currentEditOperationId = opId;
                const submitBtn = document.querySelector('#opForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'تحديث وتأكيد بيانات المسار الحالي 💾';
                    submitBtn.style.background = '#27ae60';
                }
                document.getElementById('opForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error("Error staging operation edit context:", err);
    }
}

async function deleteOperationLive(opId) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRegion = currentUser.region || "";

    if (confirm("🚨 تنبيه: هل أنت متأكد من حذف مسار الاستجابة هذا نهائياً؟")) {
        try {
            const checkRes = await fetch(`http://localhost:3000/api/operations/${opId}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.success && checkData.operation) {
                    const op = checkData.operation;
                    if (currentUser.role_display !== '🛡️ مدير النظام' && 
                        currentUser.role_display !== '🏛️ الإدارة المركزية' && 
                        currentUserRegion !== "عام" && currentUserRegion !== "") {
                        if (op.region !== currentUserRegion) {
                            alert(`⚠️ حظر صلاحيات: لا يمكنك حذف مسارات عمل تقع خارج نطاق منطقتك المخصصة (${op.region}).`);
                            return;
                        }
                    }
                }
            }

            const res = await fetch(`http://localhost:3000/api/admin/operations/${opId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                loadLiveOperationsForProgressUpdate(currentUser.role_display, currentUserRegion);
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحذف مسار العمل.");
        }
    }
}

async function updateOpProgressLive(opId, nextVal) {
    try {
        await fetch('http://localhost:3000/api/admin/operations/progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: opId, progress_percent: parseInt(nextVal) })
        });
    } catch (e) {
        console.error("Error updating progress live:", e);
    }
}

// ============================================================
// === دوال إدارة المخيمات والمنتسبين ===
// ============================================================

async function loadSystemCampsDashboardList() {
    const tbody = document.getElementById('systemCampsTableBody');
    if (!tbody) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRegion = currentUser.region || "";

    try {
        const res = await fetch('http://localhost:3000/api/camps');
        if (res.ok) {
            let camps = await res.json();
            tbody.innerHTML = '';

            if (currentUser.role_display !== '🛡️ مدير النظام' && 
                currentUser.role_display !== 'Central Admin' && 
                currentUserRegion !== "عام" && currentUserRegion !== "") {
                camps = camps.filter(c => c.location.includes(currentUserRegion) || currentUserRegion.includes(c.location));
            }

            if (camps.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد مخيمات استجابة مجدولة في نطاقك حالياً.</td></tr>`;
                return;
            }

            camps.forEach(c => {
                const typeDisplay = c.camp_type === 'day' ? '🌞 نهاري' : '⛺ سكني كامل';
                tbody.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600;">${c.title}</td>
                        <td style="padding:10px; border:1px solid #ddd; color:#555;">📍 ${c.location}</td>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600; color:var(--primary-color);">${typeDisplay} <span style="font-size:0.8rem; color:#666;">[👥 ${c.capacity} فرد]</span></td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                            <button onclick="openCampRegistrantsModalLive(${c.id}, '${c.title.replace(/'/g, "\\'")}')" style="padding:3px 8px; background:#0E4736; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer;">🧑‍🤝‍🧑 إدارة المنتسبين</button>
                            <button onclick="editCampLive(${c.id})" style="padding:3px 8px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer; margin-right:3px;">✏️ تعديل</button>
                            <button onclick="deleteCampLive(${c.id})" style="padding:3px 8px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer; margin-right:3px;">🗑️ حذف</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error("Error loading camps list:", err);
    }
}

async function openCampRegistrantsModalLive(campId, campTitle) {
    const tbody = document.getElementById('campRegistrantsModalTableBody');
    if (!tbody) return;

    try {
        document.getElementById('modalCampTitle').textContent = `📋 إدارة طلبات المنتسبين لـ: ${campTitle}`;
        const res = await fetch(`http://localhost:3000/api/admin/camps/${campId}/registrants`);
        if (res.ok) {
            const data = await res.json();
            tbody.innerHTML = '';

            if (!data.success || data.registrants.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد طلبات انضمام مسجلة لهذا المخيم حتى الآن.</td></tr>`;
                document.getElementById('campRegistrantsModal').style.display = 'block';
                return;
            }

            data.registrants.forEach(r => {
                tbody.innerHTML += `
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd; font-weight:600;">${r.volunteer_name}</td>
                        <td style="padding:8px; border:1px solid #ddd; color:navy; font-weight:600; direction:ltr;">${r.volunteer_phone}</td>
                        <td style="padding:8px; border:1px solid #ddd; color:#444;">${r.volunteer_field || 'غير محدد'}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                            <select onchange="updateCampRegistrantStatusLive(${r.id}, this.value, '${r.volunteer_phone}', '${r.volunteer_name.replace(/'/g, "\\'")}', '${campTitle.replace(/'/g, "\\'")}')" style="padding:4px; font-family:'Cairo'; font-weight:700; border-radius:4px; border:1px solid #ccc; cursor:pointer; outline:none; background:#fffdf6;">
                                <option value="pending" ${r.registration_status === 'pending' ? 'selected' : ''}>⏳ قيد المراجعة</option>
                                <option value="accepted" ${r.registration_status === 'accepted' ? 'selected' : ''}>✅ مقبول</option>
                                <option value="rejected" ${r.registration_status === 'rejected' ? 'selected' : ''}>❌ مرفوض</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
            document.getElementById('campRegistrantsModal').style.display = 'block';
        }
    } catch (err) {
        console.error("Error opening camp registrants modal:", err);
    }
}

async function updateCampRegistrantStatusLive(registrantId, nextStatus, phone, name, campTitle) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/camps/registrants/${registrantId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration_status: nextStatus })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            let messageText = `تحية طيبة يا مبادر ${name}، بخصوص طلب انتسابك لمخيم (${campTitle})، نود إعلامك بأن طلبك أصبح: `;
            messageText += nextStatus === 'accepted' ? '✅ مقبول! يرجى الاستعداد للتجمع وانطلاق آليات الاستجابة الميدانية.' : '⏳ قيد التدقيق الإداري الإضافي وسيتم التواصل معك.';
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone.replace('+', '')}&text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, '_blank');
        }
    } catch (err) {
        console.error("Error updating registration status:", err);
    }
}

function closeCampRegistrantsModal() {
    document.getElementById('campRegistrantsModal').style.display = 'none';
}

async function editCampLive(campId) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/camps/${campId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.camp) {
                const c = data.camp;
                document.getElementById('campTitle').value = c.title;
                document.getElementById('campType').value = c.camp_type;
                document.getElementById('campCapacity').value = c.capacity;
                document.getElementById('campLocation').value = c.location;
                document.getElementById('campStart').value = c.start_date.slice(0, 10);
                document.getElementById('campEnd').value = c.end_date.slice(0, 10);

                currentEditCampId = campId;
                const submitBtn = document.querySelector('#campForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'تأكيد وحفظ بيانات المخيم الحالي 💾';
                    submitBtn.style.background = '#27ae60';
                }
                document.getElementById('campForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error("Error fetching camp for edit:", err);
    }
}

async function deleteCampLive(campId) {
    if (confirm("🚨 تحذير سيادي: هل أنت متأكد من إلغاء وحذف جدولة هذا المخيم بالكامل من المنصة؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/camps/${campId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                loadSystemCampsDashboardList();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لحذف المخيم الميداني.");
        }
    }
}

// ============================================================
// === دوال إدارة المستخدمين ===
// ============================================================

async function loadSystemUsersList() {
    const tbody = document.getElementById('systemUsersTableBody');
    if (!tbody) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRole = currentUser.role_display;
    const currentUserRegion = currentUser.region || "";

    try {
        const res = await fetch('http://localhost:3000/api/users');
        if (res.ok) {
            let users = await res.json();
            tbody.innerHTML = '';

            const roleMappingNew = {
                1: '🛡️ مدير النظام', 2: '🏛️ الإدارة المركزية', 3: '🗺️ منسق منطقة',
                4: '🌐 مسؤول قطاع', 5: '🏠 مسؤول بلدة أو حي', 6: '⛺ مدير مخيم',
                7: '📦 مسؤول لوجستي', 8: '🩺 مسؤول سلامة', 9: '👨‍✈️ قائد فريق',
                10: '🧑‍🤝‍🧑 مسؤول متطوعين', 11: '💰 مسؤول تبرعات', 12: '📢 مسؤول إعلام', 13: '📊 مدقق'
            };

            if (currentUserRole !== 'مدير عام المنصة' && currentUserRole !== '🛡️ مدير النظام' && currentUserRegion !== "") {
                users = users.filter(u => u.region === currentUserRegion);
            }

            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد حسابات كوادر مسجلة ضمن نطاقك الجغرافي حالياً.</td></tr>`;
                return;
            }

            users.forEach(u => {
                const displayRole = roleMappingNew[u.role_id] || u.role_display || 'مبادر عام';
                const displayRegion = u.region === 'عام' || !u.region ? '🌐 كل الساحات' : `📍 ${u.region}`;
                tbody.innerHTML += `
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd; font-weight:600; color:#333;">${u.full_name}</td>
                        <td style="padding:8px; border:1px solid #ddd; color:navy; font-weight:700;">${displayRole}</td>
                        <td style="padding:8px; border:1px solid #ddd; color:#c19a4b; font-weight:600;">${displayRegion}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                            <button onclick="editUserLive(${u.id})" style="padding:3px 8px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer; margin-left:4px;">✏️ تعديل</button>
                            <button onclick="deleteUserLive(${u.id})" style="padding:3px 8px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer;">🗑️ حذف</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        console.error("Error loading system users:", e);
    }
}

async function editUserLive(userId) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRole = currentUser.role_display;
    const currentUserRegion = currentUser.region || "";

    try {
        const res = await fetch(`http://localhost:3000/api/users/${userId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                const targetUser = data.user;

                if (currentUserRole !== 'مدير عام المنصة' && currentUserRole !== '🛡️ مدير النظام' && currentUserRegion !== "") {
                    if (targetUser.region !== currentUserRegion) {
                        alert(`⚠️ حظر أمني: لا تمتلك صلاحية تعديل بيانات هذا المستخدم لأنه يتبع لنطاق جغرافي آخر (${targetUser.region || 'عام'}).`);
                        return;
                    }
                }

                document.getElementById('newUserName').value = targetUser.full_name;
                document.getElementById('newUserEmail').value = targetUser.email;
                document.getElementById('newUserPhone').value = targetUser.phone || '';
                document.getElementById('newUserRole').value = targetUser.role_id;
                document.getElementById('newUserRegion').value = targetUser.region || 'عام';
                document.getElementById('newUserPass').value = targetUser.password_hash || '';

                currentEditUserId = userId;
                const formSubmitBtn = document.querySelector('#addUserForm button[type="submit"]');
                if (formSubmitBtn) {
                    formSubmitBtn.textContent = 'تحديث وحفظ بيانات الحساب الإقليمي الحالي 💾';
                    formSubmitBtn.style.background = '#27ae60';
                }
                document.getElementById('addUserForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error("Error fetching user for edit:", err);
    }
}

async function deleteUserLive(userId) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRole = currentUser.role_display;
    const currentUserRegion = currentUser.region || "";

    if (confirm("هل أنت متأكد من سحب صلاحيات الوصول وحذف هذا الحساب نهائياً من النظام؟")) {
        try {
            const userCheckRes = await fetch(`http://localhost:3000/api/users/${userId}`);
            if (userCheckRes.ok) {
                const checkData = await userCheckRes.json();
                if (checkData.success && checkData.user) {
                    const targetUser = checkData.user;
                    if (currentUserRole !== 'مدير عام المنصة' && currentUserRole !== '🛡️ مدير النظام' && currentUserRegion !== "") {
                        if (targetUser.region !== currentUserRegion) {
                            alert(`⚠️ حظر أمني: لا يمكنك حذف مستخدم خارج نطاق منطقتك المخصصة (${targetUser.region || 'عام'}).`);
                            return;
                        }
                    }
                }
            }

            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                loadSystemUsersList();
            } else {
                alert(data.message || "فشل عملية الحذف.");
            }
        } catch (err) {
            alert("خطأ في الاتصال بالخادم لحذف المستخدم.");
        }
    }
}

// ============================================================
// === دوال جلب البيانات الأخرى ===
// ============================================================

async function loadIncomingPledges() {
    const tableBody = document.getElementById('pledgesListTable');
    if (!tableBody) return;
    try {
        const res = await fetch('http://localhost:3000/api/admin/donations/pledges'); 
        if (res.ok) {
            const pledges = await res.json(); 
            tableBody.innerHTML = '';

            if (pledges.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">لا يوجد أي تعهدات مسجلة حالياً بالمنصة.</td></tr>`;
                return;
            }

            pledges.forEach(p => {
                const typeMap = { money: '💵 مادي', goods: '📦 عيني', service: '🚛 مورد/خدمة', partnership: '🏢 شراكة' };
                const donorTypeDisplay = p.donor_type === 'individual' ? '👤 أفراد' : '🏢 مؤسسة/جهة';
                
                // تحديد النمط البصري الملون بناء على حالة التعهد
                let statusBg = '#fff9e6';
                if(p.pledge_status === 'verified') statusBg = '#e6f7ff';
                if(p.pledge_status === 'received') statusBg = '#f6ffed';
                if(p.pledge_status === 'cancelled') statusBg = '#fff1f0';

                tableBody.innerHTML += `
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600;">
                            ${p.donor_name}
                            <br><span style="font-size:0.75rem; color:#666; font-weight:normal;">التصنيف: ${donorTypeDisplay}</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; font-weight:600; color:navy;">
                            ${p.donor_phone}
                            <br><span style="font-size:0.75rem; color:#888; font-weight:normal; direction:ltr;">${p.donor_email || 'بدون بريد'}</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd;">
                            <span style="font-weight:700; color:#0E4736;">${typeMap[p.donation_type] || p.donation_type}</span>
                            <br><span style="font-size:0.82rem; color:#555;">${p.amount_or_details}</span>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; vertical-align:middle;">
                            <!-- قائمة منسدلة ذكية تطلق الـ Smart Allocator بمجرد اختيار تم الاستلام -->
                            <select onchange="updatePledgeStatusLive(${p.id}, this.value, '${p.donor_name}')" style="padding:5px; font-family:'Cairo'; font-weight:700; border-radius:4px; cursor:pointer; background-color:${statusBg}; outline:none;">
                                <option value="pending" ${p.pledge_status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                                <option value="verified" ${p.pledge_status === 'verified' ? 'selected' : ''}>✅ مؤكد</option>
                                <option value="received" ${p.pledge_status === 'received' ? 'selected' : ''}>🟢 تم الاستلام</option>
                                <option value="cancelled" ${p.pledge_status === 'cancelled' ? 'selected' : ''}>❌ ملغي</option>
                            </select>
                        </td>
                        <td style="padding:10px; border:1px solid #ddd; text-align:center; vertical-align:middle;">
                            <button onclick="editPledgeLive(${p.id})" style="padding:3px 8px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer;">✏️</button>
                            <button onclick="deletePledgeLive(${p.id})" style="padding:3px 8px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer; margin-right:2px;">🗑️</button>
                        </td>
                    </tr>`;
            });
        }
    } catch (err) {
        console.error("Error loading pledges:", err);
    }
}

async function updatePledgeStatusLive(pledgeId, newStatus, donorName) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/donations/pledges/${pledgeId}/status`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pledge_status: newStatus })
        });
        const data = await response.json(); 
        if (response.ok && data.success) {
            
            // 🤖 خوارزمية الـ Smart Allocator: إذا تم الاستلام، نفتح معالج التوجيه الذكي فوراً[cite: 65]
            if (newStatus === 'received') {
                currentAllocatingPledgeId = pledgeId;
                document.getElementById('allocatorPromptText').innerHTML = `🤖 معالج ذكي: تم تسجيل مساهمة الداعم <b>( ${donorName} )</b> كشحنة مستلمة بنجاح ✅. يرجى اختيار بند الاحتياج الميداني المفتوح لإسناد وتوجيه التمويل إليه مباشرة[cite: 65]:`;
                
                // جلب قائمة بنود الاحتياج غير المكتملة لتغذية الخيارات حياً[cite: 65]
                const needsRes = await fetch('http://localhost:3000/api/donations/needs');
                if (needsRes.ok) {
                    const needs = await needsRes.json();
                    const select = document.getElementById('allocatorTargetNeedSelect');
                    select.innerHTML = '<option value="" disabled selected>اختر البند الميداني المستهدف...</option>';
                    
                    needs.forEach(n => {
                        const opt = document.createElement('option');
                        opt.value = n.id;
                        opt.textContent = `${n.need_title} [📍 مسار: ${n.operation_title || 'عام'}] - متبقي عاجل: ${parseInt(n.required_quantity) - parseInt(n.received_quantity)}`;
                        select.appendChild(opt);
                    });
                    
                    document.getElementById('smartAllocatorModal').style.display = 'block';
                }
            } else {
                alert('تم تحديث حالة تعهد التبرع والمساهمة بنجاح على النظام المنصي! 💾');
                loadIncomingPledges();
                loadSystemOverviewStats();
            }
        }
    } catch (err) {
        console.error("Error updating pledge status live:", err);
    }
}
// ج) دالة ربط وإسناد التدفق العيني ومزامنة العدادات الفرعية بالكامل[cite: 65]
const smartAllocatorForm = document.getElementById('smartAllocatorForm');
if(smartAllocatorForm) {
    smartAllocatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const needId = document.getElementById('allocatorTargetNeedSelect').value;
        const qtyToAdd = parseInt(document.getElementById('allocatorQtyToAdd').value);

        try {
            const res = await fetch(`http://localhost:3000/api/admin/needs/allocate_funding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ need_id: needId, quantity_to_add: qtyToAdd, pledge_id: currentAllocatingPledgeId })
            });
            const data = await res.json();
            if(res.ok && data.success) {
                alert(`🤖 تم الربط بنجاح! تم توجيه التمويل العيني واحتساب التقدم الإحصائي للبند الميداني بالكامل وتحديث الواجهات[cite: 65].`);
                closeAllocatorModal();
                loadIncomingPledges();
                loadSystemOverviewStats();
                if(typeof loadOperationNeedsDashboardList === 'function') loadOperationNeedsDashboardList(); // تحديث شريط التبويب 6
            }
        } catch (err) {
            alert("خطأ في الاتصال بالسيرفر لمعالجة الربط اللوجستي.");
        }
    });
}

function closeAllocatorModal() {
    document.getElementById('smartAllocatorModal').style.display = 'none';
    currentAllocatingPledgeId = null;
    loadIncomingPledges();
}

// د) دالات التعديل والحذف الكامل للتعهدات لإنهاء الـ CRUD المطور
function editPledgeLive(pledgeId) {
    fetch(`http://localhost:3000/api/admin/donations/pledgesCtx/${pledgeId}`)
        .then(res => res.json())
        .then(data => {
            if(data.success && data.pledge) {
                const p = data.pledge;
                document.getElementById('editDonorName').value = p.donor_name;
                document.getElementById('editDonorPhone').value = p.donor_phone;
                document.getElementById('editAmountDetails').value = p.amount_or_details;
                
                currentEditPledgeId = pledgeId;
                document.getElementById('editPledgeFormWrapper').style.display = 'block';
                document.getElementById('editPledgeFormWrapper').scrollIntoView({ behavior: 'smooth' });
            }
        });
}

const editPledgeForm = document.getElementById('editPledgeForm');
if(editPledgeForm) {
    editPledgeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            donor_name: document.getElementById('editDonorName').value.trim(),
            donor_phone: document.getElementById('editDonorPhone').value.trim(),
            amount_or_details: document.getElementById('editAmountDetails').value.trim()
        };

        const res = await fetch(`http://localhost:3000/api/admin/donations/pledges/${currentEditPledgeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            alert("تم تحديث وحفظ بيانات التعهد العيني بنجاح واكتمال! 💾");
            cancelPledgeEdit();
            loadIncomingPledges();
        }
    });
}

function cancelPledgeEdit() {
    document.getElementById('editPledgeFormWrapper').style.display = 'none';
    if(editPledgeForm) editPledgeForm.reset();
    currentEditPledgeId = null;
}

async function deletePledgeLive(pledgeId) {
    if(confirm("هل أنت متأكد من حذف وإلغاء هذا التعهد المالي/العيني نهائياً من سجلات الإدارة؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/donations/pledges/${pledgeId}`, { method: 'DELETE' });
            if(res.ok) {
                alert("تم حذف سجل التعهد بنجاح واكتمال! 🗑️");
                loadIncomingPledges();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ أثناء الاتصال بالخادم لحذف التعهد.");
        }
    }
}
async function loadRegisteredVolunteers() {
    const tableBody = document.getElementById('volunteersListTable');
    if (!tableBody) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserRegion = currentUser.region || "";

    try {
        const res = await fetch('http://localhost:3000/api/admin/volunteers/list');
        if (res.ok) {
            allVolunteersMemoryCache = await res.json();
            
            // 🔒 قفل الفرز الإقليمي التلقائي: منسق المنطقة يُقفل كشفه تلقائياً على نطاقه لمنع تسريب الكوادر
            if (currentUser.role_display !== 'مدير عام المنصة' && currentUser.role_display !== '🛡️ مدير النظام' && currentUserRegion !== "عام" && currentUserRegion !== "") {
                allVolunteersMemoryCache = allVolunteersMemoryCache.filter(v => v.region.includes(currentUserRegion) || currentUserRegion.includes(v.region));
                // إخفاء خيار تصفية المناطق لحصر المنسق ببلداته فقط
                const filterRegionSel = document.getElementById('filterVolunteerRegion');
                if(filterRegionSel) filterRegionSel.style.display = 'none';
            }

            // عرض وتصيير الكشف الأولي النظيف
            renderVolunteersTableGrid(allVolunteersMemoryCache);
        }
    } catch (err) {
        console.error("Error loading registered volunteers cache:", err);
    }
}

// ب) محرك تدوير وتصيير مصفوفة المتطوعين التفاعلية مع شارات المهارة اللوجستية
function renderVolunteersTableGrid(dataList) {
    const tableBody = document.getElementById('volunteersListTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">لا يوجد أي متطوعين يطابقون محددات الفلترة والتصفية الحالية.</td></tr>`;
        return;
    }

    dataList.forEach(v => {
        const specialtyMap = { 
            none: { txt: '🟢 عام الميدان', col: '#1890ff' }, 
            engineering: { txt: '📐 هندسة وتخطيط', col: '#52c41a' }, 
            electricity: { txt: '⚡ كهرباء شبكات', col: '#d46b08' }, 
            logistics: { txt: '📦 لوجستيات وإمداد', col: '#13c2c2' }, 
            materials: { txt: '🛠️ مواد وصيانة بيوت', col: '#fa8c16' } 
        };

        const badge = specialtyMap[v.specialty] || specialtyMap['none'];

        tableBody.innerHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight:600; color:#333;">${v.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color:navy; font-weight:600; direction:ltr; text-align:right;">${v.phone}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight:600; color:#555;">📍 ${v.region}</td>
                <td style="padding: 10px; border: 1px solid #ddd; vertical-align:middle;">
                    <span style="font-weight:700; color:${badge.col};">${v.field}</span> 
                    <span style="font-size:0.75rem; display:block; color:#777; font-weight:bold;">الشارة: ${badge.txt}</span>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; vertical-align:middle; width:20%;">
                    <span style="font-size:0.8rem; font-weight:700; color:#555;">${v.available_days || 'غير محدد'}</span>
                    <div style="margin-top:4px; display:flex; gap:3px;">
                        <button onclick="editVolunteerLive(${v.id})" style="padding:2px 5px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.7rem; font-weight:600; cursor:pointer;">✏️ مراجعة</button>
                        <button onclick="deleteVolunteerLive(${v.id})" style="padding:2px 5px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.7rem; font-weight:600; cursor:pointer;">🗑️ حذف</button>
                    </div>
                </td>
            </tr>`;
    });
}

// 🎯 ج) خوارزمية التصفية المتقدمة المتعددة اللحظية (Multi-Filter Engine) حياً بالذاكرة[cite: 67]
function filterVolunteersLive() {
    const regFilter = document.getElementById('filterVolunteerRegion').value;
    const specFilter = document.getElementById('filterVolunteerSpecialty').value;
    const daysFilter = document.getElementById('filterVolunteerDays').value;

    let filteredResult = [...allVolunteersMemoryCache];

    // 1. الفلترة المتقاطعة للنطاق الجغرافي
    if (regFilter) {
        filteredResult = filteredResult.filter(v => v.region.includes(regFilter));
    }
    // 2. الفلترة المتقاطعة لشارة المهارة الفنية
    if (specFilter) {
        filteredResult = filteredResult.filter(v => v.specialty === specFilter);
    }
    // 3. الفلترة المتقاطعة لأيام الإتاحة والتواجد التلقائي
    if (daysFilter) {
        filteredResult = filteredResult.filter(v => v.available_days && v.available_days.includes(daysFilter));
    }

    // ضخ مخرجات التصفية فورياً في الشبكة البصرية[cite: 67]
    renderVolunteersTableGrid(filteredResult);
}

function resetVolunteerFilters() {
    document.getElementById('filterVolunteerRegion').value = "";
    document.getElementById('filterVolunteerSpecialty').value = "";
    document.getElementById('filterVolunteerDays').value = "";
    renderVolunteersTableGrid(allVolunteersMemoryCache);
}

// د) دالات الـ CRUD الكاملة لتعديل وحذف سجلات مصفوفة المتطوعين الجدد من اللوحة
function editVolunteerLive(volId) {
    const targetVol = allVolunteersMemoryCache.find(v => v.id === volId);
    if(targetVol) {
        document.getElementById('editVolName').value = targetVol.name;
        document.getElementById('editVolPhone').value = targetVol.phone;
        document.getElementById('editVolRegion').value = targetVol.region;
        document.getElementById('editVolSpecialty').value = targetVol.specialty || 'none';
        
        currentEditVolunteerId = volId;
        document.getElementById('editVolunteerFormWrapper').style.display = 'block';
        document.getElementById('editVolunteerFormWrapper').scrollIntoView({ behavior: 'smooth' });
    }
}

// ربط استمارة تعديل المبادر وإرسال التحديث للسيرفر
const editVolunteerForm = document.getElementById('editVolunteerForm');
if(editVolunteerForm) {
    editVolunteerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('editVolName').value.trim(),
            phone: document.getElementById('editVolPhone').value.trim(),
            region: document.getElementById('editVolRegion').value.trim(),
            specialty: document.getElementById('editVolSpecialty').value
        };

        const res = await fetch(`http://localhost:3000/api/admin/volunteers/${currentEditVolunteerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(res.ok && data.success) {
            alert(data.message);
            cancelVolunteerEdit();
            loadRegisteredVolunteers(); // إعادة التحميل والكاش
        }
    });
}

function cancelVolunteerEdit() {
    document.getElementById('editVolunteerFormWrapper').style.display = 'none';
    if(editVolunteerForm) editVolunteerForm.reset();
    currentEditVolunteerId = null;
}

async function deleteVolunteerLive(volId) {
    if(confirm("هل أنت متأكد من حذف بيانات هذا المتطوع نهائياً وإلغاء قياس مهاراته من النظام الاستجابي؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/volunteers/${volId}`, { method: 'DELETE' });
            const data = await res.json();
            if(res.ok && data.success) {
                alert(data.message);
                loadRegisteredVolunteers();
                loadSystemOverviewStats();
            }
        } catch (err) {
            alert("خطأ أثناء الاتصال بالخادم لحذف سجل المبادر.");
        }
    }
}
async function loadIncomingContactMessages() {
    const tableBody = document.getElementById('contactMessagesListTable');
    if (!tableBody) return;
    try {
        const [msgsRes, usersRes] = await Promise.all([
            fetch('http://localhost:3000/api/contact/messages'),
            fetch('http://localhost:3000/api/users')
        ]);
        const messages = await msgsRes.json();
        const users = await usersRes.json();

        tableBody.innerHTML = messages.map(m => {
            const rowBg = (m.msg_type === 'complaint') ? 'style="background-color: #fff5f5;"' : '';
            return `
                <tr ${rowBg}>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.full_name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; direction:ltr;">${m.phone}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.msg_type}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.subject}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.message}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                        <select onchange="updateTicketStatus(${m.id}, this.value)">
                            <option value="new" ${m.status === 'new' ? 'selected' : ''}>🟢 جديدة</option>
                            <option value="processing" ${m.status === 'processing' ? 'selected' : ''}>🟡 قيد المتابعة</option>
                            <option value="resolved" ${m.status === 'resolved' ? 'selected' : ''}>🔒 تم الحل</option>
                        </select>
                    </td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                        <select onchange="assignTicket(${m.id}, this.value)">
                            <option value="">غير موجهة</option>
                            ${users.map(u => `<option value="${u.id}" ${m.assigned_to == u.id ? 'selected' : ''}>${u.full_name}</option>`).join('')}
                        </select>
                    </td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align:center;">
                        <button onclick="deleteMessage(${m.id})" style="background:#e74c3c; color:white; border:none; padding:2px 8px; cursor:pointer;">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) { console.error(err); }
}

// دالة تحديث حالة التذكرة مع إضافة معالجة للأخطاء
async function updateTicketStatus(id, status) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/contact/status/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('فشل تحديث الحالة');
        
        // إعادة تحميل القائمة لتحديث الألوان أو الحالات الظاهرة
        loadIncomingContactMessages(); 
    } catch (err) {
        console.error("Error updating ticket status:", err);
        alert("حدث خطأ أثناء تحديث حالة التذكرة.");
    }
}

// دالة توجيه المهمة
async function assignTicket(id, userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/contact/assign/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ assigned_to: userId })
        });
        
        if (response.ok) {
            alert("تم توجيه المهمة بنجاح.");
            loadIncomingContactMessages(); // يفضل إعادة التحميل لضمان تحديث الواجهة
        } else {
            throw new Error('فشل توجيه المهمة');
        }
    } catch (err) {
        console.error("Error assigning ticket:", err);
        alert("حدث خطأ أثناء توجيه المهمة.");
    }
}

// دالة حذف الرسالة
async function deleteMessage(id) {
    if(confirm("هل أنت متأكد من حذف هذه الرسالة نهائياً؟")) {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/contact/messages/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadIncomingContactMessages(); // تحديث الجدول فور الحذف
            } else {
                throw new Error('فشل الحذف');
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("حدث خطأ أثناء محاولة الحذف.");
        }
    }
}

// دالة جلب قائمة المشتركين مع عمود الإجراءات
async function loadSubscribers() {
    const tbody = document.getElementById('subscribersList');
    if (!tbody) return;
    try {
        const res = await fetch('http://localhost:3000/api/admin/newsletter/subscribers');
        if (res.ok) {
            const subscribers = await res.json();
            tbody.innerHTML = '';

            if (subscribers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">لا يوجد مشتركين حالياً.</td></tr>`;
                return;
            }

            subscribers.forEach(sub => {
                const date = new Date(sub.subscribed_at).toLocaleString('ar-LB');
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align:center;">${sub.id}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; font-weight:600; direction:ltr;">${sub.email}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align:center; font-size:0.75rem; color:#666;">${date}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align:center;">
                            <button onclick="deleteSubscriber(${sub.id})" style="padding:2px 10px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.75rem; font-weight:600; cursor:pointer;">
                                🗑️ حذف
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error("Error loading subscribers:", err);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:red;">خطأ في تحميل كشف المشتركين.</td></tr>`;
    }
}
// دالة حذف مشترك واحد
async function deleteSubscriber(id) {
    if(confirm("هل أنت متأكد من حذف هذا المشترك؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/newsletter/subscribers/${id}`, { method: 'DELETE' });
            if(res.ok) {
                alert("تم الحذف بنجاح");
                loadSubscribers();
            }
        } catch (err) { console.error(err); }
    }
}
// ============================================================
// === دالة تبديل التبويبات ===
// ============================================================

function switchAdminTab(event, tabId) {
    if (event) event.preventDefault();

    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active-tab');
        tab.style.display = 'none';
    });

    document.querySelectorAll('.sidebar .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active-tab');
        targetTab.style.display = 'block';
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ============================================================
// === دالة تسجيل الخروج ===
// ============================================================

function logoutUser() {
    if (confirm("هل أنت متأكد من تسجيل الخروج من لوحة التحكم؟")) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}



// أ) دالة أوامر محرر النصوص المتطور WYSIWYG الحركي[cite: 71]
function executeEditorCommand(command) {
    document.execCommand(command, false, null);
}

function insertLinkInEditor() {
    const url = prompt("يرجى إدخال الرابط المباشر المستهدف المستقر (URL):");
    if (url) document.execCommand("createLink", false, url);
}

function insertImageInEditor() {
    const url = prompt("يرجى إدخال الرابط المباشر للصورة المراد حقنها بداخل نص البريد (Image URL):");
    if (url) document.execCommand("insertImage", false, url);
}

// ب) إعادة هيكلة معالج رفع النشرات البريدية الجماعية وقراءة نص المحرر الغني HTML حياً[cite: 71]
function setupNewsletterForm() {
    const sendNewsletterForm = document.getElementById('sendNewsletterForm');
    if (!sendNewsletterForm) return;

    sendNewsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('sendNewsletterBtn');
        const richHtmlContent = document.getElementById('emailRichEditor').innerHTML; // قراءة أوساط الـ HTML للغرفة[cite: 71]

        if (!richHtmlContent.trim() || richHtmlContent === '<br>') {
            alert("⚠️ تنبيه لوجستي: لا يمكن إرسال بريد فارغ. يرجى صياغة نص النشرة أولاً.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري ضخ الإيميلات الغنية وإرسال البريد الجماعي... ⏳';

        try {
            const res = await fetch('http://localhost:3000/api/admin/newsletter/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: document.getElementById('emailSubject').value,
                    messageContent: richHtmlContent // ترحيل النص الغني للسيرفر[cite: 71]
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                sendNewsletterForm.reset();
                document.getElementById('emailRichEditor').innerHTML = ''; // تصفير المحرر
                loadSubscribers(); // إعادة قراءة العدادات وكفاءة السيرفر[cite: 71]
            }
        } catch (err) {
            alert('خطأ في الاتصال بسيرفر المراسلات السريعة.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال النشرة إلى كافة المشتركين آليّاً 🚀';
        }
    });
}

// ج) دالة جلب قائمة المشتركين بالداتابيز المحدثة بعواميد الكفاءة والرسائل الناجحة والفاشلة[cite: 71]


// د) دالة الـ CRUD الكاملة: جلب التقارير المنشورة بالأرشيف وتفعيل الحذف والتعديل المكتمل
async function loadAdminNewsArchiveTableList() {
    const tbody = document.getElementById('adminNewsArchiveTableBody');
    if (!tbody) return;
    try {
        const res = await fetch('http://localhost:3000/api/news');
        if (res.ok) {
            const news = await res.json();
            tbody.innerHTML = '';
            
            news.forEach(n => {
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 6px; border: 1px solid #ddd; font-weight:600;">${n.title.substring(0, 35)}...</td>
                        <td style="padding: 6px; border: 1px solid #ddd; color:#c19a4b; font-weight:700;">📍 ${n.region}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align:center;">
                            <button onclick="editNewsArticleLive(${n.id})" style="padding:2px 5px; background:#f39c12; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.7rem; font-weight:600; cursor:pointer;">✏️</button>
                            <button onclick="deleteNewsArticleLive(${n.id})" style="padding:2px 5px; background:#e74c3c; color:#fff; border:none; border-radius:3px; font-family:'Cairo'; font-size:0.7rem; font-weight:600; cursor:pointer;">🗑️</button>
                        </td>
                    </tr>`;
            });
        }
    } catch (err) { console.error(err); }
}

// هـ) سحب بيانات الخبر لجدول النموذج وتعديل السلوك التفاعلي للزر
async function editNewsArticleLive(newsId) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/news/${newsId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.article) {
                const n = data.article;
                
                document.getElementById('newsTitle').value = n.title;
                document.getElementById('newsCategory').value = n.category;
                document.getElementById('newsRegion').value = n.region;
                document.getElementById('newsContent').value = n.content;
                document.getElementById('isUrgentBanner').checked = parseInt(n.is_urgent_banner) === 1;
                document.getElementById('targetQty').value = n.target_quantity || '';
                document.getElementById('currentQty').value = n.current_quantity || '';
                
                if (n.category === 'urgent_alert' && document.getElementById('urgentFieldsWrapper')) {
                    document.getElementById('urgentFieldsWrapper').style.display = 'block';
                }

                currentEditNewsId = newsId;
                document.getElementById('newsFormHeaderTitle').textContent = '✏️ تعديل ومراجعة التقرير الإخباري المنشور';
                document.getElementById('newsSubmitBtn').textContent = 'تحديث وتأكيد بيانات التقرير الحالي 💾';
                document.getElementById('newsSubmitBtn').style.background = '#27ae60';
                document.getElementById('addNewsForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) { console.error(err); }
}


async function deleteNewsArticleLive(newsId) {
    if(confirm("هل أنت متأكد من سحب وحذف هذا الخبر/التقرير نهائياً من أرشيف المنصة والموقع؟")) {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/news/${newsId}`, { method: 'DELETE' });
            if(res.ok) {
                alert("تم حذف سجل المقال الإخباري بنجاح! 🗑️");
                loadAdminNewsArchiveTableList();
                loadSystemOverviewStats();
            }
        } catch (err) { console.error(err); }
    }
}
