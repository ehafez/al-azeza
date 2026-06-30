// الانتظار حتى تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function () {
    
    // التقاط أزرار واجهة الموبايل
    const volunteerBtn = document.getElementById('btn-volunteer');
    const needHelpBtn = document.getElementById('btn-need-help');

    // حدث عند الضغط على زر المتطوعين
    if (volunteerBtn) {
        volunteerBtn.addEventListener('click', function () {
            alert('سيتم فتح استمارة المتطوعين والشركات في الخطوة القادمة!');
        });
    }

    // حدث عند الضغط على زر طالبي الدعم
    if (needHelpBtn) {
        needHelpBtn.addEventListener('click', function () {
            alert('سيتم فتح استمارة طالبي الدعم في الخطوة القادمة!');
        });
    }
});