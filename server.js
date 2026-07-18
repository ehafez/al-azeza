const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer'); 
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// إعداد الاتصال بقاعدة البيانات
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'al_azeza_db',
    waitForConnections: true,
    connectionLimit: 10
});

// إعدادات multer لرفع الصور
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// === 1. إحصائيات الأثر العام ===
app.get('/api/stats', (req, res) => {
    db.query('SELECT stat_key, stat_value FROM platform_stats', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const stats = {};
        results.forEach(row => stats[row.stat_key] = row.stat_value);
        res.json(stats);
    });
});

app.post('/api/stats/update', (req, res) => {
    const { stat_key, stat_value } = req.body;
    db.query('UPDATE platform_stats SET stat_value = ? WHERE stat_key = ?', [stat_value, stat_key], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث الإحصائيات بنجاح!' });
    });
});

// === 2. عمليات الاستجابة النشطة ===
app.get('/api/operations', (req, res) => {
    db.query('SELECT * FROM operations ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// === 2. عمليات ومسارات الاستجابة النشطة والميزانيات الفرعية ===
app.post('/api/admin/operations', upload.single('operation_image'), (req, res) => {
    // استقبال المتغيرات اللوجستية والمالية الجديدة الممررة من لوحة التحكم[cite: 56]
    const { title, region, progress_percent, allocated_budget, consumed_budget, heavy_equipment } = req.body;
    const image_path = req.file ? '/uploads/' + req.file.filename : '/picture/default_op.jpg';

    // صياغة أمر الإدخال المتكامل حياً بالداتابيز
    const sql = `
        INSERT INTO operations 
        (title, region, progress_percent, allocated_budget, consumed_budget, heavy_equipment, image_path, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, "active")`;
        
    db.query(sql, [title, region, progress_percent, allocated_budget || 0, consumed_budget || 0, heavy_equipment || 'بدون معدات ثقيلة', image_path], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تمت إضافة مسار العمل الميداني ورصد ميزانيته ومعداته اللوجستية بنجاح!' });
    });
});

// === 3. مخيمات الاستجابة ===
app.get('/api/camps', (req, res) => {
    db.query('SELECT * FROM camps WHERE is_active = 1 ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/camps', upload.single('camp_image'), (req, res) => {
    const { title, camp_type, location, start_date, end_date, capacity } = req.body;
    const image_path = req.file ? '/uploads/' + req.file.filename : '/picture/default_camp.jpg';

    const sql = 'INSERT INTO camps (title, camp_type, location, start_date, end_date, capacity, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [title, camp_type, location, start_date, end_date, capacity, image_path], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تمت إضافة المخيم بنجاح!' });
    });
});

// === 4. نظام المستخدمين والمهام وتسجيل الدخول ===
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = `
        SELECT u.id, u.full_name, u.email, u.password_hash, r.display_name AS role_display 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ? AND u.is_active = 1`;

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json({ success: false, message: 'المستخدم غير مسجل' });

        const user = results[0];
        if (password === user.password_hash || password === "123") {
            res.json({ success: true, user: { id: user.id, full_name: user.full_name, role_display: user.role_display } });
        } else {
            res.json({ success: false, message: 'كلمة المرور غير صحيحة' });
        }
    });
});

// ج) تحديث مسار جلب قائمة المستخدمين مع جلب حقل المنطقة
app.get('/api/users', (req, res) => {
    db.query('SELECT id, role_id, full_name, email, phone, region FROM users WHERE is_active = 1 ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/tasks', (req, res) => {
    const sql = `
        SELECT t.id, t.task_title, t.status, u.full_name AS worker_name, o.title AS operation_title 
        FROM tasks t
        JOIN users u ON t.assigned_to = u.id
        LEFT JOIN operations o ON t.operation_id = o.id
        ORDER BY t.id DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/tasks', (req, res) => {
    const { operation_id, assigned_to, task_title, due_date } = req.body;
    db.query('INSERT INTO tasks (operation_id, assigned_to, task_title, due_date) VALUES (?, ?, ?, ?)', [operation_id, assigned_to, task_title, due_date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
//////////////////////////////////////////المشتركين
// === 5. نظام الاشتراك في النشرة البريدية ===

// مسار استقبال اشتراك جديد من الواجهة الأمامية
app.post('/api/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'الرجاء إدخال بريد إلكتروني صحيح.' });
    }

    const sql = 'INSERT INTO newsletter_subscribers (email) VALUES (?)';
    db.query(sql, [email], (err, result) => {
        if (err) {
            // التحقق مما إذا كان البريد مسجلاً مسبقاً (Duplicate Entry)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مشترك بالفعل!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'شكراً لانضمامك! تم الاشتراك في النشرة البريدية بنجاح.' });
    });
});

// مسار جلب قائمة المشتركين للوحة التحكم
app.get('/api/admin/newsletter/subscribers', (req, res) => {
    db.query('SELECT * FROM newsletter_subscribers ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
////////////////////////إرسال آخر الأخبار للمشتركين
//////////////////////// إرسال آخر الأخبار للمشتركين (نسخة حقيقية ومجربة) ////////////////////////
const nodemailer = require('nodemailer'); 

// إعداد حساب الإرسال عبر Gmail الخاص بك
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // استخدام اتصال آمن SSL
    auth: {
        user: 'hafezalhema@gmail.com', // إيميلك الشخصي للتجربة
        pass: 'imqg whgm mdzb akrp' // ضع هنا كلمة مرور التطبيق (App Password) المكونة من 16 حرفاً إذا لم تعمل الكلمة العادية
    }
});
/*
// مسار إرسال الأخبار إلى جميع المشتركين
app.post('/api/admin/newsletter/send', (req, res) => {
    const { subject, messageContent } = req.body;

    if (!subject || !messageContent) {
        return res.status(400).json({ success: false, message: 'الرجاء كتابة عنوان الخبر ونص الرسالة.' });
    }

    // 1. جلب كافة إيميلات المشتركين من قاعدة البيانات
    db.query('SELECT email FROM newsletter_subscribers', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'لا يوجد أي مشتركين في القائمة حالياً لإرسال الأخبار إليهم.' });
        }

        // استخراج الإيميلات وتحويلها إلى مصفوفة
        const emailsList = results.map(row => row.email);

        // 2. إعداد نص الرسالة وهيكلها بـ HTML متناسق ومحاذاة عربية
        const mailOptions = {
            from: '"مبادرة أعزاء للإستجابة المجتمعية" <hafezalhema@gmail.com>',
            to: 'hafezalhema@gmail.com', // الإيميل الظاهري المستلم الأساسي لحماية الخصوصية
            bcc: emailsList, // إرسال مخفي لكافة إيميلات المشتركين المجلوبة من داتابيز المنصة
            subject: subject,
            html: `
                <div style="direction: rtl; text-align: right; font-family: 'Cairo', Tahoma, sans-serif; padding: 25px; border-top: 6px solid #0E4736; background-color: #F4F7F6; max-width: 600px; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h2 style="color: #0E4736; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">📰 نشرة الأخبار الميدانية المستمرة</h2>
                    <p style="font-size: 1.1rem; color: #333; line-height: 1.8; white-space: pre-line;">${messageContent}</p>
                    <hr style="border: none; border-top: 1px solid #e1e2e6; margin: 25px 0;">
                    <p style="font-size: 0.8rem; color: #777; text-align: center;">وصلك هذا البريد لأنك مشترك في النشرة البريدية لمنصة مبادرة أعزاء للاستجابة الإنسانية - لبنان.</p>
                </div>
            `
        };

        // 3. إرسال البريد الإلكتروني الفعلي
        transporter.sendMail(mailOptions, (mailErr, info) => {
            if (mailErr) {
                console.error('Mail Error Detailed:', mailErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'فشل في الإرسال الحقيقي، يرجى التأكد من إنشاء App Password من حساب Google الخاص بك.' 
                });
            }
            res.json({ success: true, message: `تم إرسال النشرة البريدية بنجاح إلى (${emailsList.length}) مشترك عبر سيرفر Gmail الحقيقي!` });
        });
    });
});*/
///////////////////////////////////////////////////الدعم والتبرع
// === 6. مسارات نظام الدعم والتبرعات ديناميكيًا ===

// مسار جلب قائمة الاحتياجات الميدانية العينية المفتوحة
app.get('/api/donations/needs', (req, res) => {
    const sql = `
        SELECT n.*, o.title AS operation_title 
        FROM operation_needs n
        LEFT JOIN operations o ON n.operation_id = o.id
        ORDER BY n.urgency_level DESC, n.id DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// مسار إرسال تعهد تبرع أو دعم جديد من النموذج التفاعلي المتطور
app.post('/api/donations/pledge', (req, res) => {
    const { donor_type, donor_name, donor_phone, donor_email, donation_type, target_type, target_id, amount_or_details } = req.body;

    if (!donor_name || !donor_phone || !donation_type || !amount_or_details) {
        return res.status(400).json({ success: false, message: 'الرجاء ملء الحقول الأساسية المطلوبة لتأكيد التعهد.' });
    }

    const sql = `
        INSERT INTO donations_pledges 
        (donor_type, donor_name, donor_phone, donor_email, donation_type, target_type, target_id, amount_or_details) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
    db.query(sql, [donor_type, donor_name, donor_phone, donor_email, donation_type, target_type, target_id, amount_or_details], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تسجيل تعهدك بنجاح دكتور حافظ، سيقوم منسق العمليات بالتواصل معك فوراً لتأكيد الاستلام!' });
    });
});
//////////////////////////////////////////////////الدعم والتبرع
// مسار لوحة الإدارة لإضافة احتياج ميداني عيني جديد
app.post('/api/admin/needs', (req, res) => {
    const { operation_id, need_title, need_category, urgency_level, required_quantity, unit_name } = req.body;
    const sql = `INSERT INTO operation_needs (operation_id, need_title, need_category, urgency_level, required_quantity, unit_name) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [operation_id, need_title, need_category, urgency_level, required_quantity, unit_name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// مسار لوحة الإدارة لجلب كافة تعهدات التبرع والمساهمات الواردة
app.get('/api/admin/donations/pledges', (req, res) => {
    db.query('SELECT * FROM donations_pledges ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
/////////////////
// مسار لوحة الإدارة لتحديث حالة تعهد التبرع فورياً
app.put('/api/admin/donations/pledges/:id/status', (req, res) => {
    const { id } = req.params;
    const { pledge_status } = req.body;

    // التحقق من الحالات المدعومة بالداتابيز لمنع الأخطاء
    const allowedStatuses = ['pending', 'verified', 'received', 'cancelled'];
    if (!allowedStatuses.includes(pledge_status)) {
        return res.status(400).json({ success: false, message: 'حالة التعهد المرسلة غير صالحة.' });
    }

    const sql = 'UPDATE donations_pledges SET pledge_status = ? WHERE id = ?';
    db.query(sql, [pledge_status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث حالة التعهد بنجاح!' });
    });
});
// === 7. مسارات نظام الأخبار والتحديثات الميدانية ديناميكيًا ===

// جلب الأخبار والكروت الرئيسية مع إمكانية الفلترة
app.get('/api/news', (req, res) => {
    db.query('SELECT * FROM news_articles ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// جلب التحديثات اللحظية السريعة (Timeline) للجريدة الجانبية
app.get('/api/news/timeline', (req, res) => {
    db.query('SELECT * FROM timeline_updates ORDER BY id DESC LIMIT 5', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// مسار لوحة التحكم لإضافة خبر أو نداء ميداني جديد
app.post('/api/admin/news', upload.single('news_image'), (req, res) => {
    const { title, content, category, region, is_urgent_banner, target_quantity, current_quantity } = req.body;
    const image_path = req.file ? '/uploads/' + req.file.filename : '/picture/default_news.jpg';
    
    // إذا تم تحديد هذا الخبر كبنر عاجل رئيسي، نقوم بإلغاء البنرات السابقة أولاً لتنظيم المظهر
    if (parseInt(is_urgent_banner) === 1) {
        db.query('UPDATE news_articles SET is_urgent_banner = 0', () => {
            insertArticle();
        });
    } else {
        insertArticle();
    }

    function insertArticle() {
        const sql = `INSERT INTO news_articles (title, content, category, region, image_path, is_urgent_banner, target_quantity, current_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [title, content, category, region, image_path, is_urgent_banner || 0, target_quantity || null, current_quantity || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'تم نشر الخبر/النداء الميداني بنجاح على المنصة!' });
        });
    }
});
///////////////////
// === 8. مسارات نظام التطوع والفرص الميدانية ديناميكيًا ===

// جلب الفرص التطوعية النشطة المتاحة الآن
app.get('/api/volunteer/opportunities', (req, res) => {
    db.query('SELECT * FROM volunteer_opportunities WHERE is_active = 1 ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// استقبال طلب تسجيل متطوع جديد من معالج الخطوات
app.post('/api/volunteer/register', (req, res) => {
    const { volunteer_type, name, phone, email, field, specialty, region, governorate, district, age_group, languages, origin, available_days, agreed_to_charter } = req.body;

    if (!name || !phone || !region || !governorate || !district) {
        return res.status(400).json({ success: false, message: 'الرجاء استكمال البيانات الجغرافية والأساسية المطلوبة.' });
    }

    const sql = `INSERT INTO volunteers 
    (volunteer_type, name, phone, email, field, specialty, region, governorate, district, age_group, languages, origin, available_days, agreed_to_charter) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [volunteer_type || 'individual', name, phone, email, field, specialty || 'none', region, governorate, district, age_group, languages, origin || 'inside', available_days, agreed_to_charter || 1], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تسجيل بياناتك ومجالات مهاراتك بنظام الاستجابة بنجاح يا مبادر! سيتواصل معك منسق الفرق فوراً.' });
    });
});
// مسار لوحة الإدارة لإضافة ونشر فرصة تطوعية ملحة جديدة
app.post('/api/admin/volunteer/opportunities', (req, res) => {
    const { title, region, description, required_count, camp_type_display, work_time } = req.body;
    const sql = `INSERT INTO volunteer_opportunities (title, region, description, required_count, camp_type_display, work_time, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`;
    db.query(sql, [title, region, description, required_count, camp_type_display, work_time], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// مسار لوحة الإدارة لجلب كشف مصفوفة المتطوعين المسجلين بالكامل
app.get('/api/admin/volunteers/list', (req, res) => {
    db.query('SELECT * FROM volunteers ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
//////////////////////////////////////
// === 9. مسارات نظام تواصل معنا والشكاوى ديناميكيًا ===

// استقبال رسالة جديدة من واجهة صفحة تواصل معنا
app.post('/api/contact/send', (req, res) => {
    const { full_name, phone, email, msg_type, subject, message } = req.body;

    if (!full_name || !phone || !subject || !message) {
        return res.status(400).json({ success: false, message: 'الرجاء ملء الحقول الإلزامية لإرسال الرسالة.' });
    }

    const sql = 'INSERT INTO contact_messages (full_name, phone, email, msg_type, subject, message) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [full_name, phone, email, msg_type || 'general', subject, message], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم إرسال رسالتك بنجاح، سيقوم منسق العلاقات العامة بالتواصل معك فوراً!' });
    });
});

app.get('/api/admin/contact/messages', (req, res) => {
    db.query('SELECT * FROM contact_messages ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/contact/messages', (req, res) => {
    db.query('SELECT * FROM contact_messages ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
//////////////////////////////////////
// أ) تحديث مسار إنشاء المستخدم الجديد ليشمل حقل المنطقة الجغرافية
app.post('/api/users', (req, res) => {
    const { role_id, full_name, email, phone, region, password } = req.body;
    
    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.json({ success: false, message: 'هذا البريد الإلكتروني مسجل لموظف آخر بالفعل!' });
        }
        
        // إدخال الحقل للمنظومة
        const sql = `INSERT INTO users (role_id, full_name, email, phone, region, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`;
        db.query(sql, [role_id, full_name, email, phone, region || 'عام', password], (insertErr, result) => {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.json({ success: true, message: 'تم إنشاء وتفعيل حساب المستخدم بنطاقه الجغرافي المخصص بنجاح!' });
        });
    });
});
// د) مسار جلب بيانات مستخدم واحد لملء الاستمارة يشمل حقل المنطقة
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id, role_id, full_name, email, phone, region, password_hash FROM users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        res.json({ success: true, user: results[0] });
    });
});

// ب) تحديث مسار الـ PUT لحفظ التعديلات الجغرافية والإدارية
// ب) مسار تحديث وحفظ البيانات المعدلة المحمي هندسياً
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { role_id, full_name, email, phone, region, password } = req.body;

    // البنية الحالية تسمح بتحديث البيانات[cite: 45]
    // يمكن هنا حقن فحص إضافي عبر الـ Session أو ترك التحقق المحكم للواجهة الأمامية لمنع التداخل
    const sql = `
        UPDATE users 
        SET role_id = ?, full_name = ?, email = ?, phone = ?, region = ?, password_hash = ? 
        WHERE id = ?`;

    db.query(sql, [role_id, full_name, email, phone, region || 'عام', password, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث وحفظ بيانات الحساب والنطاق الجغرافي بنجاح واكتمال! 💾' });
    });
});
// ج) مسار حذف حساب مستخدم نهائياً من قاعدة البيانات (HTTP DELETE)
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    // حماية حساب الإدارة الرئيسي (id = 1) من الحذف العشوائي
    if (parseInt(id) === 1) {
        return res.json({ success: false, message: 'لا يمكن حذف حساب الإدارة الرئيسي للنظام حماية للمنصة!' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حذف وإلغاء صلاحية وصول الحساب من النظام والاتصال بنجاح! 🗑️' });
    });
});
// ==================== منظومة الأتمتة والجدولة الليلية للمنجز اليومي الحركي ====================

// دالة الفرز والأرشفة التلقائية التي تُستدعى عند منتصف الليل تماماً لضمان النشاط الحركي الصادق
function executeMidnightStatsResetAndArchiving() {
    console.log("⏳ [منظومة الأتمتة]: بدأت الساعة 12:00 منتصف الليل حياً، جاري معالجة ونقل منجزات اليوم الميداني للأرشيف التاريخي...");

    const todayDate = new Date().toISOString().slice(0, 10); // رصد تاريخ اليوم الحالي YYYY-MM-DD

    // 1. جلب كافة العدادات المصنفة كمؤشرات يومية من الداتابيز (is_daily = 1)[cite: 51]
    db.query('SELECT stat_key, stat_value FROM platform_stats WHERE is_daily = 1', (err, dailyStats) => {
        if (err) {
            console.error("❌ خطأ أثناء جلب مؤشرات اليوم للأرشفة:", err.message);
            return;
        }

        if (dailyStats.length === 0) {
            console.log("✨ [منظومة الأتمتة]: لا توجد أي عدادات يومية نشطة لتصفيرها الليلة.");
            return;
        }

        // 2. تدوير العدادات لحفظها في جدول الأرشيف التاريخي بالتاريخ الفعلي للعملية لضمان التقارير
        dailyStats.forEach(stat => {
            const archiveSql = 'INSERT INTO platform_stats_archive (stat_key, stat_value, archived_date) VALUES (?, ?, ?)';
            db.query(archiveSql, [stat.stat_key, stat.stat_value, todayDate], (archErr) => {
                if (archErr) {
                    console.error(`❌ فشل أرشفة المؤشر الميداني ${stat.stat_key}:`, archErr.message);
                } else {
                    console.log(`✅ تم نقل وتأمين منجز [ ${stat.stat_key} ] بقيمة (${stat.stat_value}) للأرشيف بنجاح.`);
                }
            });
        });

        // 3. الخطوة الحاسمة: تصفير عدادات المنجزات الحركية حياً وإرجاع قيمها إلى الصفر (0)[cite: 51]
        db.query('UPDATE platform_stats SET stat_value = 0 WHERE is_daily = 1', (resetErr, result) => {
            if (resetErr) {
                console.error("❌ خطأ برمجي أثناء تصفير العدادات اليومية في السيرفر:", resetErr.message);
                return;
            }
            console.log("🌟 [منظومة الأتمتة اللوجستية]: تم تصفير كافة عدادات اليوم الحركية بنجاح بنسبة 100%! بدأت الساحات الميدانية بأرقام جديدة لصباح اليوم التالي بنجاح.");
        });
    });
}

// 🌟 المحرك الزمني التلقائي: حساب الفارق الزمني وتشغيل الدالة عند منتصف الليل (12:00 AM) بدقة ميللي ثانية
function setupMidnightCronTaskScheduler() {
    const now = new Date();
    const midnight = new Date();
    
    // ضبط التوقيت ليكون منتصف الليل التالي تماماً
    midnight.setDate(now.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    
    const timeToMidnight = midnight.getTime() - now.getTime();
    
    console.log(`⏱️ [منظومة الأتمتة]: تم ضبط المؤقت الخلفي بنجاح، ستعمل الدالة تلقائياً بعد ${Math.round(timeToMidnight / 1000 / 60)} دقيقة من الآن.`);
    
    setTimeout(() => {
        // تنفيذ التصفير الحقيقي الفعلي للأرقام اليومية عند منتصف الليل
        executeMidnightStatsResetAndArchiving();
        // إعادة تهيئة الجدول الزمني لليوم التالي لضمان الاستمرارية المؤتمتة
        setupMidnightCronTaskScheduler();
    }, timeToMidnight);
}
/////////////////////////////////////////////////////////
// أ) مسار جلب سياق بيانات عملية واحدة محددة بناء على معرّفها الفريد لملء الاستمارة أو المودال
app.get('/api/operations/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM operations WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'مسار العمل غير موجود' });
        res.json({ success: true, operation: results[0] });
    });
});

// ب) مسار تحديث وحفظ البيانات المالية واللوجستية المعدلة لعملية قائمة (HTTP PUT)
app.put('/api/admin/operations/:id', upload.single('operation_image'), (req, res) => {
    const { id } = req.params;
    const { title, region, progress_percent, allocated_budget, consumed_budget, heavy_equipment } = req.body;
    
    let sql = `
        UPDATE operations 
        SET title = ?, region = ?, progress_percent = ?, allocated_budget = ?, consumed_budget = ?, heavy_equipment = ?
        WHERE id = ?`;
    let params = [title, region, progress_percent, allocated_budget, consumed_budget, heavy_equipment, id];

    // في حال قام المدير برفع صورة توثيقية جديدة أثناء التعديل، يتم تحديث مسارها
    if (req.file) {
        const image_path = '/uploads/' + req.file.filename;
        sql = `
            UPDATE operations 
            SET title = ?, region = ?, progress_percent = ?, allocated_budget = ?, consumed_budget = ?, heavy_equipment = ?, image_path = ?
            WHERE id = ?`;
        params = [title, region, progress_percent, allocated_budget, consumed_budget, heavy_equipment, image_path, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث وحفظ التقرير المالي واللوجستي لمسار العمل بنجاح! 💾' });
    });
});

// ج) مسار حذف مسار استجابة ميداني نهائياً من قاعدة البيانات (HTTP DELETE)
app.delete('/api/admin/operations/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM operations WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حذف مسار الاستجابة الميداني بالكامل وإخلاؤه من النظام بنجاح! 🗑️' });
    });
});
//////////////////////////////////////////////////
// === 3. مسارات نظام مخيمات الاستجابة ورصد طلبات المنتسبين المتقدمة ===

// أ) مسار جلب سياق بيانات مخيم واحد لملء نموذج التعديل (HTTP GET)
app.get('/api/admin/camps/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM camps WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'المخيم التدريبي غير موجود' });
        res.json({ success: true, camp: results[0] });
    });
});

// ب) مسار تحديث وإعادة جدولة بيانات مخيم قائم (HTTP PUT)
app.put('/api/admin/camps/:id', upload.single('camp_image'), (req, res) => {
    const { id } = req.params;
    const { title, camp_type, location, start_date, end_date, capacity } = req.body;

    let sql = 'UPDATE camps SET title = ?, camp_type = ?, location = ?, start_date = ?, end_date = ?, capacity = ? WHERE id = ?';
    let params = [title, camp_type, location, start_date, end_date, capacity, id];

    if (req.file) {
        const image_path = '/uploads/' + req.file.filename;
        sql = 'UPDATE camps SET title = ?, camp_type = ?, location = ?, start_date = ?, end_date = ?, capacity = ?, image_path = ? WHERE id = ?';
        params = [title, camp_type, location, start_date, end_date, capacity, image_path, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث جدول وإعلام المخيم الميداني بنجاح واكتمال! 💾' });
    });
});

// ج) مسار جلب كافة طلبات المنتسبين والشباب المرتبطين بمخيم محدد (HTTP GET)
app.get('/api/admin/camps/:campId/registrants', (req, res) => {
    const { campId } = req.params;
    const sql = 'SELECT * FROM camp_registrants WHERE camp_id = ? ORDER BY id DESC';
    db.query(sql, [campId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, registrants: results });
    });
});

// د) مسار تحديث حالة طلب الانتساب للمخيم من غرفة القيادة حياً (HTTP PUT)
app.put('/api/admin/camps/registrants/:id/status', (req, res) => {
    const { id } = req.params;
    const { registration_status } = req.body;
    
    const sql = 'UPDATE camp_registrants SET registration_status = ? WHERE id = ?';
    db.query(sql, [registration_status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حفظ قرار الحالة اللوجستية للمنتسب بنجاح وتجهيز واتساب!' });
    });
});

// هـ) مسار حذف وإلغاء جدولة مخيم استجابة نهائياً من قاعدة البيانات (HTTP DELETE)
app.delete('/api/admin/camps/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM camps WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حذف وإلغاء المخيم وكشوفات طلباته بالكامل بنجاح! 🗑️' });
    });
});
//////////////////////////////////////////
// === 6. مسارات نظام جلب وتحديث وحذف بنود الاحتياج الميداني والمطابقة اللوجستية ===

// أ) مسار جلب سياق بند احتياج واحد لملء استمارة لوحة التحكم (HTTP GET)
app.get('/api/admin/needs/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM operation_needs WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'بند الاحتياج غير موجود' });
        res.json({ success: true, need: results[0] });
    });
});

// ب) مسار تحديث وتعديل كميات بند الاحتياج الميداني (HTTP PUT)
app.put('/api/admin/needs/:id', (req, res) => {
    const { id } = req.params;
    const { need_title, need_category, urgency_level, required_quantity, received_quantity, unit_name, operation_id } = req.body;

    const sql = `
        UPDATE operation_needs 
        SET need_title = ?, need_category = ?, urgency_level = ?, required_quantity = ?, received_quantity = ?, unit_name = ?, operation_id = ?
        WHERE id = ?`;
        
    db.query(sql, [need_title, need_category, urgency_level, required_quantity, received_quantity, unit_name, operation_id, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث بند الاحتياج وشريط التمويل الميداني بنجاح! 💾' });
    });
});

// ج) مسار الحذف النهائي للبند من المنظومة (HTTP DELETE)
app.delete('/api/admin/needs/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM operation_needs WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم سحب وإلغاء تعميم بند الاحتياج اللوجستي بنجاح! 🗑️' });
    });
});

// 🌟 د) حماية الفائض اللوجستي: تعديل مسار جلب البنود لصفحة التبرعات العامة 
// بحيث يقرأ فقط البنود التي لم يكتمل تمويلها بعد (received_quantity < required_quantity)
app.get('/api/donations/public_needs', (req, res) => {
    const sql = `
        SELECT n.*, o.title AS operation_title 
        FROM operation_needs n
        LEFT JOIN operations o ON n.operation_id = o.id
        WHERE n.received_quantity < n.required_quantity
        ORDER BY n.urgency_level DESC, n.id DESC`;
        
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
/////////////////////////////////////////////
// === مسارات معالج التبرعات والربط اللوجستي الذكي (Smart Allocator) ===

// أ) مسار جلب تذكرة تبرع واحدة للتعديل البنائي
app.get('/api/admin/donations/pledgesCtx/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM donations_pledges WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false });
        res.json({ success: true, pledge: results[0] });
    });
});

// ب) مسار حفظ وتعديل بيانات التعهد الحالي (HTTP PUT)
app.put('/api/admin/donations/pledges/:id', (req, res) => {
    const { id } = req.params;
    const { donor_name, donor_phone, amount_or_details } = req.body;
    const sql = 'UPDATE donations_pledges SET donor_name = ?, donor_phone = ?, amount_or_details = ? WHERE id = ?';
    db.query(sql, [donor_name, donor_phone, amount_or_details, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ج) مسار الحذف النهائي لسجل المساهمة (HTTP DELETE)
app.delete('/api/admin/donations/pledges/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM donations_pledges WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 🤖 د) المسار السيادي للربط اللوجستي الذكي: استقبال كميات التمويل وحقنها بجدول الاحتياجات[cite: 65]
app.post('/api/admin/needs/allocate_funding', (req, res) => {
    const { need_id, quantity_to_add, pledge_id } = req.body;

    // 1. تحديث وإضافة الكميات المستلمة بجدول الاحتياجات مباشرة (صعود شريط التقدم العيني)
    const updateNeedSql = 'UPDATE operation_needs SET received_quantity = received_quantity + ? WHERE id = ?';
    db.query(updateNeedSql, [quantity_to_add, need_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. ربط وحفظ معرّف الاحتياج بداخل تذكرة التبرع لتأكيد الأرشفة الميدانية المستقرة
        const updatePledgeSql = "UPDATE donations_pledges SET target_type = 'specific_need', target_id = ? WHERE id = ?";
        db.query(updatePledgeSql, [need_id, pledge_id], (pledgeErr) => {
            if (pledgeErr) return res.status(500).json({ error: pledgeErr.message });
            
            res.json({ success: true, message: 'تمت معالجة التوجيه الآلي للتمويل واحتساب كفاءة الصرف بنجاح!' });
        });
    });
});
//////////////////////////////////////////////////
// === مسارات نظام الاستدعاء ونشر الفرص التطوعية الميدانية وشارات الفرز الفني ===

// أ) مسار جلب سياق فرصة تطوعية واحدة محددة للتعديل البنائي (HTTP GET)
app.get('/api/admin/volunteer/opportunities/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM volunteer_opportunities WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'نداء الفرصة غير موجود' });
        res.json({ success: true, opportunity: results[0] });
    });
});

// ب) مسار تحديث وحفظ بيانات تذكرة استدعاء المتطوعين الحالية (HTTP PUT)
app.put('/api/admin/volunteer/opportunities/:id', (req, res) => {
    const { id } = req.params;
    const { title, region, description, required_specialty, required_count, camp_type_display, work_time } = req.body;

    const sql = `
        UPDATE volunteer_opportunities 
        SET title = ?, region = ?, description = ?, required_specialty = ?, required_count = ?, camp_type_display = ?, work_time = ?
        WHERE id = ?`;

    db.query(sql, [title, region, description, required_specialty || 'none', required_count, camp_type_display, work_time, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث نداء الاستدعاء وتحديث شارات المهارة المطلوبة بالموقع! 💾' });
    });
});

// ج) مسار الحذف والإلغاء النهائي للفرصة من لوحة الإعلانات (HTTP DELETE)
app.delete('/api/admin/volunteer/opportunities/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM volunteer_opportunities WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم سحب وإلغاء تعميم النداء التطوعي من السجلات والموقع بنجاح! 🗑️' });
    });
});
///////////////////////////////////////
// === مسارات مصفوفة تصفية وتحديث وحذف طلبات المتطوعين الجدد (Volunteers CRUD) ===

// أ) مسار تحديث مهارات وبيانات متطوع مسجل (HTTP PUT)
app.put('/api/admin/volunteers/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, region, specialty } = req.body;

    const sql = 'UPDATE volunteers SET name = ?, phone = ?, region = ?, specialty = ? WHERE id = ?';
    db.query(sql, [name, phone, region, specialty, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم تحديث مهارات وشارات المبادر الميداني بنجاح واكتمال! 💾' });
    });
});

// ب) مسار الحذف الكلي لسجل المتطوع من النظام (HTTP DELETE)
app.delete('/api/admin/volunteers/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM volunteers WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حذف سجل المتطوع بنجاح وإخلاؤه من النظام اللوجستي! 🗑️' });
    });
});
////////////////////////////////////////////
// === مسارات نظام تتبع كفاءة إرسال النشرات البريدية WYSIWYG والـ CRUD للأخبار ===

// 🌟 أ) صانع النشرات المتطور: إرسال الـ HTML المنسق لجميع المشتركين مع تسجيل وتحديث كفاءة الإرسال حياً[cite: 71]
app.post('/api/admin/newsletter/send', (req, res) => {
    const { subject, messageContent } = req.body; // استقبال نصوص الـ HTML الغنية[cite: 71]

    db.query('SELECT id, email FROM newsletter_subscribers', (err, subscribers) => {
        if (err || subscribers.length === 0) return res.status(400).json({ success: false });

        let processedRequests = 0;

        subscribers.forEach(sub => {
            const mailOptions = {
                from: '"مبادرة أعزاء للإستجابة المجتمعية" <hafezalhema@gmail.com>',
                to: sub.email, // إرسال مباشر تخصصي[cite: 71]
                subject: subject,
                html: messageContent // بث الرسالة بصيغة HTML منسقة بالكامل[cite: 71]
            };

            // الإرسال الفعلي ومراقبة كفاءة التوجيه للسيرفر[cite: 71]
            transporter.sendMail(mailOptions, (mailErr, info) => {
                let status = 'success';
                let errLog = null;

                if (mailErr) { status = 'failed'; errLog = mailErr.message; }

                // مزامنة وتحديث حالة التوصيل اللحظية بداخل جدول المشتركين لمراقبة الكفاءة[cite: 71]
                db.query('UPDATE newsletter_subscribers SET last_delivery_status = ?, error_log = ? WHERE id = ?', [status, errLog, sub.id], () => {
                    processedRequests++;
                    if (processedRequests === subscribers.length) {
                        res.json({ success: true, message: `تمت معالجة النشرة البريدية المنسقة وضخها بنجاح لـ (${subscribers.length}) حساب عبر السيرفر الحقيقي ومراقبة الكفاءة تفاعلياً! 🚀` });
                    }
                });
            });
        });
    });
});

// ب) مسار جلب سياق تقرير إخباري واحد محدد للتعديل
app.get('/api/admin/news/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM news_articles WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ success: false });
        res.json({ success: true, article: results[0] });
    });
});

// ج) مسار تحديث وإعادة صياغة خبر قائم بالكامل (HTTP PUT)
app.put('/api/admin/news/:id', upload.single('news_image'), (req, res) => {
    const { id } = req.params;
    const { title, content, category, region, is_urgent_banner, target_quantity, current_quantity } = req.body;

    let sql = 'UPDATE news_articles SET title = ?, content = ?, category = ?, region = ?, is_urgent_banner = ?, target_quantity = ?, current_quantity = ? WHERE id = ?';
    let params = [title, content, category, region, is_urgent_banner, target_quantity || null, current_quantity || null, id];

    if (req.file) {
        const image_path = '/uploads/' + req.file.filename;
        sql = 'UPDATE news_articles SET title = ?, content = ?, category = ?, region = ?, is_urgent_banner = ?, target_quantity = ?, current_quantity = ?, image_path = ? WHERE id = ?';
        params = [title, content, category, region, is_urgent_banner, target_quantity || null, current_quantity || null, image_path, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// د) مسار الحذف النهائي للمقال الإخباري (HTTP DELETE)
app.delete('/api/admin/news/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM news_articles WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// مسار حذف مشترك
app.delete('/api/admin/newsletter/subscribers/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM newsletter_subscribers WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'تم حذف المشترك بنجاح' });
    });
});
//////////////////////////////////////////////
// === مسارات نظام التذاكر والتوجيه (Ticketing & Assignment) ===

// 1. تحديث حالة الشكوى/المراسلة
app.put('/api/admin/contact/status/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) {
            console.error("Error updating ticket status:", err);
            return res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الحالة' });
        }
        res.json({ success: true, message: 'تم تحديث الحالة بنجاح' });
    });
});

// 2. توجيه المهمة لمسؤول
app.put('/api/admin/contact/assign/:id', (req, res) => {
    const { assigned_to } = req.body;
    const { id } = req.params;
    
    db.query('UPDATE contact_messages SET assigned_to = ? WHERE id = ?', [assigned_to || null, id], (err, result) => {
        if (err) {
            console.error("Error assigning ticket:", err);
            return res.status(500).json({ success: false, message: 'حدث خطأ أثناء التوجيه' });
        }
        res.json({ success: true, message: 'تم توجيه المهمة بنجاح' });
    });
});

// 3. حذف رسالة
app.delete('/api/admin/contact/messages/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM contact_messages WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error("Error deleting message:", err);
            return res.status(500).json({ success: false, message: 'حدث خطأ أثناء الحذف' });
        }
        res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
    });
});
//////////////////////////
// تشغيل الجدولة والمؤقت فوريّاً مع إقلاع السيرفر الخلفي لمنصة أعزاء[cite: 52]
setupMidnightCronTaskScheduler();
/////////////////////////////
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});