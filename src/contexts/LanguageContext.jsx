import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  ar: {
    // Navigation
    companyName: 'إسلام للألوميتال',
    createOrder: 'إنشاء طلب جديد',
    viewOrders: 'عرض جميع الطلبات',
    
    // Create Order Page
    createNewOrder: 'إنشاء طلب جديد',
    updateOrder: 'تحديث الطلب',
    customerName: 'اسم العميل',
    enterCustomerName: 'أدخل اسم العميل',
    orderDetails: 'تفاصيل الطلب',
    item: 'عنصر',
    deleteItem: 'حذف العنصر',
    width: 'العرض',
    length: 'الطول',
    area: 'المساحة',
    quantity: 'الكمية',
    category: 'الفئة',
    pricePerMeter: 'سعر المتر',
    total: 'الإجمالي',
    notes: 'ملاحظات',
    chooseCategory: 'اختر الفئة',
    windows: 'نوافذ',
    doors: 'أبواب',
    kitchens: 'مطابخ',
    windows2: 'شبابيك',
    other: 'أخرى',
    anyAdditionalNotes: 'أي ملاحظات إضافية...',
    addNewItem: 'إضافة عنصر جديد',
    grandTotal: 'الإجمالي الكلي',
    saveOrder: 'حفظ الطلب',
    saving: 'جاري الحفظ...',
    viewAllOrders: 'عرض جميع الطلبات',
    meter: 'متر',
    centimeter: 'سم',
    squareMeter: 'م²',
    squareCentimeter: 'سم²',
    currency: 'جنيه',
    unit: 'الوحدة',
    selectUnit: 'اختر الوحدة',
    
    // Orders List Page
    allOrders: 'جميع الطلبات',
    searchOrders: 'البحث في الطلبات...',
    exportToJSON: 'تصدير إلى JSON',
    importFromJSON: 'استيراد من JSON',
    customer: 'اسم العميل',
    numberOfItems: 'عدد العناصر',
    totalAmount: 'الإجمالي',
    creationDate: 'تاريخ الإنشاء',
    actions: 'الإجراءات',
    view: 'عرض',
    update: 'تحديث',
    delete: 'حذف',
    noOrdersFound: 'لا توجد طلبات تطابق البحث',
    noOrdersYet: 'لا توجد طلبات بعد',
    ordersSummary: 'ملخص الطلبات',
    totalOrders: 'إجمالي الطلبات',
    totalAmount2: 'إجمالي المبلغ',
    loading: 'جاري التحميل...',
    
    // Order View Page
    orderDetails2: 'تفاصيل الطلب',
    generatePDFInvoice: 'إنشاء فاتورة PDF',
    deleteOrder: 'حذف الطلب',
    backToOrders: 'العودة للطلبات',
    orderNotFound: 'الطلب غير موجود',
    backToOrders2: 'العودة للطلبات',
    invoice: 'فاتورة طلب',
    orderDate: 'تاريخ الطلب',
    customerData: 'بيانات العميل',
    name: 'الاسم',
    orderNumber: 'رقم الطلب',
    creationDate2: 'تاريخ الإنشاء',
    orderDetails3: 'تفاصيل الطلب',
    grandTotal2: 'الإجمالي الكلي',
    numberOfItems2: 'عدد العناصر',
    thankYou: 'شكراً لاختياركم خدماتنا',
    allRightsReserved: 'إسلام للألوميتال - جميع الحقوق محفوظة',
    
    // Messages
    pleaseEnterCustomerName: 'يرجى إدخال اسم العميل',
    pleaseFillAllRequiredFields: 'يرجى ملء جميع الحقول المطلوبة',
    orderCreatedSuccessfully: 'تم إنشاء الطلب بنجاح!',
    orderUpdatedSuccessfully: 'تم تحديث الطلب بنجاح!',
    errorCreatingOrder: 'حدث خطأ أثناء إنشاء الطلب',
    errorUpdatingOrder: 'حدث خطأ أثناء تحديث الطلب',
    errorLoadingOrders: 'حدث خطأ أثناء تحميل الطلبات',
    orderDeletedSuccessfully: 'تم حذف الطلب بنجاح',
    errorDeletingOrder: 'حدث خطأ أثناء حذف الطلب',
        confirmDeleteOrder: 'هل أنت متأكد من حذف هذا الطلب؟',
        thisActionCannotBeUndone: 'هذا الإجراء لا يمكن التراجع عنه',
        cancel: 'إلغاء',
        deleting: 'جاري الحذف',
    dataExportedSuccessfully: 'تم تصدير البيانات بنجاح',
    errorExportingData: 'حدث خطأ أثناء تصدير البيانات',
    dataImportedSuccessfully: 'تم استيراد البيانات بنجاح',
    errorImportingData: 'حدث خطأ أثناء استيراد البيانات',
    invalidFile: 'ملف غير صالح',
    invoiceGeneratedSuccessfully: 'تم إنشاء الفاتورة بنجاح',
    errorGeneratingInvoice: 'حدث خطأ أثناء إنشاء الفاتورة',
    errorLoadingOrder: 'حدث خطأ أثناء تحميل الطلب',
    orderNotFound2: 'الطلب غير موجود'
  },
  en: {
    // Navigation
    companyName: 'Eslam for Aluminum',
    createOrder: 'Create New Order',
    viewOrders: 'View All Orders',
    
    // Create Order Page
    createNewOrder: 'Create New Order',
    updateOrder: 'Update Order',
    customerName: 'Customer Name',
    enterCustomerName: 'Enter customer name',
    orderDetails: 'Order Details',
    item: 'Item',
    deleteItem: 'Delete Item',
    width: 'Width',
    length: 'Length',
    area: 'Area',
    quantity: 'Quantity',
    category: 'Category',
    pricePerMeter: 'Price per Meter',
    total: 'Total',
    notes: 'Notes',
    chooseCategory: 'Choose Category',
    windows: 'Windows',
    doors: 'Doors',
    kitchens: 'Kitchens',
    windows2: 'Window Frames',
    other: 'Other',
    anyAdditionalNotes: 'Any additional notes...',
    addNewItem: 'Add New Item',
    grandTotal: 'Grand Total',
    saveOrder: 'Save Order',
    saving: 'Saving...',
    viewAllOrders: 'View All Orders',
    meter: 'm',
    centimeter: 'cm',
    squareMeter: 'm²',
    squareCentimeter: 'cm²',
    currency: 'EGP',
    unit: 'Unit',
    selectUnit: 'Select Unit',
    
    // Orders List Page
    allOrders: 'All Orders',
    searchOrders: 'Search orders...',
    exportToJSON: 'Export to JSON',
    importFromJSON: 'Import from JSON',
    customer: 'Customer',
    numberOfItems: 'Number of Items',
    totalAmount: 'Total Amount',
    creationDate: 'Creation Date',
    actions: 'Actions',
    view: 'View',
    update: 'Update',
    delete: 'Delete',
    noOrdersFound: 'No orders match the search',
    noOrdersYet: 'No orders yet',
    ordersSummary: 'Orders Summary',
    totalOrders: 'Total Orders',
    totalAmount2: 'Total Amount',
    loading: 'Loading...',
    
    // Order View Page
    orderDetails2: 'Order Details',
    generatePDFInvoice: 'Generate PDF Invoice',
    deleteOrder: 'Delete Order',
    backToOrders: 'Back to Orders',
    orderNotFound: 'Order not found',
    backToOrders2: 'Back to Orders',
    invoice: 'Order Invoice',
    orderDate: 'Order Date',
    customerData: 'Customer Data',
    name: 'Name',
    orderNumber: 'Order Number',
    creationDate2: 'Creation Date',
    orderDetails3: 'Order Details',
    grandTotal2: 'Grand Total',
    numberOfItems2: 'Number of Items',
    thankYou: 'Thank you for choosing our services',
    allRightsReserved: 'Eslam for Aluminum - All rights reserved',
    
    // Messages
    pleaseEnterCustomerName: 'Please enter customer name',
    pleaseFillAllRequiredFields: 'Please fill all required fields',
    orderCreatedSuccessfully: 'Order created successfully!',
    orderUpdatedSuccessfully: 'Order updated successfully!',
    errorCreatingOrder: 'Error creating order',
    errorUpdatingOrder: 'Error updating order',
    errorLoadingOrders: 'Error loading orders',
    orderDeletedSuccessfully: 'Order deleted successfully',
    errorDeletingOrder: 'Error deleting order',
        confirmDeleteOrder: 'Are you sure you want to delete this order?',
        thisActionCannotBeUndone: 'This action cannot be undone',
        cancel: 'Cancel',
        deleting: 'Deleting',
    dataExportedSuccessfully: 'Data exported successfully',
    errorExportingData: 'Error exporting data',
    dataImportedSuccessfully: 'Data imported successfully',
    errorImportingData: 'Error importing data',
    invalidFile: 'Invalid file',
    invoiceGeneratedSuccessfully: 'Invoice generated successfully',
    errorGeneratingInvoice: 'Error generating invoice',
    errorLoadingOrder: 'Error loading order',
    orderNotFound2: 'Order not found'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar';
  });

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
