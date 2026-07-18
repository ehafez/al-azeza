-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 18 يوليو 2026 الساعة 13:06
-- إصدار الخادم: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `al_azeza_db`
--

-- --------------------------------------------------------

--
-- بنية الجدول `camps`
--

CREATE TABLE `camps` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `camp_type` enum('day','residential') NOT NULL,
  `location` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `capacity` int(11) NOT NULL,
  `image_path` varchar(255) DEFAULT 'default_camp.jpg',
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `camps`
--

INSERT INTO `camps` (`id`, `title`, `camp_type`, `location`, `start_date`, `end_date`, `capacity`, `image_path`, `is_active`) VALUES
(1, 'مخيم الهرمل', 'residential', 'عين الزرقاء', '2026-01-01', '2027-01-01', 50, '/uploads/1783502197465.png', 1),
(2, 'مخيم شباب تل الفار', 'residential', 'الهرمل منطقة التل', '2025-12-31', '2026-12-31', 150, '/uploads/1783769228466.png', 1);

-- --------------------------------------------------------

--
-- بنية الجدول `camp_registrants`
--

CREATE TABLE `camp_registrants` (
  `id` int(11) NOT NULL,
  `camp_id` int(11) NOT NULL,
  `volunteer_name` varchar(255) NOT NULL,
  `volunteer_phone` varchar(50) NOT NULL,
  `volunteer_field` varchar(255) DEFAULT 'ميداني عام',
  `registration_status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `camp_registrants`
--

INSERT INTO `camp_registrants` (`id`, `camp_id`, `volunteer_name`, `volunteer_phone`, `volunteer_field`, `registration_status`, `registered_at`) VALUES
(1, 1, 'بلال السعيد الخليل', '0096176543210', '📐 هندسة فنية صيانة', 'pending', '2026-07-11 10:55:43'),
(2, 1, 'رائد منصور حداد', '0096171987654', '📦 دعم لوجستي وإمداد', 'pending', '2026-07-11 10:55:43');

-- --------------------------------------------------------

--
-- بنية الجدول `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `msg_type` enum('general','complaint','suggestion','coordination') DEFAULT 'general',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('new','processing','resolved') DEFAULT 'new',
  `assigned_to` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `full_name`, `phone`, `email`, `msg_type`, `subject`, `message`, `is_read`, `created_at`, `status`, `assigned_to`, `updated_at`) VALUES
(1, 'دكتور حافظ الهمة', '0096179323708', 'admin@azeza.org', 'coordination', 'تنسيق لوجستي للمستودع', 'يرجى مراجعة كشوفات تسليم المواد العينية الخاصة ببلدات قضاء بنت جبيل لتأكيد الحصص.', 0, '2026-07-10 06:43:50', 'processing', NULL, '2026-07-11 13:52:59'),
(3, 'عزيز حديد', '+20321000', 'salem@yahoo.com', 'complaint', 'شكوى', 'بحاجة إلى معدات بناء', 0, '2026-07-10 07:08:36', 'resolved', NULL, '2026-07-11 13:53:08'),
(4, 'سلام العلي', '+96179323708', 'fade@yahoo.com', 'coordination', 'خبز', 'شراء مراوح', 0, '2026-07-11 22:31:22', 'new', NULL, '2026-07-11 22:31:22');

-- --------------------------------------------------------

--
-- بنية الجدول `donations_pledges`
--

CREATE TABLE `donations_pledges` (
  `id` int(11) NOT NULL,
  `donor_type` enum('individual','institution') DEFAULT 'individual',
  `donor_name` varchar(255) NOT NULL,
  `donor_phone` varchar(50) NOT NULL,
  `donor_email` varchar(150) DEFAULT NULL,
  `donation_type` enum('money','goods','service','partnership') NOT NULL,
  `target_type` enum('general','operation','specific_need') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `amount_or_details` text NOT NULL,
  `pledge_status` enum('pending','verified','received','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `donations_pledges`
--

INSERT INTO `donations_pledges` (`id`, `donor_type`, `donor_name`, `donor_phone`, `donor_email`, `donation_type`, `target_type`, `target_id`, `amount_or_details`, `pledge_status`, `created_at`) VALUES
(1, 'individual', 'حافظ الهمة', '0096179323708', 'e.hafez@yahoo.com', 'money', 'specific_need', 5, 'تعهد عيني لتقديم بند: (خزان مياه عشرة براميل)', 'verified', '2026-07-08 14:04:33'),
(3, 'individual', 'فريال', '1236547', 'freal@gmail.com', 'service', 'specific_need', NULL, '900 $', 'verified', '2026-07-11 12:04:04');

-- --------------------------------------------------------

--
-- بنية الجدول `help_requests`
--

CREATE TABLE `help_requests` (
  `id` int(11) NOT NULL,
  `applicant_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `district` enum('tyre','bint_jbeil','nabatieh_marjayoun') NOT NULL,
  `village` varchar(255) NOT NULL,
  `damage_type` enum('total','partial','finishing','utilities') NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','processing','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `help_requests`
--

INSERT INTO `help_requests` (`id`, `applicant_name`, `phone`, `district`, `village`, `damage_type`, `notes`, `status`, `created_at`) VALUES
(1, 'محمد الأحمد', '0966316019', 'tyre', 'الخيام', 'total', '', 'pending', '2026-07-01 08:30:06');

-- --------------------------------------------------------

--
-- بنية الجدول `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_delivery_status` enum('success','failed','pending') DEFAULT 'pending',
  `error_log` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `newsletter_subscribers`
--

INSERT INTO `newsletter_subscribers` (`id`, `email`, `subscribed_at`, `last_delivery_status`, `error_log`) VALUES
(1, 'e.hafez@yahoo.com', '2026-07-08 09:29:05', 'success', NULL),
(2, 'tark@gmail.con', '2026-07-11 21:33:58', 'pending', NULL);

-- --------------------------------------------------------

--
-- بنية الجدول `news_articles`
--

CREATE TABLE `news_articles` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `category` enum('news','urgent_alert','field_update','new_operation','aid_delivery','partnership','report') DEFAULT 'news',
  `region` varchar(150) NOT NULL,
  `image_path` varchar(255) DEFAULT '/picture/default_news.jpg',
  `is_urgent_banner` tinyint(1) DEFAULT 0,
  `target_quantity` int(11) DEFAULT NULL,
  `current_quantity` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `news_articles`
--

INSERT INTO `news_articles` (`id`, `title`, `content`, `category`, `region`, `image_path`, `is_urgent_banner`, `target_quantity`, `current_quantity`, `created_at`) VALUES
(1, 'نحتاج إلى 1,000 كف حماية لفرق رفع الركام في بنت جبيل بشكل عاجل-', 'تأمين سلامة المتطوعين والفرق الميدانية العاملة على فتح الطرقات وإزالة الأنقاض في أحياء بلدة بنت جبيل المتضررة.', 'urgent_alert', 'بنت جبيل', '/picture/2.jpg', 1, 1000, 420, '2026-07-09 07:26:08'),
(3, 'وصول شحنة مواد نظافة وأدوات حماية شخصية إلى مستودع صور.', 'تسلم القسم اللوجستي شحنة عينية جديدة مقدمة من الشركاء لدعم العائلات والفرق العاملة في القرى المحيطة.', 'aid_delivery', 'صور', '/picture/2.jpg', 0, NULL, NULL, '2026-07-09 07:26:08'),
(4, 'شراكة جديدة مع جمعية الإغاثة الإسلامية لدعم مسار المياه في عيترون.', 'توقيع اتفاقية تعاون ميداني لربط وصيانة خطوط الضخ المتضررة وتأمين شبكة توزيع مياه صالحة للشرب.', 'partnership', 'بيروت', '/picture/1.jpg', 0, NULL, NULL, '2026-07-09 07:26:08'),
(5, 'شراء بدلات خاصة للعمل في ترميم المنازل', 'قامت الأكاديمية اللبنانية للمهارات والفنون بالتبرع لشراء بدلات خاصة العمل في ترميم البيوت', 'news', 'عيترون', '/uploads/1783595688307.jpg', 0, NULL, NULL, '2026-07-09 11:14:48'),
(6, 'شراء بدلات خاصة للعمل في ترميم المنازل', 'قامت المؤسسة اللبنانية بشراء بدلات خاصة للعمل في إزالة الأنقاض', 'field_update', 'عيترون', '/uploads/1783595979872.jpg', 0, NULL, NULL, '2026-07-09 11:19:39'),
(7, 'إعادة بناء ملعب الراية', 'إعادة بناء ملعب الراية بجهود مجموعة من المتبرعين', 'news', 'عيترون', '/picture/default_news.jpg', 0, NULL, NULL, '2026-07-11 13:26:25'),
(8, 'شراء تراكتور', 'تم جمع التبرعات لشراء جرار زراعي', 'field_update', 'الهرمل', '/picture/default_news.jpg', 0, NULL, NULL, '2026-07-11 22:22:24');

-- --------------------------------------------------------

--
-- بنية الجدول `operations`
--

CREATE TABLE `operations` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `region` varchar(255) NOT NULL,
  `operation_type` varchar(100) DEFAULT 'general',
  `allocated_budget` decimal(12,2) NOT NULL DEFAULT 0.00,
  `consumed_budget` decimal(12,2) NOT NULL DEFAULT 0.00,
  `heavy_equipment` varchar(255) DEFAULT 'بدون معدات ثقيلة',
  `progress_percent` int(11) DEFAULT 0,
  `status` enum('planned','active','in_progress','recent','completed') DEFAULT 'active',
  `image_path` varchar(255) DEFAULT 'default_op.jpg',
  `needed_icons` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `operations`
--

INSERT INTO `operations` (`id`, `title`, `description`, `region`, `operation_type`, `allocated_budget`, `consumed_budget`, `heavy_equipment`, `progress_percent`, `status`, `image_path`, `needed_icons`, `created_at`) VALUES
(2, 'ترميم في صور', NULL, 'قضار صور', 'general', 0.00, 0.00, 'بدون معدات ثقيلة', 60, 'active', '/uploads/1783516696700.png', '', '2026-07-08 13:18:16'),
(3, 'ترميم مدرسة في صور', NULL, 'صور', 'general', 5000.00, 250.00, 'شاحنة نقل لوجستي الكبير', 40, 'active', '/uploads/1783761105655.jpg', '', '2026-07-11 09:11:45');

-- --------------------------------------------------------

--
-- بنية الجدول `operation_needs`
--

CREATE TABLE `operation_needs` (
  `id` int(11) NOT NULL,
  `operation_id` int(11) DEFAULT NULL,
  `need_title` varchar(255) NOT NULL,
  `need_category` enum('material','logistic','financial','service') NOT NULL,
  `urgency_level` enum('casual','medium','urgent') DEFAULT 'medium',
  `required_quantity` int(11) NOT NULL DEFAULT 1,
  `received_quantity` int(11) NOT NULL DEFAULT 0,
  `unit_name` varchar(50) DEFAULT 'قطعة',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `operation_needs`
--

INSERT INTO `operation_needs` (`id`, `operation_id`, `need_title`, `need_category`, `urgency_level`, `required_quantity`, `received_quantity`, `unit_name`, `created_at`) VALUES
(1, NULL, 'مواد عزل مؤقتة (مأوى ميس الجبل)', 'material', 'medium', 150, 110, 'حزمة', '2026-07-08 13:29:39'),
(2, NULL, 'شاحنة وقود ونقل (الناقورة / مرون الراس)', 'logistic', 'urgent', 4, 2, 'شاحنة', '2026-07-08 13:29:39'),
(3, NULL, '500 متر كابلات كهربائية (الخيام)', 'material', 'urgent', 390, 110, 'متر', '2026-07-08 13:29:39'),
(4, NULL, 'مضخة مياه غاطسة (عيترون)', 'material', 'urgent', 2, 0, 'مضخة', '2026-07-08 13:29:39'),
(5, 2, 'خزان مياه عشرة براميل', 'logistic', 'medium', 5, 0, 'قطعة', '2026-07-08 14:03:01'),
(6, NULL, 'بحاجة إلى مد خط كهرباء 66 KVA', 'material', 'casual', 2, 0, 'متر', '2026-07-11 11:46:18'),
(7, NULL, 'بحاجة إلى مد خط كهرباء 66 KVA', 'material', 'medium', 1, 0, 'متر', '2026-07-11 12:02:17');

-- --------------------------------------------------------

--
-- بنية الجدول `platform_stats`
--

CREATE TABLE `platform_stats` (
  `id` int(11) NOT NULL,
  `stat_key` varchar(100) NOT NULL,
  `stat_value` bigint(20) DEFAULT 0,
  `is_daily` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `platform_stats`
--

INSERT INTO `platform_stats` (`id`, `stat_key`, `stat_value`, `is_daily`, `updated_at`) VALUES
(1, 'total_volunteer_hours', 50, 0, '2026-07-11 08:55:14'),
(2, 'total_regions', 50, 0, '2026-07-11 08:53:41'),
(3, 'total_beneficiaries', 50, 0, '2026-07-11 08:54:11'),
(4, 'total_aid_packages', 50, 0, '2026-07-11 08:54:19'),
(5, 'total_volunteers', 50, 0, '2026-07-11 08:54:27'),
(6, 'daily_families', 150, 1, '2026-07-11 08:55:34'),
(7, 'daily_meals', 150, 1, '2026-07-11 08:55:45'),
(8, 'daily_packages', 150, 1, '2026-07-11 08:55:53'),
(9, 'daily_sessions', 150, 1, '2026-07-11 08:55:59'),
(10, 'active_operations_count', 8, 0, '2026-07-08 12:55:42'),
(11, 'executed_tasks_count', 1247, 0, '2026-07-08 12:55:42'),
(12, 'total_financial_support', 50, 0, '2026-07-11 08:54:34');

-- --------------------------------------------------------

--
-- بنية الجدول `platform_stats_archive`
--

CREATE TABLE `platform_stats_archive` (
  `id` int(11) NOT NULL,
  `stat_key` varchar(100) NOT NULL,
  `stat_value` bigint(20) DEFAULT 0,
  `archived_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `display_name`) VALUES
(1, 'system_admin', '🛡️ مدير النظام'),
(2, 'central_admin', '🏛️ الإدارة المركزية'),
(3, 'area_coordinator', '🗺️ منسق منطقة'),
(4, 'sector_manager', '🌐 مسؤول قطاع'),
(5, 'town_manager', '🏠 مسؤول بلدة أو حي'),
(6, 'camp_director', '⛺ مدير مخيم'),
(7, 'logistic_officer', '📦 مسؤول لوجستي'),
(8, 'safety_officer', '🩺 مسؤول سلامة'),
(9, 'team_leader', '👨‍✈️ قائد فريق'),
(10, 'volunteers_manager', '🧑‍🤝‍🧑 مسؤول متطوعين'),
(11, 'donations_manager', '💰 مسؤول تبرعات'),
(12, 'media_officer', '📢 مسؤول إعلام'),
(13, 'auditor', '📊 مدقق');

-- --------------------------------------------------------

--
-- بنية الجدول `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `operation_id` int(11) DEFAULT NULL,
  `assigned_to` int(11) NOT NULL,
  `task_title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','on_hold','in_progress','completed') DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `timeline_updates`
--

CREATE TABLE `timeline_updates` (
  `id` int(11) NOT NULL,
  `update_text` varchar(255) NOT NULL,
  `hours_ago` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `timeline_updates`
--

INSERT INTO `timeline_updates` (`id`, `update_text`, `hours_ago`, `created_at`) VALUES
(1, 'توزيع 120 رزمة نظافة في عيترون.', 2, '2026-07-09 07:26:08'),
(2, 'أعمال تنظيف في محيط مركز الإيواء - المدرسة الرسمية - الخيام.', 5, '2026-07-09 07:26:08'),
(3, 'تأمين 350 كف حماية لفرق العمل.', 9, '2026-07-09 07:26:08'),
(4, 'إصلاح تمديد مياه فرعي في عيترون.', 12, '2026-07-09 07:26:08');

-- --------------------------------------------------------

--
-- بنية الجدول `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `region` varchar(150) DEFAULT 'عام',
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `users`
--

INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `phone`, `region`, `password_hash`, `is_active`, `created_at`) VALUES
(1, 1, 'د. حافظ الهمة', 'admin@azeza.org', '79323708', 'عام', '123', 1, '2026-07-07 12:38:09'),
(3, 6, 'جمعة الخالد', 'fade@yahoo.com', '96633669', 'عام', '123', 1, '2026-07-11 07:16:42'),
(4, 3, 'قاسم الغربي', 'kassem@yahoo.com', '987456', 'مرجعيون', '123', 1, '2026-07-11 08:15:25'),
(5, 6, 'منصور عزام', 'mnsour@gmail.com', '9874563', 'صور', '123', 1, '2026-07-11 08:36:15');

-- --------------------------------------------------------

--
-- بنية الجدول `volunteers`
--

CREATE TABLE `volunteers` (
  `id` int(11) NOT NULL,
  `volunteer_type` enum('individual','company') NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `field` varchar(255) NOT NULL,
  `specialty` enum('none','engineering','materials','logistics','electricity') DEFAULT 'none',
  `region` varchar(255) NOT NULL,
  `governorate` varchar(100) NOT NULL,
  `district` varchar(100) NOT NULL,
  `age_group` varchar(50) NOT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `origin` enum('inside','outside') DEFAULT 'inside',
  `available_days` varchar(255) DEFAULT NULL,
  `agreed_to_charter` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `volunteers`
--

INSERT INTO `volunteers` (`id`, `volunteer_type`, `name`, `phone`, `email`, `field`, `specialty`, `region`, `governorate`, `district`, `age_group`, `languages`, `origin`, `available_days`, `agreed_to_charter`, `created_at`) VALUES
(1, 'individual', 'حافظ الهمة', '79323708', NULL, 'activities', 'engineering', 'قضاء بنت جبيل', '', '', '', NULL, 'inside', NULL, 0, '2026-07-01 08:28:55'),
(2, 'individual', 'عبدو شعير', '00978963214', NULL, 'كهرباء', 'electricity', 'الخيام', 'النبطية', 'بنت جبيل', '26-35', 'العربية', 'inside', '7 أيام', 1, '2026-07-09 13:09:16'),
(3, 'individual', 'سليمان محمد الشعار', '0096321265487', NULL, 'دعم رقمي', 'electricity', 'بنت جبيل', 'الجنوب', 'صور', '18-25', 'العربية', 'inside', 'خمسة ايام', 1, '2026-07-09 13:26:22');

-- --------------------------------------------------------

--
-- بنية الجدول `volunteer_opportunities`
--

CREATE TABLE `volunteer_opportunities` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `region` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `required_specialty` enum('none','engineering','materials','logistics','electricity') NOT NULL DEFAULT 'none',
  `required_count` int(11) NOT NULL DEFAULT 1,
  `current_count` int(11) NOT NULL DEFAULT 0,
  `work_time` varchar(150) NOT NULL,
  `camp_type_display` varchar(100) DEFAULT 'تطوع ميداني',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `volunteer_opportunities`
--

INSERT INTO `volunteer_opportunities` (`id`, `title`, `region`, `description`, `required_specialty`, `required_count`, `current_count`, `work_time`, `camp_type_display`, `is_active`, `created_at`) VALUES
(1, 'إزالة مخلفات وفتح ممرات', 'بنت جبيل', 'تنظيف ممرات، فرز مواد، دعم فرق العمل الميدانية في الأحياء القديمة.', 'none', 15, 4, 'السبت - 8:00 صباحاً', 'تطوع ميداني', 1, '2026-07-09 12:06:34'),
(2, 'صيانة تمديدات مياه', 'عيترون', 'مساعدة الفنيين في صيانة شبكة الضخ الفرعية وتوصيل الخطوط المتضررة.', 'none', 5, 2, 'حسب التنسيق', 'سجل كفني', 1, '2026-07-09 12:06:34'),
(3, 'توضيب مساعدات', 'الخيام', 'فرز وتعبئة الحصص الغذائية والوجبات الساخنة وتجهيزها للتوزيع الميداني.', 'none', 20, 11, 'الأحد - 10:00 صباحاً', 'تطوع ميداني', 1, '2026-07-09 12:06:34'),
(4, 'إزالة الأنقاض في الشوارع والممرات والطرق الرئيسية', 'صور', 'إزالة الأنقاض في الشوارع والممرات والطرق الرئيسية في كافة الشوارع الرئيسية لتسهيل مرور قوافل العائدين', 'none', 6, 0, 'الأحد 8.00 مساءً', 'تطوع ميداني', 1, '2026-07-11 12:26:19'),
(5, 'حفر بئر', 'بنت جبيل', 'حفر بئر ارتوازي بعمق 150متر', 'none', 5, 0, 'الأحد 8.00 مساءً', 'تطوع ميداني', 1, '2026-07-11 12:31:00'),
(6, 'إعادة بناء مدرسة', 'صور', 'إعادة بناء مدرسة في صور', 'none', 6, 0, 'الأحد 8.00 مساءً', 'تطوع ميداني', 1, '2026-07-11 12:47:09'),
(7, 'إعادة ترميم مسجد', 'صور', 'إعادة ترميم مسجد الإمام علي عليه السلام', 'none', 10, 0, 'الأحد 8.00 مساءً', 'تطوع ميداني', 1, '2026-07-11 12:57:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `camps`
--
ALTER TABLE `camps`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `camp_registrants`
--
ALTER TABLE `camp_registrants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_camp_registrants_camp` (`camp_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `donations_pledges`
--
ALTER TABLE `donations_pledges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `help_requests`
--
ALTER TABLE `help_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `news_articles`
--
ALTER TABLE `news_articles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `operations`
--
ALTER TABLE `operations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `operation_needs`
--
ALTER TABLE `operation_needs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `operation_id` (`operation_id`);

--
-- Indexes for table `platform_stats`
--
ALTER TABLE `platform_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stat_key` (`stat_key`);

--
-- Indexes for table `platform_stats_archive`
--
ALTER TABLE `platform_stats_archive`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `operation_id` (`operation_id`),
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `timeline_updates`
--
ALTER TABLE `timeline_updates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `volunteers`
--
ALTER TABLE `volunteers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `volunteer_opportunities`
--
ALTER TABLE `volunteer_opportunities`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `camps`
--
ALTER TABLE `camps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `camp_registrants`
--
ALTER TABLE `camp_registrants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `donations_pledges`
--
ALTER TABLE `donations_pledges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `help_requests`
--
ALTER TABLE `help_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `news_articles`
--
ALTER TABLE `news_articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `operations`
--
ALTER TABLE `operations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `operation_needs`
--
ALTER TABLE `operation_needs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `platform_stats`
--
ALTER TABLE `platform_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `platform_stats_archive`
--
ALTER TABLE `platform_stats_archive`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `timeline_updates`
--
ALTER TABLE `timeline_updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `volunteers`
--
ALTER TABLE `volunteers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `volunteer_opportunities`
--
ALTER TABLE `volunteer_opportunities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- قيود الجداول المُلقاة.
--

--
-- قيود الجداول `camp_registrants`
--
ALTER TABLE `camp_registrants`
  ADD CONSTRAINT `fk_camp_registrants_camp` FOREIGN KEY (`camp_id`) REFERENCES `camps` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `operation_needs`
--
ALTER TABLE `operation_needs`
  ADD CONSTRAINT `operation_needs_ibfk_1` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`id`) ON DELETE SET NULL;

--
-- قيود الجداول `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
