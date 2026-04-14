import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    // Login
    operationsManagement: 'Operations Management System',
    emailOrUsername: 'Email or Username',
    enterEmailOrUsername: 'Enter email or username',
    loginWithEither: 'You can login with either your email address or username',
    password: 'Password',
    enterPassword: 'Enter your password',
    login: 'Login',
    loggingIn: 'Logging in...',
    defaultCredentials: 'Default owner credentials:',
    
    // Navigation
    dashboard: 'Dashboard',
    schedule: 'Schedule',
    staff: 'Staff',
    performance: 'Performance',
    attendance: 'Attendance',
    requests: 'Requests',
    penalties: 'Penalties',
    dailyChecklist: 'Daily Checklist',
    tutorials: 'Tutorials',
    logout: 'Logout',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    noData: 'No data available',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    branch: 'Branch',
    title: 'Title',
    phone: 'Phone Number',
    email: 'Email',
    
    // Staff Form
    createStaffProfile: 'Create Staff Profile',
    editStaffProfile: 'Edit Staff Profile',
    fullName: 'Full Name',
    username: 'Username',
    dateOfBirth: 'Date of Birth',
    startDate: 'Start Date',
    idNumber: 'ID Number',
    payrollInfo: 'Payroll Info',
    selectBranch: 'Select Branch',
    selectTitle: 'Select Title',
    
    // Schedule
    weeklySchedule: 'Weekly Schedule',
    addStaff: 'Add Staff',
    submitToHR: 'Submit to HR',
    resubmitToHR: 'Resubmit to HR',
    submitting: 'Submitting...',
    scheduleSubmitted: 'Schedule Submitted',
    scheduleEdited: 'Schedule Edited After Submission',
    viewOnly: 'View Only',
    schedulesCreatedBy: 'Schedules are created by Branch Managers',
    morning: 'Morning',
    evening: 'Evening',
    station: 'Station',
    stationRequirements: 'Station Requirements',
    
    // Performance
    performanceRating: 'Performance Rating',
    hygieneGrooming: 'Hygiene & Grooming',
    ratePerformance: 'Rate Performance',
    totalScore: 'Total Score',
    notes: 'Notes',
    viewHistory: 'View History',
    
    // Attendance
    attendanceRecords: 'Attendance Records',
    clockIn: 'Clock In',
    clockOut: 'Clock Out',
    lateMinutes: 'Late Minutes',
    overtime: 'Overtime',
    absent: 'Absent',
    present: 'Present',
    
    // Requests
    leaveRequests: 'Leave Requests',
    newRequest: 'New Request',
    requestType: 'Request Type',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    reason: 'Reason',
    approve: 'Approve',
    deny: 'Deny',
    pending: 'Pending',
    approved: 'Approved',
    denied: 'Denied',
    awaitingHR: 'Awaiting HR Review',
    
    // Penalties
    penaltyRecords: 'Penalty Records',
    recordPenalty: 'Record Penalty',
    penaltyType: 'Penalty Type',
    description: 'Description',
    severity: 'Severity',
    
    // Daily Checklist
    openChecklist: 'Open Checklist',
    closeChecklist: 'Close Checklist',
    cleaning: 'Cleaning',
    safetyCheck: 'Safety Check',
    defrost: 'Defrost',
    outdoorCheck: 'Outdoor Check',
    checkTemperature: 'Check Temperature',
    itemsInFreezers: 'Items in Freezers',
    itemsInFridge: 'Items in Under Counter Fridge',
    vegetables: 'Vegetables',
    sauces: 'Sauces',
    completed: 'Completed',
    
    // Owner Dashboard
    ownerDashboard: 'Owner Dashboard',
    staffMembers: 'staff members',
    
    // Branches
    mivida: 'Mivida',
    leven: 'Leven',
    sodic: 'Sodic Villete',
    arkan: 'Arkan',
    palmHills: 'Palm Hills',
    multiBranch: 'Multi-Branch',
    
    // Titles
    crew: 'Crew',
    cashier: 'Cashier',
    lineLeader: 'Line Leader',
    supervisor: 'Supervisor',
    assistantManager: 'Assistant Manager',
    branchManager: 'Branch Manager',
    areaManager: 'Area Manager',
    operationsManager: 'Operations Manager',
    
    // Stations
    manager: 'Manager',
    fryer: 'Fryer',
    grill: 'Grill',
    dress: 'Dress',
    pickup: 'Pickup',
  },
  ar: {
    // Login
    operationsManagement: 'نظام إدارة العمليات',
    emailOrUsername: 'البريد الإلكتروني أو اسم المستخدم',
    enterEmailOrUsername: 'أدخل البريد الإلكتروني أو اسم المستخدم',
    loginWithEither: 'يمكنك تسجيل الدخول باستخدام بريدك الإلكتروني أو اسم المستخدم',
    password: 'كلمة المرور',
    enterPassword: 'أدخل كلمة المرور',
    login: 'تسجيل الدخول',
    loggingIn: 'جاري تسجيل الدخول...',
    defaultCredentials: 'بيانات المالك الافتراضية:',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    schedule: 'الجدول',
    staff: 'الموظفين',
    performance: 'الأداء',
    attendance: 'الحضور',
    requests: 'الطلبات',
    penalties: 'العقوبات',
    dailyChecklist: 'قائمة المهام اليومية',
    tutorials: 'الدروس',
    logout: 'تسجيل الخروج',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    submit: 'إرسال',
    search: 'بحث',
    filter: 'تصفية',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    name: 'الاسم',
    branch: 'الفرع',
    title: 'المسمى الوظيفي',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    
    // Staff Form
    createStaffProfile: 'إنشاء ملف موظف',
    editStaffProfile: 'تعديل ملف موظف',
    fullName: 'الاسم الكامل',
    username: 'اسم المستخدم',
    dateOfBirth: 'تاريخ الميلاد',
    startDate: 'تاريخ البدء',
    idNumber: 'رقم الهوية',
    payrollInfo: 'معلومات الرواتب',
    selectBranch: 'اختر الفرع',
    selectTitle: 'اختر المسمى',
    
    // Schedule
    weeklySchedule: 'الجدول الأسبوعي',
    addStaff: 'إضافة موظف',
    submitToHR: 'إرسال للموارد البشرية',
    resubmitToHR: 'إعادة الإرسال للموارد البشرية',
    submitting: 'جاري الإرسال...',
    scheduleSubmitted: 'تم إرسال الجدول',
    scheduleEdited: 'تم تعديل الجدول بعد الإرسال',
    viewOnly: 'عرض فقط',
    schedulesCreatedBy: 'يتم إنشاء الجداول بواسطة مديري الفروع',
    morning: 'صباحي',
    evening: 'مسائي',
    station: 'المحطة',
    stationRequirements: 'متطلبات المحطات',
    
    // Performance
    performanceRating: 'تقييم الأداء',
    hygieneGrooming: 'النظافة والمظهر',
    ratePerformance: 'تقييم الأداء',
    totalScore: 'المجموع الكلي',
    notes: 'ملاحظات',
    viewHistory: 'عرض السجل',
    
    // Attendance
    attendanceRecords: 'سجلات الحضور',
    clockIn: 'وقت الحضور',
    clockOut: 'وقت الانصراف',
    lateMinutes: 'دقائق التأخير',
    overtime: 'الوقت الإضافي',
    absent: 'غائب',
    present: 'حاضر',
    
    // Requests
    leaveRequests: 'طلبات الإجازة',
    newRequest: 'طلب جديد',
    requestType: 'نوع الطلب',
    startDateLabel: 'تاريخ البدء',
    endDateLabel: 'تاريخ الانتهاء',
    reason: 'السبب',
    approve: 'موافقة',
    deny: 'رفض',
    pending: 'قيد الانتظار',
    approved: 'تمت الموافقة',
    denied: 'مرفوض',
    awaitingHR: 'في انتظار مراجعة الموارد البشرية',
    
    // Penalties
    penaltyRecords: 'سجلات العقوبات',
    recordPenalty: 'تسجيل عقوبة',
    penaltyType: 'نوع العقوبة',
    description: 'الوصف',
    severity: 'الشدة',
    
    // Daily Checklist
    openChecklist: 'قائمة الافتتاح',
    closeChecklist: 'قائمة الإغلاق',
    cleaning: 'التنظيف',
    safetyCheck: 'فحص السلامة',
    defrost: 'إذابة الثلج',
    outdoorCheck: 'فحص الخارج',
    checkTemperature: 'فحص درجة الحرارة',
    itemsInFreezers: 'المواد في الفريزر',
    itemsInFridge: 'المواد في الثلاجة',
    vegetables: 'الخضروات',
    sauces: 'الصلصات',
    completed: 'مكتمل',
    
    // Owner Dashboard
    ownerDashboard: 'لوحة تحكم المالك',
    staffMembers: 'موظفين',
    
    // Branches
    mivida: 'ميفيدا',
    leven: 'ليفن',
    sodic: 'سوديك فيليت',
    arkan: 'أركان',
    palmHills: 'بالم هيلز',
    multiBranch: 'متعدد الفروع',
    
    // Titles
    crew: 'طاقم',
    cashier: 'كاشير',
    lineLeader: 'قائد خط',
    supervisor: 'مشرف',
    assistantManager: 'مساعد مدير',
    branchManager: 'مدير فرع',
    areaManager: 'مدير منطقة',
    operationsManager: 'مدير عمليات',
    
    // Stations
    manager: 'مدير',
    fryer: 'قلاية',
    grill: 'شواية',
    dress: 'تجهيز',
    pickup: 'استلام',
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    // Set document direction for RTL support
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

