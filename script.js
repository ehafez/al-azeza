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

    // 5. توليد جسيمات ذهبية عائمة في قسم الترحيب
    const particlesContainer = document.getElementById('heroParticles');
    if (particlesContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const particleCount = window.innerWidth < 576 ? 12 : 22;
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('span');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (6 + Math.random() * 8) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            p.style.width = p.style.height = (3 + Math.random() * 3) + 'px';
            particlesContainer.appendChild(p);
        }
    }

    // 6. كشف الأقسام تدريجياً عند التمرير
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window && revealEls.length) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in-view'));
    }

    // 7. عدّاد متحرك للأرقام الإنجازية
    const counterEls = document.querySelectorAll('.counter-number[data-count]');
    if ('IntersectionObserver' in window && counterEls.length) {
        const animateCounter = (el) => {
            const target = parseInt(el.getAttribute('data-count'), 10) || 0;
            const duration = 1400;
            const startTime = performance.now();
            function step(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = current.toLocaleString('en-US');
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = '+' + target.toLocaleString('en-US');
                }
            }
            requestAnimationFrame(step);
        };
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counterEls.forEach(el => counterObserver.observe(el));
    }

    // 8. زر العودة إلى الأعلى
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 9. محاكاة الاشتراك بالنشرة الإخبارية
    const newsletterForm = document.getElementById('form-newsletter');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('شكراً لانضمامك إلى نشرة الأعزاء، سنوافيك بآخر مستجدات الإعمار أولاً بأول.');
            newsletterForm.reset();
        });
    }
});