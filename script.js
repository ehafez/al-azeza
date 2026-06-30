document.addEventListener('DOMContentLoaded', function () {
    
    // 1. إدارة التنقل في الصفحة الرئيسية
    const volunteerBtn = document.getElementById('btn-volunteer');
    const needHelpBtn = document.getElementById('btn-need-help');

    if (volunteerBtn) {
        volunteerBtn.addEventListener('click', function () {
            // الانتقال لصفحة استمارة المتطوعين
            window.location.href = 'volunteer.html';
        });
    }

    if (needHelpBtn) {
        needHelpBtn.addEventListener('click', function () {
            // الانتقال لصفحة استمارة المحتاجين لدعم
            window.location.href = 'help.html';
        });
    }

    // 2. محاكاة إرسال استمارة المتطوعين
    const formVolunteer = document.getElementById('form-volunteer-submit');
    if (formVolunteer) {
        formVolunteer.addEventListener('submit', function (e) {
            e.preventDefault(); // منع إعادة تحميل الصفحة
            alert('شكرًا لك وعظّم الله عطاءك! تم استلام طلب التطوع بنجاح (محاكاة تجريبية مذهلة للموبايل).');
            window.location.href = 'index.html'; // العودة للرئيسية
        });
    }

    // 3. محاكاة إرسال استمارة طالبي الدعم
    const formHelp = document.getElementById('form-help-submit');
    if (formHelp) {
        formHelp.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('أهلنا الأعزاء، تم حفظ طلبكم بكرامة وسرية تامة وجاري مطابقته مع المتطوعين (محاكاة تجريبية).');
            window.location.href = 'index.html';
        });
    }
});