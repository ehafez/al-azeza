document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ================================================================
    // 1. إدارة التنقلات الأساسية
    // ================================================================
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

    // ================================================================
    // 2. ربط الكروت بالصفحات الداخلية
    // ================================================================
    const bulletinCard = document.getElementById('bulletinCard');
    if (bulletinCard) {
        bulletinCard.style.cursor = 'pointer';
        bulletinCard.addEventListener('click', function () {
            window.location.href = 'bulletins.html';
        });
    }

    const activityCard = document.getElementById('activityCard');
    if (activityCard) {
        activityCard.style.cursor = 'pointer';
        activityCard.addEventListener('click', function () {
            window.location.href = 'activities.html';
        });
    }

    const radarVolunteers = document.getElementById('radarVolunteers');
    if (radarVolunteers) {
        radarVolunteers.style.cursor = 'pointer';
        radarVolunteers.addEventListener('click', function () {
            window.location.href = 'activities.html';
        });
    }

    const radarLocal = document.getElementById('radarLocal');
    if (radarLocal) {
        radarLocal.style.cursor = 'pointer';
        radarLocal.addEventListener('click', function () {
            window.location.href = 'activities.html';
        });
    }

    const radarGlobal = document.getElementById('radarGlobal');
    if (radarGlobal) {
        radarGlobal.style.cursor = 'pointer';
        radarGlobal.addEventListener('click', function () {
            window.location.href = 'activities.html';
        });
    }

    // ================================================================
    // 3. الخريطة التفاعلية (Leaflet)
    // ================================================================
    const mapContainer = document.getElementById('interactiveMap');
    if (mapContainer && typeof L !== 'undefined') {
        const map = L.map('interactiveMap').setView([33.272, 35.203], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // بيانات القرى المتضررة (وهمية)
        const villages = [
            { lat: 33.118, lng: 35.322, name: 'بنت جبيل', status: 'urgent', active: 8 },
            { lat: 33.272, lng: 35.203, name: 'صور', status: 'active', active: 12 },
            { lat: 33.378, lng: 35.463, name: 'النبطية', status: 'done', active: 5 },
            { lat: 33.190, lng: 35.415, name: 'مرجعيون', status: 'active', active: 6 },
            { lat: 33.293, lng: 35.570, name: 'حاصبيا', status: 'urgent', active: 4 },
            { lat: 33.150, lng: 35.250, name: 'عيتا الشعب', status: 'active', active: 10 }
        ];

        // إضافة النقاط على الخريطة
        villages.forEach(function (v) {
            let color = '#28a745'; // done
            if (v.status === 'urgent') color = '#dc3545';
            if (v.status === 'active') color = '#ffc107';

            const marker = L.circleMarker([v.lat, v.lng], {
                radius: 12,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
                <b style="color:#1a1915;">${v.name}</b><br>
                <span style="color:#1a1915;">ورش نشطة: ${v.active}</span><br>
                <span style="color:#1a1915;">الحالة: ${v.status === 'urgent' ? '🚨 عاجل' : v.status === 'active' ? '🔄 نشط' : '✅ منجز'}</span>
            `);

            // إضافة رقم على النقطة
            const label = L.divIcon({
                html: `<div style="background:transparent;color:#fff;font-weight:700;font-size:10px;text-shadow:0 0 4px #000;">${v.active}</div>`,
                iconSize: [20, 20],
                className: 'custom-label'
            });
            L.marker([v.lat + 0.02, v.lng], { icon: label }).addTo(map);
        });

        // تكبير الخريطة بعد التحميل
        setTimeout(function () {
            map.invalidateSize();
        }, 500);

        // إعادة التكبير عند تغيير حجم النافذة
        window.addEventListener('resize', function () {
            map.invalidateSize();
        });
    }

    // ================================================================
    // 4. عدادات حية (Live Counters)
    // ================================================================
    function updateLiveCounters() {
        const volunteers = document.getElementById('counterVolunteers');
        const houses = document.getElementById('counterHouses');
        const companies = document.getElementById('counterCompanies');
        const projects = document.getElementById('counterProjects');

        if (volunteers) {
            const base = parseInt(volunteers.getAttribute('data-count')) || 1250;
            const delta = Math.floor(Math.random() * 15) - 3;
            const newVal = Math.max(base + delta, 1200);
            volunteers.setAttribute('data-count', newVal);
            volunteers.textContent = '+' + newVal.toLocaleString('en-US');
        }

        if (houses) {
            const base = parseInt(houses.getAttribute('data-count')) || 48;
            const delta = Math.floor(Math.random() * 5) - 1;
            const newVal = Math.max(base + delta, 45);
            houses.setAttribute('data-count', newVal);
            houses.textContent = '+' + newVal.toLocaleString('en-US');
        }

        if (companies) {
            const base = parseInt(companies.getAttribute('data-count')) || 22;
            const delta = Math.floor(Math.random() * 3) - 1;
            const newVal = Math.max(base + delta, 20);
            companies.setAttribute('data-count', newVal);
            companies.textContent = '+' + newVal.toLocaleString('en-US');
        }

        if (projects) {
            const base = parseInt(projects.getAttribute('data-count')) || 85;
            const delta = Math.floor(Math.random() * 4) - 2;
            const newVal = Math.max(base + delta, 80);
            projects.setAttribute('data-count', newVal);
            projects.textContent = '+' + newVal.toLocaleString('en-US');
        }
    }

    // تحديث العدادات كل 8 ثواني
    setInterval(updateLiveCounters, 8000);

    // ================================================================
    // 5. تحديث شريط التبرع
    // ================================================================
    function updateDonationBar() {
        const progress = document.getElementById('donationProgress');
        const collected = document.getElementById('donationCollected');
        const target = document.getElementById('donationTarget');

        if (progress && collected && target) {
            const current = 67000 + Math.floor(Math.random() * 3000) - 1500;
            const total = 100000;
            const pct = Math.min(Math.round((current / total) * 100), 100);
            progress.style.width = pct + '%';
            progress.textContent = pct + '%';
            collected.textContent = '$' + current.toLocaleString('en-US');
        }
    }

    setInterval(updateDonationBar, 10000);

    // ================================================================
    // 6. تحديث الـ Live Feed
    // ================================================================
    const feedItems = [
        { icon: 'fa-solid fa-check-circle text-success', text: 'تم ترميم منزل في عيتا الشعب - قبل 5 دقائق' },
        { icon: 'fa-solid fa-truck text-warning', text: 'وصول مواد بناء إلى بنت جبيل - قبل 20 دقيقة' },
        { icon: 'fa-solid fa-hands text-warning', text: 'انضمام 3 متطوعين جدد - قبل ساعة' },
        { icon: 'fa-solid fa-hard-hat text-success', text: 'بدء ورشة ترميم في النبطية - قبل ساعتين' },
        { icon: 'fa-solid fa-heart-pulse text-danger', text: 'عيادة ميدانية جديدة في صور - قبل 3 ساعات' }
    ];

    let feedIndex = 0;
    function updateFeed() {
        const feedContainer = document.querySelector('.live-feed');
        if (!feedContainer) return;

        const items = feedContainer.querySelectorAll('.feed-item');
        if (items.length > 0) {
            const randomItem = feedItems[Math.floor(Math.random() * feedItems.length)];
            const firstItem = items[0];
            if (firstItem) {
                const icon = firstItem.querySelector('i');
                const span = firstItem.querySelector('span');
                if (icon) {
                    icon.className = randomItem.icon;
                }
                if (span) {
                    span.textContent = randomItem.text;
                }
            }

            // إعادة ترتيب العناصر
            const parent = feedContainer;
            const children = parent.querySelectorAll('.feed-item');
            if (children.length > 1) {
                for (let i = children.length - 1; i > 0; i--) {
                    parent.insertBefore(children[i], children[i - 1]);
                }
            }
        }
    }

    setInterval(updateFeed, 15000);

    // ================================================================
    // 7. زر العودة إلى الأعلى
    // ================================================================
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

    // ================================================================
    // 8. الشات بوت
    // ================================================================
    window.toggleChat = function () {
        const box = document.getElementById('chatBox');
        if (box) {
            box.style.display = box.style.display === 'none' ? 'flex' : 'none';
        }
    };

    window.sendMessage = function () {
        const input = document.getElementById('chatInput');
        const messages = document.getElementById('chatMessages');

        if (!input || !messages) return;

        const text = input.value.trim();
        if (!text) return;

        // رسالة المستخدم
        const userMsg = document.createElement('p');
        userMsg.className = 'text-end text-warning small mb-1';
        userMsg.textContent = text;
        messages.appendChild(userMsg);

        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // رد آلي
        const responses = [
            'شكراً لتواصلك! سيتم الرد قريباً.',
            'تم استلام رسالتك. فريقنا سيتواصل معك خلال 24 ساعة.',
            'نقدر اهتمامك! هل تريد التطوع أم طلب دعم؟',
            'أهلاً بك! يمكنك زيارة صفحة التطوع أو طلب الدعم من القائمة الرئيسية.'
        ];

        setTimeout(function () {
            const botMsg = document.createElement('p');
            botMsg.className = 'text-start text-light small mb-1';
            botMsg.textContent = '🤖 ' + responses[Math.floor(Math.random() * responses.length)];
            messages.appendChild(botMsg);
            messages.scrollTop = messages.scrollHeight;
        }, 1200);
    };

    // ================================================================
    // 9. تبديل اللغة (متعدد اللغات)
    // ================================================================
    let currentLang = 'ar';

    window.toggleLanguage = function () {
        const dir = document.documentElement.dir === 'rtl' ? 'ltr' : 'rtl';
        document.documentElement.dir = dir;
        document.documentElement.lang = dir === 'rtl' ? 'ar' : 'en';

        const langLabel = document.getElementById('langLabel');
        if (langLabel) {
            langLabel.textContent = dir === 'rtl' ? 'عربي' : 'EN';
        }

        currentLang = dir === 'rtl' ? 'ar' : 'en';
        updateTexts(currentLang);
    };

    function updateTexts(lang) {
        const translations = {
            ar: {
                spiritual: '"اللَّهُمَّ اجْعَلْ هَذَا الْبَلَدَ آمِنًا"',
                navVolunteer: 'طلب انتساب',
                quran: '"مَن يَتَوَلَّ اللَّهَ وَرَسُولَهُ وَالَّذِينَ آمَنُوا فَإِنَّ حِزْبَ اللَّهِ هُمُ الْغَالِبُونَ"',
                heroTitle: 'لأنهم الأعزاء... نلتقي لنعمر الجنوب',
                heroSub: 'منصتكم الأهلية التكافلية لربط كفاءات المتطوعين والشركات بأهلنا الصامدين لإعادة بناء وتأهيل منازلهم بنور الأمل والعمل.',
                btnHelp: 'أريد أن أساعد (متطوع / شركة)',
                btnNeed: 'أحتاج إلى دعم (فرد / عائلة)',
                donateTitle: 'تبرع الآن',
                donateBtn: 'تبرع',
                bulletinTitle: 'خانة التعاميم والموجّهات العامة',
                activityTitle: 'مجالات الاستفادة والدعم المتاحة',
                howItWorks: 'كيف تعمل المنصة؟',
                howSub: 'أربع خطوات تفصل بين طلبك وبين يد تمتد لمساعدتك',
                step1: 'تسجيل الطلب',
                step1Desc: 'تعبئة استمارة بسيطة من قبل العائلة أو المتطوع.',
                step2: 'الفرز والمطابقة',
                step2Desc: 'فريقنا يدرس الحاجة ويطابقها مع الكفاءة المناسبة.',
                step3: 'التنفيذ الميداني',
                step3Desc: 'انطلاق الفرق إلى الأرض لتنفيذ أعمال الترميم.',
                step4: 'التسليم والمتابعة',
                step4Desc: 'تسليم المنزل ومتابعة دورية لضمان جودة العمل.',
                mapTitle: 'خرائط العمل الجغرافي بالجنوب',
                mapSub: 'اختر قضاءك أو بلدتك على الخارطة لتحديد احتياجات الإعمار',
                legendActive: 'ورش نشطة',
                legendUrgent: 'دعم عاجل',
                legendDone: 'مشاريع منجزة',
                feedTitle: 'آخر التحديثات الميدانية',
                radarTitle: 'رادارات وفرز المساهمات',
                radarVol: 'طبيعة المتطوعين',
                radarVolDesc: 'توزيع حسب الاختيار: إعلامي، صحي، أنشطة ميدانية، أو دعم نفسي.',
                radarLocal: 'مساهمات جهات وأفراد الداخل',
                radarLocalDesc: 'مبادرات أهلية ومصانع محلية تدعم الورش مباشرة.',
                radarGlobal: 'مساهمات الاغتراب (الخارج)',
                radarGlobalDesc: 'قنوات دعم مخصصة للمغتربين اللبنانيين للمساندة.',
                galleryTitle: 'معرض إنجازاتنا',
                gallerySub: 'لمحات من منازل أعدنا لها الحياة بسواعد المتطوعين',
                testimonialTitle: 'قصص نجاح',
                counterVol: 'متطوع مسجل',
                counterHouse: 'منزلاً تم ترميمه',
                counterCompany: 'شركة ومصنع مساهم',
                counterProject: 'طلب قيد التنفيذ',
                partnersTitle: 'شركاؤنا الداعمون',
                chatTitle: 'مساعد الأعزاء',
                chatWelcome: 'مرحباً! كيف يمكنني مساعدتك؟',
                footerPrivacy: 'كل البيانات المرفوعة تخضع لسياسة خصوصية وأمان صارمة لحفظ كرامة وأمن أهالينا.',
                newsletterPlaceholder: 'بريدك الإلكتروني للانضمام لنشرتنا',
                newsletterBtn: 'اشتراك'
            },
            en: {
                spiritual: '"O Allah, make this land safe and bless its people"',
                navVolunteer: 'Join Us',
                quran: '"Whoever allies with Allah, His Messenger, and the believers — indeed the party of Allah are the victorious."',
                heroTitle: 'Because they are dear to us... We unite to rebuild the South',
                heroSub: 'Your community platform connecting volunteers and companies with our resilient people to rebuild and restore their homes with hope and work.',
                btnHelp: 'I Want to Help (Volunteer / Company)',
                btnNeed: 'I Need Support (Individual / Family)',
                donateTitle: 'Donate Now',
                donateBtn: 'Donate',
                bulletinTitle: 'Bulletins & General Directives',
                activityTitle: 'Available Support Areas',
                howItWorks: 'How Does the Platform Work?',
                howSub: 'Four steps between your request and a helping hand',
                step1: 'Request Submission',
                step1Desc: 'Fill a simple form by the family or volunteer.',
                step2: 'Sorting & Matching',
                step2Desc: 'Our team assesses needs and matches with the right expertise.',
                step3: 'Field Execution',
                step3Desc: 'Teams deploy to carry out reconstruction work.',
                step4: 'Delivery & Follow-up',
                step4Desc: 'Handover the home with periodic quality follow-up.',
                mapTitle: 'Geographic Work Maps in the South',
                mapSub: 'Select your district or town on the map to identify reconstruction needs',
                legendActive: 'Active Workshops',
                legendUrgent: 'Urgent Support',
                legendDone: 'Completed Projects',
                feedTitle: 'Latest Field Updates',
                radarTitle: 'Contribution Radars & Sorting',
                radarVol: 'Volunteer Types',
                radarVolDesc: 'Distribution by choice: Media, Health, Field Activities, or Psychological Support.',
                radarLocal: 'Local Contributions',
                radarLocalDesc: 'Community initiatives and local factories supporting workshops directly.',
                radarGlobal: 'Diaspora Contributions (Abroad)',
                radarGlobalDesc: 'Dedicated support channels for Lebanese expatriates to assist.',
                galleryTitle: 'Our Achievements Gallery',
                gallerySub: 'Glimpses of homes we brought back to life with volunteers\' hands',
                testimonialTitle: 'Success Stories',
                counterVol: 'Registered Volunteers',
                counterHouse: 'Homes Restored',
                counterCompany: 'Contributing Companies',
                counterProject: 'Active Requests',
                partnersTitle: 'Our Supporting Partners',
                chatTitle: 'Al-Azeza Assistant',
                chatWelcome: 'Hello! How can I help you?',
                footerPrivacy: 'All submitted data is subject to strict privacy and security policies to protect the dignity and safety of our people.',
                newsletterPlaceholder: 'Your email to join our newsletter',
                newsletterBtn: 'Subscribe'
            }
        };

        const t = translations[lang] || translations.ar;

        // تحديث النصوص
        const spiritual = document.getElementById('spiritualText');
        if (spiritual) spiritual.textContent = t.spiritual;

        const navVol = document.getElementById('navVolunteer');
        if (navVol) navVol.textContent = t.navVolunteer;

        const quran = document.getElementById('quranVerse');
        if (quran) quran.textContent = t.quran;

        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            const span = heroTitle.querySelector('span');
            if (span) span.textContent = t.heroTitle;
        }

        const heroSub = document.getElementById('heroSub');
        if (heroSub) heroSub.textContent = t.heroSub;

        const btnHelp = document.getElementById('btnHelp');
        if (btnHelp) btnHelp.textContent = t.btnHelp;

        const btnNeed = document.getElementById('btnNeed');
        if (btnNeed) btnNeed.textContent = t.btnNeed;

        const donateTitle = document.getElementById('donateTitle');
        if (donateTitle) donateTitle.textContent = t.donateTitle;

        const donateBtn = document.getElementById('donateBtnText');
        if (donateBtn) donateBtn.textContent = t.donateBtn;

        const bulletinTitle = document.getElementById('bulletinTitle');
        if (bulletinTitle) bulletinTitle.textContent = t.bulletinTitle;

        const activityTitle = document.getElementById('activityTitle');
        if (activityTitle) activityTitle.textContent = t.activityTitle;

        const howTitle = document.getElementById('howItWorksTitle');
        if (howTitle) howTitle.textContent = t.howItWorks;

        const howSub = document.getElementById('howItWorksSub');
        if (howSub) howSub.textContent = t.howSub;

        const step1t = document.getElementById('step1Title');
        if (step1t) step1t.textContent = t.step1;
        const step1d = document.getElementById('step1Desc');
        if (step1d) step1d.textContent = t.step1Desc;

        const step2t = document.getElementById('step2Title');
        if (step2t) step2t.textContent = t.step2;
        const step2d = document.getElementById('step2Desc');
        if (step2d) step2d.textContent = t.step2Desc;

        const step3t = document.getElementById('step3Title');
        if (step3t) step3t.textContent = t.step3;
        const step3d = document.getElementById('step3Desc');
        if (step3d) step3d.textContent = t.step3Desc;

        const step4t = document.getElementById('step4Title');
        if (step4t) step4t.textContent = t.step4;
        const step4d = document.getElementById('step4Desc');
        if (step4d) step4d.textContent = t.step4Desc;

        const mapTitle = document.getElementById('mapTitle');
        if (mapTitle) mapTitle.textContent = t.mapTitle;
        const mapSub = document.getElementById('mapSub');
        if (mapSub) mapSub.textContent = t.mapSub;

        const legendActive = document.getElementById('legendActive');
        if (legendActive) legendActive.textContent = t.legendActive;
        const legendUrgent = document.getElementById('legendUrgent');
        if (legendUrgent) legendUrgent.textContent = t.legendUrgent;
        const legendDone = document.getElementById('legendDone');
        if (legendDone) legendDone.textContent = t.legendDone;

        const feedTitle = document.getElementById('feedTitle');
        if (feedTitle) feedTitle.textContent = t.feedTitle;

        const radarTitle = document.getElementById('radarTitle');
        if (radarTitle) radarTitle.textContent = t.radarTitle;

        const rvTitle = document.getElementById('radarVolTitle');
        if (rvTitle) rvTitle.textContent = t.radarVol;
        const rvDesc = document.getElementById('radarVolDesc');
        if (rvDesc) rvDesc.textContent = t.radarVolDesc;

        const rlTitle = document.getElementById('radarLocalTitle');
        if (rlTitle) rlTitle.textContent = t.radarLocal;
        const rlDesc = document.getElementById('radarLocalDesc');
        if (rlDesc) rlDesc.textContent = t.radarLocalDesc;

        const rgTitle = document.getElementById('radarGlobalTitle');
        if (rgTitle) rgTitle.textContent = t.radarGlobal;
        const rgDesc = document.getElementById('radarGlobalDesc');
        if (rgDesc) rgDesc.textContent = t.radarGlobalDesc;

        const galleryTitle = document.getElementById('galleryTitle');
        if (galleryTitle) galleryTitle.textContent = t.galleryTitle;
        const gallerySub = document.getElementById('gallerySub');
        if (gallerySub) gallerySub.textContent = t.gallerySub;

        const testimonialTitle = document.getElementById('testimonialTitle');
        if (testimonialTitle) testimonialTitle.textContent = t.testimonialTitle;

        const cVol = document.getElementById('counterVolLabel');
        if (cVol) cVol.textContent = t.counterVol;
        const cHouse = document.getElementById('counterHouseLabel');
        if (cHouse) cHouse.textContent = t.counterHouse;
        const cCompany = document.getElementById('counterCompanyLabel');
        if (cCompany) cCompany.textContent = t.counterCompany;
        const cProject = document.getElementById('counterProjectLabel');
        if (cProject) cProject.textContent = t.counterProject;

        const partnersTitle = document.getElementById('partnersTitle');
        if (partnersTitle) partnersTitle.textContent = t.partnersTitle;

        const chatTitle = document.getElementById('chatTitle');
        if (chatTitle) chatTitle.textContent = t.chatTitle;
        const chatWelcome = document.getElementById('chatWelcome');
        if (chatWelcome) chatWelcome.textContent = t.chatWelcome;

        const footerPrivacy = document.getElementById('footerPrivacy');
        if (footerPrivacy) footerPrivacy.textContent = t.footerPrivacy;

        const newsletterPlaceholder = document.getElementById('newsletterEmail');
        if (newsletterPlaceholder) newsletterPlaceholder.placeholder = t.newsletterPlaceholder;
        const newsletterBtn = document.getElementById('newsletterBtn');
        if (newsletterBtn) newsletterBtn.textContent = t.newsletterBtn;
    }

    // ================================================================
    // 10. الاشتراك بالنشرة الإخبارية
    // ================================================================
    const newsletterForm = document.getElementById('form-newsletter');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const msg = currentLang === 'ar' ?
                'شكراً لانضمامك إلى نشرة الأعزاء، سنوافيك بآخر مستجدات الإعمار أولاً بأول.' :
                'Thank you for joining Al-Azeza newsletter. We will keep you updated on reconstruction progress.';
            alert(msg);
            newsletterForm.reset();
        });
    }

    // ================================================================
    // 11. زر التبرع
    // ================================================================
    window.openDonation = function () {
        const msg = currentLang === 'ar' ?
            '🚧 بوابة التبرع الآمن قيد التطوير حالياً. شكراً لاهتمامكم!' :
            '🚧 Secure donation portal is currently under development. Thank you for your interest!';
        alert(msg);
    };

    // ================================================================
    // 12. توليد جسيمات ذهبية
    // ================================================================
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

    // ================================================================
    // 13. كشف الأقسام عند التمرير
    // ================================================================
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window && revealEls.length) {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add('in-view');
        });
    }

    // ================================================================
    // 14. عدادات متحركة عند الظهور
    // ================================================================
    const counterEls = document.querySelectorAll('.counter-number[data-count]');
    if ('IntersectionObserver' in window && counterEls.length) {
        const animateCounter = function (el) {
            const target = parseInt(el.getAttribute('data-count'), 10) || 0;
            const duration = 1400;
            const startTime = performance.now();

            function step(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = '+' + current.toLocaleString('en-US');
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = '+' + target.toLocaleString('en-US');
                }
            }
            requestAnimationFrame(step);
        };

        const counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counterEls.forEach(function (el) {
            counterObserver.observe(el);
        });
    }
});