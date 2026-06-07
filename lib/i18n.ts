export type Language = 'uz' | 'ru' | 'en'

export const translations = {
  uz: {
    // Navigation
    nav_services: "Xizmatlar",
    nav_projects: "Loyihalar",
    nav_freelancers: "Freelancerlar",
    nav_pricing: "Narxlar",
    nav_dashboard: "Bosh sahifa",
    nav_orders: "Buyurtmalar",
    nav_messages: "Xabarlar",
    nav_wallet: "Hamyon",
    nav_my_services: "Xizmatlarim",
    nav_skill_tests: "Ko'nikma Testlari",
    nav_profile: "Profil",
    nav_settings: "Sozlamalar",
    nav_logout: "Chiqish",

    // Hero Section
    hero_title: "O'zbekistonning №1 Freelance Platformasi",
    hero_sub: "Kworkdan 4x arzon — 0% komissiya",
    btn_find_work: "Ish top",
    btn_give_work: "Ish ber",
    
    // Auth
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    email: "Email",
    password: "Parol",
    confirm_password: "Parolni tasdiqlash",
    remember_me: "Meni eslab qol",
    forgot_password: "Parolni unutdingizmi?",
    sign_in: "Kirish",
    sign_up: "Ro'yxatdan o'tish",
    
    // Stats
    stats_freelancers: "Freelancer",
    stats_clients: "Mijoz",
    stats_projects: "Loyiha",
    stats_rating: "O'rtacha reyting",
    
    // Categories
    categories_title: "Kategoriyalar",
    categories_web_dev: "Web Dizayn",
    categories_mobile: "Mobil Dastur",
    categories_design: "Grafik Dizayn",
    categories_writing: "Yozish",
    categories_marketing: "Marketing",
    categories_translation: "Tarjima",
    categories_music: "Musiqa",
    categories_video: "Video",
    
    // How it works
    how_title: "Qanday ishlaydi?",
    step1: "Ro'yxatdan o't",
    step2: "Xizmat e'lon qil",
    step3: "Pul ol",
    
    // Why IshBor
    why_title: "Nima uchun IshBor?",
    why_zero_commission: "0% komissiya",
    why_local_payment: "Click/Payme to'lovlari",
    why_uzbek_language: "O'zbek tili",
    why_fast_withdrawal: "24 soat ichida pul yechish",
    why_escrow: "Escrow himoya",
    why_ai_assistant: "AI Yordam",
    why_auto_contract: "Avtomatik shartnoma",
    why_video_call: "Video qo'ng'iroq",
    
    // Common
    footer_rights: "Barcosmos huquqlar himoyalangan",
    all_rights_reserved: "Barcha huquqlar himoyalangan",
    verified: "Tasdiqlangan",
    online: "Onlayn",
    offline: "Oflayn",
    
    // Register
    role_freelancer: "Men Freelancerman",
    role_client: "Men Mijozman",
    select_role: "Rolni tanlang",
    freelancer_desc: "Xizmat berib daromad qilish uchun",
    client_desc: "Freelancerlarda buyurtma beradigan bosh hajviy tashkilotchilar uchun",
    continue: "Davom etish",
    create_profile: "Profilni yaratish",
    
    // Profile
    full_name: "Ism va Familiya",
    phone: "Telefon",
    city: "Shahar",
    bio: "Bio",
    specialty: "Mutaxassislik",
    skills: "Ko'nikmalar",
    experience: "Tajriba",
    portfolio: "Portfolio",
    video_intro: "Video taqdimot",
    upload_avatar: "Avatarni yuklang",
    upload_video: "60 soniyalik video yuklang",
    years_of_experience: "yil tajriba",
    
    // Projects
    project_name: "Loyiha nomi",
    project_description: "Tavsifi",
    project_budget: "Byudjet",
    project_deadline: "Muddat",
    project_category: "Kategoriya",
    budget_type_fixed: "Sobit",
    budget_type_hourly: "Soatlik",
    experience_level: "Tajriba darajasi",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    post_project: "Loyihani joylashtirish",
    
    // Services
    services: "Xizmatlar",
    service_from: "dan",
    starting_price: "dan 50,000 so'm",
    order_now: "Buyurtma berish",
    filters: "Filtrlar",
    price_range: "Narx oralig'i",
    delivery_time: "Yetkazish vaqti",
    rating: "Reyting",
    verified_only: "Faqat tasdiqlangan",
    has_video_portfolio: "Video portfolio bor",
    clear_filters: "Filtrni tozalash",
    
    // Messages
    messages: "Xabarlar",
    send_message: "Xabar yuborish",
    type_message: "Xabarni kiriting...",
    contracts: "Shartnomalar",
    video_call: "Video qo'ng'iroq",
    
    // Wallet
    wallet: "Hamyon",
    balance: "Balans",
    escrow: "Escrow",
    protected_in_escrow: "himoyada",
    withdrawals: "Pul yechish",
    withdraw: "Yechish",
    topup: "To'ldirish",
    payment_methods: "To'lov usullari",
    transaction_history: "Tranzaksiyalar tarixi",
    
    // Dashboard
    hello: "Salom",
    this_month: "Bu oy",
    total_earned: "Jami kirim",
    total_spent: "Jami chiqim",
    active_orders: "Faol buyurtmalar",
    earnings_chart: "Daromad grafigi",
    recent_messages: "So'nggi xabarlar",
    featured_freelancers: "Asosiy freelancerlar",
    recommended_freelancers: "Tavsiya qilingan freelancerlar",
    
    // Status
    pending: "Kutilmoqda",
    in_progress: "Jarayonda",
    completed: "Bajarildi",
    cancelled: "Bekor qilindi",
    
    // Errors
    error_required: "Bu maydon to'ldirilishi kerak",
    error_email: "Email noto'g'ri",
    error_password_short: "Parol hech bo'lmaganda 8 belgidan iborat bo'lishi kerak",
  },

  ru: {
    // Navigation
    nav_services: "Услуги",
    nav_projects: "Проекты",
    nav_freelancers: "Фрилансеры",
    nav_pricing: "Цены",
    nav_dashboard: "Главная",
    nav_orders: "Заказы",
    nav_messages: "Сообщения",
    nav_wallet: "Кошелек",
    nav_my_services: "Мои услуги",
    nav_skill_tests: "Тесты навыков",
    nav_profile: "Профиль",
    nav_settings: "Настройки",
    nav_logout: "Выход",

    // Hero Section
    hero_title: "Фриланс платформа №1 в Узбекистане",
    hero_sub: "В 4 раза дешевле Kwork — комиссия 0%",
    btn_find_work: "Найти работу",
    btn_give_work: "Дать работу",
    
    // Auth
    login: "Войти",
    register: "Регистрация",
    email: "Email",
    password: "Пароль",
    confirm_password: "Подтвердите пароль",
    remember_me: "Запомнить меня",
    forgot_password: "Забыли пароль?",
    sign_in: "Войти",
    sign_up: "Зарегистрироваться",
    
    // Stats
    stats_freelancers: "Фрилансер",
    stats_clients: "Клиент",
    stats_projects: "Проект",
    stats_rating: "Средний рейтинг",
    
    // Categories
    categories_title: "Категории",
    categories_web_dev: "Веб-дизайн",
    categories_mobile: "Мобильные приложения",
    categories_design: "Графический дизайн",
    categories_writing: "Написание",
    categories_marketing: "Маркетинг",
    categories_translation: "Перевод",
    categories_music: "Музыка",
    categories_video: "Видео",
    
    // How it works
    how_title: "Как это работает?",
    step1: "Зарегистрируйся",
    step2: "Опубликуй услугу",
    step3: "Получи деньги",
    
    // Why IshBor
    why_title: "Почему IshBor?",
    why_zero_commission: "0% комиссия",
    why_local_payment: "Платежи Click/Payme",
    why_uzbek_language: "Узбекский язык",
    why_fast_withdrawal: "Вывод в течение 24 часов",
    why_escrow: "Защита Escrow",
    why_ai_assistant: "AI помощник",
    why_auto_contract: "Автоматический контракт",
    why_video_call: "Видео-звонок",
    
    // Common
    footer_rights: "Все права защищены",
    all_rights_reserved: "Все права защищены",
    verified: "Проверено",
    online: "В сети",
    offline: "Оффлайн",
    
    // Register
    role_freelancer: "Я фрилансер",
    role_client: "Я клиент",
    select_role: "Выберите роль",
    freelancer_desc: "Предоставляй услуги и зарабатывай",
    client_desc: "Нанимай фрилансеров и выполняй проекты",
    continue: "Продолжить",
    create_profile: "Создать профиль",
    
    // Profile
    full_name: "Имя и фамилия",
    phone: "Телефон",
    city: "Город",
    bio: "Биография",
    specialty: "Специальность",
    skills: "Навыки",
    experience: "Опыт",
    portfolio: "Портфолио",
    video_intro: "Видео-представление",
    upload_avatar: "Загрузить аватар",
    upload_video: "Загрузить видео (60 секунд)",
    years_of_experience: "лет опыта",
    
    // Projects
    project_name: "Название проекта",
    project_description: "Описание",
    project_budget: "Бюджет",
    project_deadline: "Срок",
    project_category: "Категория",
    budget_type_fixed: "Фиксированный",
    budget_type_hourly: "Почасовой",
    experience_level: "Уровень опыта",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    post_project: "Разместить проект",
    
    // Services
    services: "Услуги",
    service_from: "от",
    starting_price: "от 50 000 сум",
    order_now: "Заказать",
    filters: "Фильтры",
    price_range: "Диапазон цен",
    delivery_time: "Время доставки",
    rating: "Рейтинг",
    verified_only: "Только проверенные",
    has_video_portfolio: "Есть видео-портфолио",
    clear_filters: "Очистить фильтры",
    
    // Messages
    messages: "Сообщения",
    send_message: "Отправить сообщение",
    type_message: "Напишите сообщение...",
    contracts: "Контракты",
    video_call: "Видео-звонок",
    
    // Wallet
    wallet: "Кошелек",
    balance: "Баланс",
    escrow: "Escrow",
    protected_in_escrow: "защищено",
    withdrawals: "Выводы",
    withdraw: "Вывести",
    topup: "Пополнить",
    payment_methods: "Способы оплаты",
    transaction_history: "История транзакций",
    
    // Dashboard
    hello: "Привет",
    this_month: "Этот месяц",
    total_earned: "Всего заработано",
    total_spent: "Всего потрачено",
    active_orders: "Активные заказы",
    earnings_chart: "График заработков",
    recent_messages: "Последние сообщения",
    featured_freelancers: "Избранные фрилансеры",
    recommended_freelancers: "Рекомендуемые фрилансеры",
    
    // Status
    pending: "В ожидании",
    in_progress: "В процессе",
    completed: "Завершено",
    cancelled: "Отменено",
    
    // Errors
    error_required: "Это поле обязательно",
    error_email: "Неверный email",
    error_password_short: "Пароль должен быть не менее 8 символов",
  },

  en: {
    // Navigation
    nav_services: "Services",
    nav_projects: "Projects",
    nav_freelancers: "Freelancers",
    nav_pricing: "Pricing",
    nav_dashboard: "Dashboard",
    nav_orders: "Orders",
    nav_messages: "Messages",
    nav_wallet: "Wallet",
    nav_my_services: "My Services",
    nav_skill_tests: "Skill Tests",
    nav_profile: "Profile",
    nav_settings: "Settings",
    nav_logout: "Logout",

    // Hero Section
    hero_title: "Uzbekistan's #1 Freelance Platform",
    hero_sub: "4x cheaper than Kwork — 0% commission",
    btn_find_work: "Find Work",
    btn_give_work: "Post a Job",
    
    // Auth
    login: "Login",
    register: "Sign Up",
    email: "Email",
    password: "Password",
    confirm_password: "Confirm Password",
    remember_me: "Remember me",
    forgot_password: "Forgot password?",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    
    // Stats
    stats_freelancers: "Freelancers",
    stats_clients: "Clients",
    stats_projects: "Projects",
    stats_rating: "Average Rating",
    
    // Categories
    categories_title: "Categories",
    categories_web_dev: "Web Design",
    categories_mobile: "Mobile Apps",
    categories_design: "Graphic Design",
    categories_writing: "Writing",
    categories_marketing: "Marketing",
    categories_translation: "Translation",
    categories_music: "Music",
    categories_video: "Video",
    
    // How it works
    how_title: "How it works?",
    step1: "Sign up",
    step2: "Post service",
    step3: "Get paid",
    
    // Why IshBor
    why_title: "Why IshBor?",
    why_zero_commission: "0% commission",
    why_local_payment: "Click/Payme payments",
    why_uzbek_language: "Uzbek language",
    why_fast_withdrawal: "24h withdrawal",
    why_escrow: "Escrow protection",
    why_ai_assistant: "AI Assistant",
    why_auto_contract: "Auto contract",
    why_video_call: "Video call",
    
    // Common
    footer_rights: "All rights reserved",
    all_rights_reserved: "All rights reserved",
    verified: "Verified",
    online: "Online",
    offline: "Offline",
    
    // Register
    role_freelancer: "I'm a Freelancer",
    role_client: "I'm a Client",
    select_role: "Select your role",
    freelancer_desc: "Provide services and earn money",
    client_desc: "Hire freelancers and get work done",
    continue: "Continue",
    create_profile: "Create Profile",
    
    // Profile
    full_name: "Full Name",
    phone: "Phone",
    city: "City",
    bio: "Bio",
    specialty: "Specialty",
    skills: "Skills",
    experience: "Experience",
    portfolio: "Portfolio",
    video_intro: "Video intro",
    upload_avatar: "Upload avatar",
    upload_video: "Upload video (60 seconds)",
    years_of_experience: "years experience",
    
    // Projects
    project_name: "Project name",
    project_description: "Description",
    project_budget: "Budget",
    project_deadline: "Deadline",
    project_category: "Category",
    budget_type_fixed: "Fixed",
    budget_type_hourly: "Hourly",
    experience_level: "Experience level",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    post_project: "Post Project",
    
    // Services
    services: "Services",
    service_from: "from",
    starting_price: "from 50,000 UZS",
    order_now: "Order Now",
    filters: "Filters",
    price_range: "Price range",
    delivery_time: "Delivery time",
    rating: "Rating",
    verified_only: "Verified only",
    has_video_portfolio: "Has video portfolio",
    clear_filters: "Clear filters",
    
    // Messages
    messages: "Messages",
    send_message: "Send message",
    type_message: "Type your message...",
    contracts: "Contracts",
    video_call: "Video call",
    
    // Wallet
    wallet: "Wallet",
    balance: "Balance",
    escrow: "Escrow",
    protected_in_escrow: "protected",
    withdrawals: "Withdrawals",
    withdraw: "Withdraw",
    topup: "Top up",
    payment_methods: "Payment methods",
    transaction_history: "Transaction history",
    
    // Dashboard
    hello: "Hello",
    this_month: "This month",
    total_earned: "Total earned",
    total_spent: "Total spent",
    active_orders: "Active orders",
    earnings_chart: "Earnings chart",
    recent_messages: "Recent messages",
    featured_freelancers: "Featured freelancers",
    recommended_freelancers: "Recommended freelancers",
    
    // Status
    pending: "Pending",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    
    // Errors
    error_required: "This field is required",
    error_email: "Invalid email",
    error_password_short: "Password must be at least 8 characters",
  }
} as const

export function t(language: Language, key: keyof typeof translations.uz): string {
  return translations[language][key] || key
}
