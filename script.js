document.addEventListener('DOMContentLoaded', function () {
    
    // 1. إدارة التنقلات الأساسية من الصفحة الرئيسية
    const volunteerBtn = document.getElementById('btn-volunteer');
    const needHelpBtn = document.getElementById('btn-need-help');

    if (volunteerBtn) {
        volunteerBtn.addEventListener('click', function () {
            window.location.href = 'volunteer.html';
        });
    }

    if (needHelpBtn) {
        needHelpBtn.addEventListener('click', function () {
            window.location.href = 'help.html';
        });
    }

    // 2. ربط الكروت والأقسام في الصفحة الرئيسية بملفاتها الجديدة لسهولة التصفح للداخل والخارج
    // تصفح التعاميم والموجهات العامة
    const bulletinCard = document.querySelector('.fa-bullhorn')?.closest('.luxury-card');
    if (bulletinCard) {
        bulletinCard.style.cursor = 'pointer';
        bulletinCard.addEventListener('click', function() {
            window.location.href = 'bulletins.html';
        });
    }

    // تصفح الأنشطة ومجالات الاستفادة
    const activityCard = document.querySelector('.fa-handshake-angle')?.closest('.luxury-card');
    if (activityCard) {
        activityCard.style.cursor = 'pointer';
        activityCard.addEventListener('click', function() {
            window.location.href = 'activities.html';
        });
    }

    // تصفح خرائط العمل الجغرافي من كرت الخريطة الأساسي
    const mapCard = document.querySelector('.mock-map-container')?.closest('.luxury-card');
    if (mapCard) {
        mapCard.style.cursor = 'pointer';
        mapCard.addEventListener('click', function() {
            window.location.href = 'maps.html';
        });
    }

    // تصفح طبيعة المتطوعين وفرز الداخل والخارج
    const volunteerRadarCard = document.querySelector('.fa-users-gear')?.closest('.luxury-card');
    if (volunteerRadarCard) {
        volunteerRadarCard.style.cursor = 'pointer';
        volunteerRadarCard.addEventListener('click', function() {
            window.location.href = 'activities.html';
        });
    }

    // 3. محاكاة إرسال استمارة الانتساب والتطوع للخدمات
    const formVolunteer = document.getElementById('form-volunteer-submit');
    if (formVolunteer) {
        formVolunteer.addEventListener('submit', function (e) {
            e.preventDefault();
            const selectedField = document.getElementById('vField').value;
            let fieldName = "ميداني";
            if(selectedField === "media") fieldName = "إعلامي";
            if(selectedField === "medical") fieldName = "صحي";
            if(selectedField === "psychological") fieldName = "دعم نفسي";
            
            alert('شكرًا لك وعظّم الله عطاءك! تم تسجيل طلب الانتساب وتطوعك في القطاع الـ (' + fieldName + ') وسرّية تامة ومحاكاة ناجحة بنسبة 100%.');
            window.location.href = 'index.html';
        });
    }

    // 4. محاكاة إرسال استمارة طالبي الدعم
    const formHelp = document.getElementById('form-help-submit');
    if (formHelp) {
        formHelp.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('أهلنا الأعزاء، تم حفظ طلبكم بكرامة وسرية تامة وجاري مطابقته مع المتطوعين والخدمات اللوجستية المتاحة.');
            window.location.href = 'index.html';
        });
    }
});