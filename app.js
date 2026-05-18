const STORAGE_KEYS = {
  products: "shopflow-products",
  sales: "shopflow-sales",
  settings: "shopflow-settings",
  language: "shopflow-language",
  template: "shopflow-template",
  receiptTemplates: "shopflow-receipt-templates",
  barcodeLabelTemplate: "shopflow-barcode-label-template",
  barcodeTemplates: "shopflow-barcode-templates",
};

const seedProducts = [
  {
    id: crypto.randomUUID(),
    name: "Signature Milk Tea",
    nameVi: "Trà sữa đặc biệt",
    category: "Beverage",
    barcode: "8938505970012",
    price: 45000,
    stock: 36,
  },
  {
    id: crypto.randomUUID(),
    name: "Cold Brew Coffee",
    nameVi: "Cà phê ủ lạnh",
    category: "Beverage",
    barcode: "8938505970013",
    price: 52000,
    stock: 22,
  },
  {
    id: crypto.randomUUID(),
    name: "Butter Croissant",
    nameVi: "Bánh sừng bò bơ",
    category: "Bakery",
    barcode: "8938505970014",
    price: 28000,
    stock: 18,
  },
  {
    id: crypto.randomUUID(),
    name: "Organic Granola",
    nameVi: "Ngũ cốc hữu cơ",
    category: "Grocery",
    barcode: "8938505970015",
    price: 89000,
    stock: 14,
  },
  {
    id: crypto.randomUUID(),
    name: "Mango Yogurt",
    nameVi: "Sữa chua xoài",
    category: "Dessert",
    barcode: "8938505970016",
    price: 39000,
    stock: 24,
  },
  {
    id: crypto.randomUUID(),
    name: "Sparkling Water",
    nameVi: "Nước khoáng có ga",
    category: "Beverage",
    barcode: "8938505970017",
    price: 18000,
    stock: 48,
  },
];

const defaultSettings = {
  storeName: "Sunrise Market",
  storeAddress: "88 Tran Hung Dao, District 1, Ho Chi Minh City",
  storePhone: "+84 28 1234 5678",
  storeEmail: "hello@sunrisemarket.vn",
  storeWebsite: "sunrisemarket.vn",
  taxId: "0312345678",
  taxRate: 8,
  receiptFooter: "Thank you for shopping with us. Hẹn gặp lại quý khách!",
};

const translations = {
  en: {
    brandTag: "Bilingual smart checkout",
    brandCopy:
      "Fast cashier flow with barcode scan, payment handling, and receipt templates.",
    dashboard: "Dashboard",
    pos: "POS Counter",
    inventory: "Inventory",
    receipts: "Receipts",
    settings: "Settings",
    quickTools: "Quick tools",
    focusScan: "Focus barcode",
    demoSale: "Demo sale",
    printReceipt: "Print receipt",
    headerLabel: "Store selling web app",
    today: "Today",
    heroTag: "Cashier friendly and convenient",
    heroTitle: "Sell faster, scan instantly, print beautifully.",
    heroCopy:
      "A modern shop management screen for bilingual teams with product search, barcode scanning, payment tracking, and ready-to-print bill templates.",
    startSelling: "Start selling",
    seeTemplates: "See templates",
    recentSales: "Recent sales",
    salesHistory: "Sales history",
    fastActions: "Fast actions",
    whatIncluded: "What is included",
    catalog: "Catalog",
    productsAndScanner: "Products and scanner",
    scannerReady: "Scanner ready",
    searchProduct: "Search products",
    barcodeInput: "Barcode",
    addByCode: "Add by code",
    cameraScan: "Camera scan",
    stopCamera: "Stop camera",
    scannerHint: "Supports barcode scanner keyboard input and compatible camera scanning.",
    currentOrder: "Current order",
    cartAndPayment: "Cart and payment",
    clearCart: "Clear",
    customerName: "Customer name",
    paymentMethod: "Payment method",
    amountTendered: "Amount tendered",
    items: "Items",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    change: "Change",
    previewReceipt: "Preview receipt",
    completeSale: "Complete sale",
    manageProducts: "Manage products",
    productName: "Product name",
    productNameVi: "Vietnamese name",
    generatedBarcode: "Generated barcode",
    generateBarcode: "Generate",
    barcodeFromPriceHint: "Barcode is generated automatically from the price.",
    barcodeNeedsPrice: "Enter a price to generate a barcode.",
    barcodeGenerationFailed: "Unable to generate a barcode from this price.",
    category: "Category",
    price: "Price",
    stock: "Stock",
    saveProduct: "Save product",
    editProduct: "Edit product",
    removeProduct: "Remove product",
    cancelEdit: "Cancel",
    editingProduct: "Editing this product. Save to update inventory details.",
    creatingProduct: "Create a new product. Barcode is generated from the price.",
    productCreated: "New product saved and barcode label is ready.",
    productUpdated: "Product details updated.",
    productRemoved: "Product removed from inventory.",
    productDeleteConfirm: "Remove this product from inventory?",
    liveCatalog: "Live catalog",
    inventoryList: "Inventory list",
    barcodeTemplates: "Barcode templates",
    chooseBarcodeTemplate: "Choose a label style",
    barcodePreview: "Barcode preview",
    printBarcodeLabel: "Print barcode label",
    printBarcodeBtn: "Print barcode",
    labelProduct: "Product for label",
    previewLabel: "Preview label",
    printLabel: "Print label",
    barcodeUseTemplate: "Use this label",
    barcodeLabelEmpty: "Select a product in inventory to preview and print its barcode label.",
    barcodeLabelReady: "Barcode label is ready to print.",
    barcodePrinted: "Barcode label sent to print.",
    barcodeTemplateStickerName: "Sticker",
    barcodeTemplateStickerDescription: "Compact label for cups, jars, and takeaway bags.",
    barcodeTemplateShelfName: "Shelf tag",
    barcodeTemplateShelfDescription: "Balanced size for shelf rails and display trays.",
    barcodeTemplatePremiumName: "Premium card",
    barcodeTemplatePremiumDescription: "Store-first layout for gifts and lifestyle goods.",
    barcodeTemplateManager: "Barcode template manager",
    manageBarcodeTemplates: "Adjust, add, or remove label templates",
    templateChooseEdit: "Template to edit",
    templateNameEn: "Template name (EN)",
    templateNameVi: "Template name (VI)",
    templateDescriptionEn: "Description (EN)",
    templateDescriptionVi: "Description (VI)",
    templateStyle: "Label style",
    templateStyleSticker: "Sticker",
    templateStyleShelf: "Shelf",
    templateStylePremium: "Premium",
    templateVisibleFields: "Visible fields",
    templateShowStore: "Show store name",
    templateShowCategory: "Show category",
    templateShowStock: "Show stock",
    templateShowFooter: "Show footer contact",
    templateCreateNew: "New template",
    templateSave: "Save template",
    templateRemove: "Remove template",
    templateDraftOption: "Create new template",
    templateCreated: "New barcode template created.",
    templateUpdated: "Barcode template updated.",
    templateRemoved: "Barcode template removed.",
    templateDeleteBlocked: "At least one barcode template must remain.",
    billTemplates: "Bill templates",
    chooseTemplate: "Choose a receipt style",
    preview: "Preview",
    printReadyReceipt: "Print-ready receipt",
    receiptTemplateManager: "Receipt template manager",
    manageReceiptTemplates: "Adjust, add, or remove invoice templates",
    receiptTemplateChooseEdit: "Template to edit",
    receiptTemplateTheme: "Receipt style",
    receiptThemeCompact: "Compact",
    receiptThemeRetail: "Retail",
    receiptThemeGift: "Gift",
    receiptVisibleFields: "Visible fields",
    receiptShowContact: "Show phone, email, website",
    receiptShowTaxId: "Show tax ID",
    receiptShowOrderMeta: "Show date and order ID",
    receiptShowPayment: "Show payment details",
    receiptShowCustomer: "Show customer name",
    receiptShowFooter: "Show footer note",
    receiptTemplateDraftOption: "Create new receipt template",
    receiptTemplateCreated: "New receipt template created.",
    receiptTemplateUpdated: "Receipt template updated.",
    receiptTemplateRemoved: "Receipt template removed.",
    receiptTemplateDeleteBlocked: "At least one receipt template must remain.",
    storeSetup: "Store setup",
    storeName: "Store name",
    storeAddress: "Address",
    storePhone: "Phone",
    storeEmail: "Email",
    storeWebsite: "Website",
    taxId: "Tax ID",
    taxRate: "Tax rate (%)",
    receiptFooter: "Receipt footer",
    saveSettings: "Save settings",
    settingsAutosaveReady: "Changes save automatically in this browser.",
    settingsAutosaveSaved: "Saved in this browser.",
    shopProfile: "Shop profile",
    shopProfilePreview: "Shop profile preview",
    helpfulFlow: "Helpful flow",
    howToUse: "How to use",
  },
  vi: {
    brandTag: "Quầy thanh toán song ngữ",
    brandCopy:
      "Quy trình thu ngân nhanh với quét mã, xử lý thanh toán và mẫu hóa đơn.",
    dashboard: "Tổng quan",
    pos: "Quầy POS",
    inventory: "Kho hàng",
    receipts: "Hóa đơn",
    settings: "Cài đặt",
    quickTools: "Công cụ nhanh",
    focusScan: "Mở ô mã vạch",
    demoSale: "Bán thử",
    printReceipt: "In hóa đơn",
    headerLabel: "Web bán hàng của cửa hàng",
    today: "Hôm nay",
    heroTag: "Thân thiện và tiện lợi cho thu ngân",
    heroTitle: "Bán nhanh hơn, quét mã ngay, in đẹp mắt.",
    heroCopy:
      "Màn hình quản lý bán hàng hiện đại cho đội ngũ song ngữ với tìm sản phẩm, quét mã vạch, theo dõi thanh toán và mẫu bill sẵn sàng để in.",
    startSelling: "Bắt đầu bán",
    seeTemplates: "Xem mẫu bill",
    recentSales: "Giao dịch gần đây",
    salesHistory: "Lịch sử bán hàng",
    fastActions: "Thao tác nhanh",
    whatIncluded: "Tính năng bao gồm",
    catalog: "Danh mục",
    productsAndScanner: "Sản phẩm và máy quét",
    scannerReady: "Máy quét sẵn sàng",
    searchProduct: "Tìm sản phẩm",
    barcodeInput: "Mã vạch",
    addByCode: "Thêm bằng mã",
    cameraScan: "Quét bằng camera",
    stopCamera: "Dừng camera",
    scannerHint: "Hỗ trợ máy quét dạng bàn phím và quét camera nếu trình duyệt tương thích.",
    currentOrder: "Đơn hiện tại",
    cartAndPayment: "Giỏ hàng và thanh toán",
    clearCart: "Xóa",
    customerName: "Tên khách hàng",
    paymentMethod: "Phương thức thanh toán",
    amountTendered: "Tiền khách đưa",
    items: "Số món",
    subtotal: "Tạm tính",
    tax: "Thuế",
    total: "Tổng cộng",
    change: "Tiền thừa",
    previewReceipt: "Xem trước hóa đơn",
    completeSale: "Hoàn tất bán hàng",
    manageProducts: "Quản lý sản phẩm",
    productName: "Tên sản phẩm",
    productNameVi: "Tên tiếng Việt",
    generatedBarcode: "Mã vạch tự động",
    generateBarcode: "Tạo mã",
    barcodeFromPriceHint: "Mã vạch được tạo tự động theo giá bán.",
    barcodeNeedsPrice: "Hãy nhập giá bán để tạo mã vạch.",
    barcodeGenerationFailed: "Không thể tạo mã vạch từ mức giá này.",
    category: "Danh mục",
    price: "Giá bán",
    stock: "Tồn kho",
    saveProduct: "Lưu sản phẩm",
    editProduct: "Sửa sản phẩm",
    removeProduct: "Xóa sản phẩm",
    cancelEdit: "Hủy",
    editingProduct: "Đang chỉnh sửa sản phẩm này. Hãy lưu để cập nhật kho hàng.",
    creatingProduct: "Tạo sản phẩm mới. Mã vạch sẽ được tạo từ giá bán.",
    productCreated: "Đã lưu sản phẩm mới và chuẩn bị tem mã vạch.",
    productUpdated: "Đã cập nhật thông tin sản phẩm.",
    productRemoved: "Đã xóa sản phẩm khỏi kho.",
    productDeleteConfirm: "Bạn có muốn xóa sản phẩm này khỏi kho không?",
    liveCatalog: "Danh mục hiện tại",
    inventoryList: "Danh sách tồn kho",
    barcodeTemplates: "Mẫu tem mã vạch",
    chooseBarcodeTemplate: "Chọn kiểu tem nhãn",
    barcodePreview: "Xem trước mã vạch",
    printBarcodeLabel: "In tem mã vạch",
    printBarcodeBtn: "In mã vạch",
    labelProduct: "Sản phẩm in tem",
    previewLabel: "Xem tem",
    printLabel: "In tem",
    barcodeUseTemplate: "Dùng mẫu này",
    barcodeLabelEmpty: "Hãy chọn một sản phẩm trong kho để xem trước và in tem mã vạch.",
    barcodeLabelReady: "Tem mã vạch đã sẵn sàng để in.",
    barcodePrinted: "Đã gửi lệnh in tem mã vạch.",
    barcodeTemplateStickerName: "Tem dán",
    barcodeTemplateStickerDescription: "Tem nhỏ gọn cho ly, hũ và túi mang đi.",
    barcodeTemplateShelfName: "Nhãn kệ",
    barcodeTemplateShelfDescription: "Kích thước cân đối cho kệ hàng và khay trưng bày.",
    barcodeTemplatePremiumName: "Thẻ cao cấp",
    barcodeTemplatePremiumDescription: "Bố cục nổi bật tên cửa hàng cho quà tặng và sản phẩm phong cách.",
    barcodeTemplateManager: "Quản lý mẫu tem mã vạch",
    manageBarcodeTemplates: "Chỉnh sửa, thêm hoặc xóa mẫu tem",
    templateChooseEdit: "Mẫu cần chỉnh",
    templateNameEn: "Tên mẫu (EN)",
    templateNameVi: "Tên mẫu (VI)",
    templateDescriptionEn: "Mô tả (EN)",
    templateDescriptionVi: "Mô tả (VI)",
    templateStyle: "Kiểu tem",
    templateStyleSticker: "Tem dán",
    templateStyleShelf: "Nhãn kệ",
    templateStylePremium: "Thẻ cao cấp",
    templateVisibleFields: "Thông tin hiển thị",
    templateShowStore: "Hiện tên cửa hàng",
    templateShowCategory: "Hiện danh mục",
    templateShowStock: "Hiện tồn kho",
    templateShowFooter: "Hiện thông tin liên hệ cuối tem",
    templateCreateNew: "Tạo mẫu mới",
    templateSave: "Lưu mẫu",
    templateRemove: "Xóa mẫu",
    templateDraftOption: "Tạo mẫu tem mới",
    templateCreated: "Đã tạo mẫu tem mã vạch mới.",
    templateUpdated: "Đã cập nhật mẫu tem mã vạch.",
    templateRemoved: "Đã xóa mẫu tem mã vạch.",
    templateDeleteBlocked: "Cần giữ lại ít nhất một mẫu tem mã vạch.",
    billTemplates: "Mẫu bill",
    chooseTemplate: "Chọn kiểu hóa đơn",
    preview: "Xem trước",
    printReadyReceipt: "Hóa đơn sẵn sàng để in",
    receiptTemplateManager: "Quản lý mẫu hóa đơn",
    manageReceiptTemplates: "Chỉnh sửa, thêm hoặc xóa mẫu hóa đơn",
    receiptTemplateChooseEdit: "Mẫu cần chỉnh",
    receiptTemplateTheme: "Kiểu hóa đơn",
    receiptThemeCompact: "Nhỏ gọn",
    receiptThemeRetail: "Bán lẻ",
    receiptThemeGift: "Quà tặng",
    receiptVisibleFields: "Thông tin hiển thị",
    receiptShowContact: "Hiện số điện thoại, email, website",
    receiptShowTaxId: "Hiện mã số thuế",
    receiptShowOrderMeta: "Hiện ngày giờ và mã đơn",
    receiptShowPayment: "Hiện thông tin thanh toán",
    receiptShowCustomer: "Hiện tên khách hàng",
    receiptShowFooter: "Hiện lời nhắn cuối hóa đơn",
    receiptTemplateDraftOption: "Tạo mẫu hóa đơn mới",
    receiptTemplateCreated: "Đã tạo mẫu hóa đơn mới.",
    receiptTemplateUpdated: "Đã cập nhật mẫu hóa đơn.",
    receiptTemplateRemoved: "Đã xóa mẫu hóa đơn.",
    receiptTemplateDeleteBlocked: "Cần giữ lại ít nhất một mẫu hóa đơn.",
    storeSetup: "Thông tin cửa hàng",
    storeName: "Tên cửa hàng",
    storeAddress: "Địa chỉ",
    storePhone: "Số điện thoại",
    storeEmail: "Email",
    storeWebsite: "Website",
    taxId: "Mã số thuế",
    taxRate: "Tỷ lệ thuế (%)",
    receiptFooter: "Lời nhắn cuối hóa đơn",
    saveSettings: "Lưu cài đặt",
    settingsAutosaveReady: "Các thay đổi sẽ tự lưu trên trình duyệt này.",
    settingsAutosaveSaved: "Đã lưu trên trình duyệt này.",
    shopProfile: "Hồ sơ cửa hàng",
    shopProfilePreview: "Xem trước hồ sơ cửa hàng",
    helpfulFlow: "Quy trình gợi ý",
    howToUse: "Cách sử dụng",
  },
};

const paymentMethods = {
  en: [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "transfer", label: "Bank transfer" },
    { value: "ewallet", label: "E-wallet" },
  ],
  vi: [
    { value: "cash", label: "Tiền mặt" },
    { value: "card", label: "Thẻ" },
    { value: "transfer", label: "Chuyển khoản" },
    { value: "ewallet", label: "Ví điện tử" },
  ],
};

const defaultReceiptTemplates = [
  {
    id: "compact",
    theme: "compact",
    en: {
      name: "Compact",
      description: "Quick thermal style for small printers.",
    },
    vi: {
      name: "Nhỏ gọn",
      description: "Kiểu bill nhiệt nhanh cho máy in nhỏ.",
    },
    showContact: true,
    showTaxId: true,
    showOrderMeta: true,
    showPayment: true,
    showCustomer: true,
    showFooter: true,
  },
  {
    id: "retail",
    theme: "retail",
    en: {
      name: "Retail",
      description: "Clear totals and store-first layout.",
    },
    vi: {
      name: "Bán lẻ",
      description: "Bố cục rõ ràng, nhấn mạnh thông tin cửa hàng.",
    },
    showContact: true,
    showTaxId: true,
    showOrderMeta: true,
    showPayment: true,
    showCustomer: true,
    showFooter: true,
  },
  {
    id: "gift",
    theme: "gift",
    en: {
      name: "Gift",
      description: "Warm branded look for lifestyle shops.",
    },
    vi: {
      name: "Phong cách quà tặng",
      description: "Giao diện ấm áp cho cửa hàng phong cách.",
    },
    showContact: true,
    showTaxId: true,
    showOrderMeta: true,
    showPayment: true,
    showCustomer: true,
    showFooter: true,
  },
];

const defaultBarcodeLabelTemplates = [
  {
    id: "sticker",
    name: "Sticker",
    nameVi: "Tem dán",
    description: "Compact label for cups, jars, and takeaway bags.",
    descriptionVi: "Tem nhỏ gọn cho ly, hũ và túi mang đi.",
    className: "sticker",
    showStore: true,
    showCategory: true,
    showStock: true,
    showFooter: true,
  },
  {
    id: "shelf",
    name: "Shelf tag",
    nameVi: "Nhãn kệ",
    description: "Balanced size for shelf rails and display trays.",
    descriptionVi: "Kích thước cân đối cho kệ hàng và khay trưng bày.",
    className: "shelf",
    showStore: true,
    showCategory: true,
    showStock: true,
    showFooter: false,
  },
  {
    id: "premium",
    name: "Premium card",
    nameVi: "Thẻ cao cấp",
    description: "Store-first layout for gifts and lifestyle goods.",
    descriptionVi: "Bố cục nổi bật tên cửa hàng cho quà tặng và sản phẩm phong cách.",
    className: "premium",
    showStore: true,
    showCategory: false,
    showStock: false,
    showFooter: true,
  },
];

const appState = {
  language: localStorage.getItem(STORAGE_KEYS.language) || "en",
  products: normalizeProducts(loadState(STORAGE_KEYS.products, seedProducts)),
  sales: loadState(STORAGE_KEYS.sales, []),
  settings: normalizeSettings(loadState(STORAGE_KEYS.settings, defaultSettings)),
  receiptTemplates: [],
  barcodeTemplates: [],
  selectedTemplate: localStorage.getItem(STORAGE_KEYS.template) || "compact",
  editingReceiptTemplateId: null,
  selectedBarcodeTemplate: localStorage.getItem(STORAGE_KEYS.barcodeLabelTemplate) || "sticker",
  editingBarcodeTemplateId: null,
  editingProductId: null,
  selectedLabelProductId: null,
  cart: [],
  activeSection: "dashboard",
  productSearch: "",
  cameraStream: null,
  scanLoopActive: false,
  paymentMenuOpen: false,
  lastReceipt: null,
  scannerBuffer: "",
  scannerLastKeyAt: 0,
};

const elements = {
  storeName: document.getElementById("store-name"),
  clockText: document.getElementById("clock-text"),
  statsGrid: document.getElementById("stats-grid"),
  featureList: document.getElementById("feature-list"),
  usageList: document.getElementById("usage-list"),
  salesHistory: document.getElementById("sales-history"),
  productGrid: document.getElementById("product-grid"),
  inventoryList: document.getElementById("inventory-list"),
  cartList: document.getElementById("cart-list"),
  templateGrid: document.getElementById("template-grid"),
  barcodeTemplateGrid: document.getElementById("barcode-template-grid"),
  receiptPreview: document.getElementById("receipt-preview"),
  barcodeLabelPreview: document.getElementById("barcode-label-preview"),
  barcodeLabelProductSelect: document.getElementById("barcode-label-product-select"),
  toast: document.getElementById("toast"),
  barcodeInput: document.getElementById("barcode-input"),
  productSearch: document.getElementById("product-search"),
  scannerStatus: document.getElementById("scanner-status"),
  customerName: document.getElementById("customer-name"),
  paymentMethod: document.getElementById("payment-method"),
  paymentMethodMenu: document.getElementById("payment-method-menu"),
  paymentMethodTrigger: document.getElementById("payment-method-trigger"),
  paymentMethodLabel: document.getElementById("payment-method-label"),
  paymentMethodOptions: document.getElementById("payment-method-options"),
  amountTendered: document.getElementById("amount-tendered"),
  quickCashRow: document.getElementById("quick-cash-row"),
  summaryItems: document.getElementById("summary-items"),
  summarySubtotal: document.getElementById("summary-subtotal"),
  summaryTax: document.getElementById("summary-tax"),
  summaryTotal: document.getElementById("summary-total"),
  summaryChange: document.getElementById("summary-change"),
  scannerVideo: document.getElementById("scanner-video"),
  productForm: document.getElementById("product-form"),
  settingsForm: document.getElementById("settings-form"),
  receiptTemplateForm: document.getElementById("receipt-template-form"),
  receiptTemplateEditorSelect: document.getElementById("receipt-template-editor-select"),
  barcodeTemplateForm: document.getElementById("barcode-template-form"),
  barcodeTemplateEditorSelect: document.getElementById("barcode-template-editor-select"),
  inventoryBarcode: document.getElementById("inventory-barcode"),
  barcodePreviewNote: document.getElementById("barcode-preview-note"),
  productFormMode: document.getElementById("product-form-mode"),
  productFormSubmit: document.getElementById("product-form-submit"),
  productFormCancel: document.getElementById("product-form-cancel"),
  settingsSaveState: document.getElementById("settings-save-state"),
  settingsPreview: document.getElementById("settings-preview"),
};

function loadState(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return structuredClone(fallback);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return structuredClone(fallback);
  }
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeSettings(settings) {
  const nextSettings = {
    ...defaultSettings,
    ...(settings || {}),
  };

  if (nextSettings.receiptFooter === "Thank you for shopping with us. Hen gap lai quy khach!") {
    nextSettings.receiptFooter = defaultSettings.receiptFooter;
  }

  return nextSettings;
}

function normalizeProducts(products) {
  const defaultNameViByBarcode = new Map(
    seedProducts.map((product) => [product.barcode, product.nameVi]),
  );

  return (products || []).map((product) => {
    const normalizedNameVi = defaultNameViByBarcode.get(product.barcode);
    return normalizedNameVi ? { ...product, nameVi: normalizedNameVi } : product;
  });
}

function normalizeBarcodeTemplate(template, index) {
  const fallback = defaultBarcodeLabelTemplates[index] || defaultBarcodeLabelTemplates[0];
  const dictionary = translations.en;

  const legacyName = template?.nameKey ? dictionary[template.nameKey] : "";
  const legacyDescription = template?.descriptionKey ? dictionary[template.descriptionKey] : "";
  const legacyNameVi = template?.nameKey ? translations.vi[template.nameKey] : "";
  const legacyDescriptionVi = template?.descriptionKey ? translations.vi[template.descriptionKey] : "";

  return {
    id: template?.id || `barcode-template-${index + 1}`,
    name: template?.name || legacyName || fallback.name,
    nameVi: template?.nameVi || legacyNameVi || fallback.nameVi,
    description: template?.description || legacyDescription || fallback.description,
    descriptionVi: template?.descriptionVi || legacyDescriptionVi || fallback.descriptionVi,
    className: ["sticker", "shelf", "premium"].includes(template?.className)
      ? template.className
      : fallback.className,
    showStore: template?.showStore ?? fallback.showStore,
    showCategory: template?.showCategory ?? fallback.showCategory,
    showStock: template?.showStock ?? fallback.showStock,
    showFooter: template?.showFooter ?? fallback.showFooter,
  };
}

function normalizeBarcodeTemplates(templates) {
  const source = Array.isArray(templates) && templates.length > 0 ? templates : defaultBarcodeLabelTemplates;
  return source.map(normalizeBarcodeTemplate);
}

function normalizeReceiptTemplate(template, index) {
  const fallback = defaultReceiptTemplates[index] || defaultReceiptTemplates[0];
  return {
    id: template?.id || `receipt-template-${index + 1}`,
    theme: ["compact", "retail", "gift"].includes(template?.theme) ? template.theme : fallback.theme,
    en: {
      name: template?.en?.name || template?.name || fallback.en.name,
      description: template?.en?.description || template?.description || fallback.en.description,
    },
    vi: {
      name: template?.vi?.name || template?.nameVi || fallback.vi.name,
      description: template?.vi?.description || template?.descriptionVi || fallback.vi.description,
    },
    showContact: template?.showContact ?? fallback.showContact,
    showTaxId: template?.showTaxId ?? fallback.showTaxId,
    showOrderMeta: template?.showOrderMeta ?? fallback.showOrderMeta,
    showPayment: template?.showPayment ?? fallback.showPayment,
    showCustomer: template?.showCustomer ?? fallback.showCustomer,
    showFooter: template?.showFooter ?? fallback.showFooter,
  };
}

function normalizeReceiptTemplates(templates) {
  const source = Array.isArray(templates) && templates.length > 0 ? templates : defaultReceiptTemplates;
  return source.map(normalizeReceiptTemplate);
}

function getCurrentDictionary() {
  return translations[appState.language];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat(appState.language === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(appState.language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildDashboardStats() {
  const salesToday = appState.sales.filter((sale) => {
    const today = new Date();
    const saleDate = new Date(sale.createdAt);
    return saleDate.toDateString() === today.toDateString();
  });
  const revenueToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);
  const lowStock = appState.products.filter((product) => product.stock <= 10).length;
  const unitsInCart = appState.cart.reduce((sum, item) => sum + item.quantity, 0);

  return [
    {
      label: appState.language === "vi" ? "Doanh thu hôm nay" : "Revenue today",
      value: formatCurrency(revenueToday),
    },
    {
      label: appState.language === "vi" ? "Đơn hôm nay" : "Orders today",
      value: String(salesToday.length),
    },
    {
      label: appState.language === "vi" ? "Sản phẩm sắp hết" : "Low stock items",
      value: String(lowStock),
    },
    {
      label: appState.language === "vi" ? "Mặt hàng trong giỏ" : "Units in cart",
      value: String(unitsInCart),
    },
  ];
}

function buildFeatureItems() {
  if (appState.language === "vi") {
    return [
      {
        title: "Quét mã nhanh",
        copy: "Nhận đầu vào từ máy quét dạng bàn phím, nhập tay mã vạch hoặc quét camera khi có hỗ trợ.",
      },
      {
        title: "Thanh toán rõ ràng",
        copy: "Tính tổng, thuế, tiền thừa và lưu lại phương thức thanh toán trong từng đơn.",
      },
      {
        title: "Mẫu in linh hoạt",
        copy: "Đổi kiểu bill trước khi in để phù hợp với cửa hàng và máy in nhiệt.",
      },
      {
        title: "Song ngữ dễ dùng",
        copy: "Chuyển ngay giữa tiếng Anh và tiếng Việt cho nhân viên và quản lý.",
      },
    ];
  }

  return [
    {
      title: "Fast barcode flow",
      copy: "Accept keyboard-style scanners, manual barcode entry, or camera scan where supported.",
    },
    {
      title: "Clear payment handling",
      copy: "Track totals, tax, change, and the chosen payment method for every order.",
    },
    {
      title: "Flexible bill templates",
      copy: "Switch receipt styles before printing to match your shop and printer setup.",
    },
    {
      title: "Easy bilingual mode",
      copy: "Instantly move between English and Vietnamese for staff and management.",
    },
  ];
}

function buildUsageItems() {
  if (appState.language === "vi") {
    return [
      {
        title: "1. Thêm sản phẩm",
        copy: "Tạo sản phẩm trong Kho hàng với mã vạch, giá bán và tồn kho để dùng ngay tại quầy POS.",
      },
      {
        title: "2. Bán tại quầy",
        copy: "Tìm sản phẩm hoặc quét mã vạch, điều chỉnh số lượng, sau đó nhập tiền khách đưa.",
      },
      {
        title: "3. In hóa đơn",
        copy: "Chọn mẫu bill trong tab Hóa đơn và bấm in sau khi xem trước.",
      },
      {
        title: "4. Theo dõi lịch sử",
        copy: "Kiểm tra giao dịch gần đây ở tab Tổng quan để xem tổng tiền và hình thức thanh toán.",
      },
    ];
  }

  return [
    {
      title: "1. Add products",
      copy: "Create products in Inventory with barcode, price, and stock so they are ready at the POS.",
    },
    {
      title: "2. Sell at the counter",
      copy: "Search or scan items, adjust quantities, then enter the tendered amount.",
    },
    {
      title: "3. Print the receipt",
      copy: "Choose a bill style in the Receipts tab and print after previewing the layout.",
    },
    {
      title: "4. Review history",
      copy: "Check recent transactions in Dashboard to track totals and payment methods.",
    },
  ];
}

function getProductDisplayName(product) {
  return appState.language === "vi" ? product.nameVi : product.name;
}

function getPaymentMethods() {
  return paymentMethods[appState.language];
}

function closePaymentMethodMenu() {
  appState.paymentMenuOpen = false;
  elements.paymentMethodMenu.classList.remove("is-open");
  elements.paymentMethodTrigger.setAttribute("aria-expanded", "false");
}

function openPaymentMethodMenu() {
  appState.paymentMenuOpen = true;
  elements.paymentMethodMenu.classList.add("is-open");
  elements.paymentMethodTrigger.setAttribute("aria-expanded", "true");
}

function syncPaymentMethodDropdown() {
  const methods = getPaymentMethods();
  const fallback = methods[0];
  const selectedMethod =
    methods.find((method) => method.value === elements.paymentMethod.value) || fallback;

  elements.paymentMethod.value = selectedMethod.value;
  elements.paymentMethodLabel.textContent = selectedMethod.label;
  elements.paymentMethodOptions.innerHTML = methods
    .map(
      (method) => `
        <button
          type="button"
          class="select-option ${method.value === selectedMethod.value ? "is-active" : ""}"
          data-payment-method-option="${method.value}"
          role="option"
          aria-selected="${method.value === selectedMethod.value}"
        >
          <span>${method.label}</span>
          <span class="select-option-mark" aria-hidden="true">${method.value === selectedMethod.value ? "✓" : ""}</span>
        </button>
      `,
    )
    .join("");
}

function setPaymentMethod(value, { notify = false } = {}) {
  const methodExists = getPaymentMethods().some((method) => method.value === value);
  if (!methodExists) {
    return;
  }

  elements.paymentMethod.value = value;
  syncPaymentMethodDropdown();

  if (notify) {
    elements.paymentMethod.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function getSummary() {
  const items = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = appState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * (Number(appState.settings.taxRate) / 100));
  const total = subtotal + tax;
  const amountTendered = Number(elements.amountTendered.value || 0);
  const change = Math.max(amountTendered - total, 0);

  return { items, subtotal, tax, total, amountTendered, change };
}

function computeEan13CheckDigit(baseDigits) {
  const digits = String(baseDigits).split("").map(Number);
  const weightedSum = digits.reduce((sum, digit, index) => {
    return sum + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);

  return (10 - (weightedSum % 10)) % 10;
}

function buildPriceBarcode(price, sequence) {
  const normalizedPrice = Math.round(Number(price));
  const baseDigits = `27${String(normalizedPrice).padStart(7, "0")}${String(sequence).padStart(3, "0")}`;
  return `${baseDigits}${computeEan13CheckDigit(baseDigits)}`;
}

function generateBarcodeForPrice(price, options = {}) {
  const normalizedPrice = Math.round(Number(price));
  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0 || normalizedPrice > 9999999) {
    return "";
  }

  for (let sequence = 0; sequence <= 999; sequence += 1) {
    const barcode = buildPriceBarcode(normalizedPrice, sequence);
    const exists = appState.products.some(
      (product) => product.barcode === barcode && product.id !== options.ignoreProductId,
    );
    if (!exists) {
      return barcode;
    }
  }

  return "";
}

function ensureSelectedLabelProduct() {
  const selectedProduct = appState.products.find((product) => product.id === appState.selectedLabelProductId);
  if (selectedProduct) {
    return selectedProduct;
  }

  const fallbackProduct = appState.products[0] || null;
  appState.selectedLabelProductId = fallbackProduct?.id || null;
  return fallbackProduct;
}

function getEditingProduct() {
  return appState.products.find((product) => product.id === appState.editingProductId) || null;
}

function getSelectedReceiptTemplate() {
  return (
    appState.receiptTemplates.find((template) => template.id === appState.selectedTemplate) ||
    appState.receiptTemplates[0]
  );
}

function getEditingReceiptTemplate() {
  return (
    appState.receiptTemplates.find((template) => template.id === appState.editingReceiptTemplateId) || null
  );
}

function getSelectedBarcodeTemplate() {
  return (
    appState.barcodeTemplates.find((template) => template.id === appState.selectedBarcodeTemplate) ||
    appState.barcodeTemplates[0]
  );
}

function getEditingBarcodeTemplate() {
  return appState.barcodeTemplates.find((template) => template.id === appState.editingBarcodeTemplateId) || null;
}

function updateInventoryBarcodePreview() {
  const priceField = elements.productForm?.elements.namedItem("price");
  if (!priceField || !elements.inventoryBarcode || !elements.barcodePreviewNote) {
    return;
  }

  const editingProduct = getEditingProduct();
  const normalizedPrice = Math.round(Number(priceField.value));
  const barcode =
    editingProduct && Number(editingProduct.price) === normalizedPrice
      ? editingProduct.barcode
      : generateBarcodeForPrice(priceField.value, { ignoreProductId: appState.editingProductId });
  elements.inventoryBarcode.value = barcode;
  elements.barcodePreviewNote.textContent = barcode
    ? `${getCurrentDictionary().barcodeFromPriceHint} ${barcode}`
    : getCurrentDictionary().barcodeNeedsPrice;
}

function renderProductForm() {
  const form = elements.productForm;
  if (!form || !elements.productFormMode || !elements.productFormSubmit || !elements.productFormCancel) {
    return;
  }

  const editingProduct = getEditingProduct();
  const dictionary = getCurrentDictionary();

  if (editingProduct) {
    form.elements.namedItem("productId").value = editingProduct.id;
    form.elements.namedItem("name").value = editingProduct.name;
    form.elements.namedItem("nameVi").value = editingProduct.nameVi;
    form.elements.namedItem("category").value = editingProduct.category;
    form.elements.namedItem("price").value = editingProduct.price;
    form.elements.namedItem("stock").value = editingProduct.stock;
    elements.inventoryBarcode.value = editingProduct.barcode;
    elements.productFormMode.textContent = dictionary.editingProduct;
    elements.productFormCancel.hidden = false;
  } else {
    form.elements.namedItem("productId").value = "";
    elements.productFormMode.textContent = dictionary.creatingProduct;
    elements.productFormCancel.hidden = true;
  }

  elements.productFormSubmit.textContent = dictionary.saveProduct;
  updateInventoryBarcodePreview();
}

function renderTranslations() {
  const dictionary = getCurrentDictionary();
  document.documentElement.lang = appState.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[key]) {
      node.textContent = dictionary[key];
    }
  });

  document.getElementById("product-search").placeholder =
    appState.language === "vi" ? "Tìm theo tên hoặc mã vạch" : "Search by name or barcode";
  document.getElementById("barcode-input").placeholder = appState.language === "vi" ? "Quét mã..." : "893...";
  document.getElementById("customer-name").placeholder =
    appState.language === "vi" ? "Khách lẻ" : "Walk-in customer";
  updateInventoryBarcodePreview();
}

function renderLanguageButtons() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === appState.language);
  });
}

function renderNavigation() {
  document.querySelectorAll(".nav-chip").forEach((button) => {
    const isActive = button.dataset.section === appState.activeSection;
    button.classList.toggle("is-active", isActive);
  });

  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("is-visible", section.id === `section-${appState.activeSection}`);
  });
}

function renderDashboard() {
  const stats = buildDashboardStats();
  elements.statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <p class="eyebrow">${stat.label}</p>
          <strong>${stat.value}</strong>
        </article>
      `,
    )
    .join("");

  elements.featureList.innerHTML = buildFeatureItems()
    .map(
      (item) => `
        <article class="feature-item">
          <strong>${item.title}</strong>
          <p class="muted">${item.copy}</p>
        </article>
      `,
    )
    .join("");

  elements.usageList.innerHTML = buildUsageItems()
    .map(
      (item) => `
        <article class="feature-item">
          <strong>${item.title}</strong>
          <p class="muted">${item.copy}</p>
        </article>
      `,
    )
    .join("");

  if (appState.sales.length === 0) {
    elements.salesHistory.innerHTML = `<article class="history-card"><p class="muted">${
      appState.language === "vi"
        ? "Chưa có giao dịch nào. Thử nút 'Bán thử' để xem quy trình."
        : "No transactions yet. Try the demo sale button to see the flow."
    }</p></article>`;
    return;
  }

  elements.salesHistory.innerHTML = appState.sales
    .slice(0, 6)
    .reverse()
    .map((sale) => {
      const paymentMethod = getPaymentMethods().find((method) => method.value === sale.paymentMethod);
      return `
        <article class="history-card">
          <div class="history-meta">
            <h5>${sale.orderId}</h5>
            <span>${formatDate(sale.createdAt)}</span>
          </div>
          <div class="history-meta">
            <span>${sale.customerName || (appState.language === "vi" ? "Khách lẻ" : "Walk-in")}</span>
            <strong>${formatCurrency(sale.total)}</strong>
          </div>
          <div class="history-meta">
            <span>${paymentMethod ? paymentMethod.label : sale.paymentMethod}</span>
            <span>${sale.items.length} ${appState.language === "vi" ? "mặt hàng" : "items"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProducts() {
  const keyword = appState.productSearch.trim().toLowerCase();
  const filtered = appState.products.filter((product) => {
    const haystack = [product.name, product.nameVi, product.category, product.barcode]
      .join(" ")
      .toLowerCase();
    return haystack.includes(keyword);
  });

  if (filtered.length === 0) {
    elements.productGrid.innerHTML = `<article class="product-card"><p class="muted">${
      appState.language === "vi" ? "Không tìm thấy sản phẩm phù hợp." : "No matching products found."
    }</p></article>`;
    return;
  }

  elements.productGrid.innerHTML = filtered
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-meta">
            <span class="tag">${product.category}</span>
            <span>${appState.language === "vi" ? "Tồn" : "Stock"}: ${product.stock}</span>
          </div>
          <div>
            <h5>${getProductDisplayName(product)}</h5>
            <p class="muted">${product.barcode}</p>
          </div>
          <div class="product-meta">
            <strong>${formatCurrency(product.price)}</strong>
            <button class="primary-btn" data-product-add="${product.id}">
              ${appState.language === "vi" ? "Thêm" : "Add"}
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderInventory() {
  const selectedProduct = ensureSelectedLabelProduct();
  elements.inventoryList.innerHTML = appState.products
    .map(
      (product) => `
        <article class="inventory-card ${selectedProduct?.id === product.id ? "is-selected" : ""}">
          <div class="inventory-meta">
            <h5>${product.name}</h5>
            <span class="tag">${product.category}</span>
          </div>
          <div class="inventory-meta">
            <span>${product.nameVi}</span>
            <span>${product.barcode}</span>
          </div>
          <div class="inventory-meta">
            <strong>${formatCurrency(product.price)}</strong>
            <span>${appState.language === "vi" ? "Tồn kho" : "Stock"}: ${product.stock}</span>
          </div>
          <div class="inventory-actions">
            <button class="secondary-btn" data-product-edit="${product.id}">
              ${getCurrentDictionary().editProduct}
            </button>
            <button class="danger-btn" data-product-remove="${product.id}">
              ${getCurrentDictionary().removeProduct}
            </button>
            <button class="secondary-btn" data-label-select="${product.id}">
              ${getCurrentDictionary().previewLabel}
            </button>
            <button class="ghost-btn" data-barcode-print="${product.id}">
              ${getCurrentDictionary().printLabel}
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPaymentOptions() {
  const currentValue = elements.paymentMethod.value;
  elements.paymentMethod.innerHTML = getPaymentMethods()
    .map(
      (method) => `<option value="${method.value}">${method.label}</option>`,
    )
    .join("");
  elements.paymentMethod.value = currentValue || getPaymentMethods()[0].value;
  syncPaymentMethodDropdown();
  closePaymentMethodMenu();
}

function renderQuickCashButtons() {
  const amounts = [50000, 100000, 200000, 500000];
  elements.quickCashRow.innerHTML = amounts
    .map(
      (amount) => `
        <button class="quick-cash-btn" data-quick-cash="${amount}">
          ${formatCurrency(amount)}
        </button>
      `,
    )
    .join("");
}

function renderCart() {
  if (appState.cart.length === 0) {
    elements.cartList.innerHTML = `<article class="cart-item"><p class="muted">${
      appState.language === "vi"
        ? "Chưa có sản phẩm trong giỏ. Quét mã vạch hoặc bấm Thêm."
        : "No items in the cart yet. Scan a barcode or press Add."
    }</p></article>`;
  } else {
    elements.cartList.innerHTML = appState.cart
      .map(
        (item) => `
          <article class="cart-item">
            <div class="cart-item-head">
              <div>
                <strong>${getProductDisplayName(item)}</strong>
                <div class="muted">${item.barcode}</div>
              </div>
              <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
            <div class="cart-item-actions">
              <span>${formatCurrency(item.price)}</span>
              <div class="qty-group">
                <button class="qty-btn" data-cart-change="${item.id}" data-delta="-1">-</button>
                <strong>${item.quantity}</strong>
                <button class="qty-btn" data-cart-change="${item.id}" data-delta="1">+</button>
                <button class="ghost-btn" data-cart-remove="${item.id}">
                  ${appState.language === "vi" ? "Bỏ" : "Remove"}
                </button>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const summary = getSummary();
  elements.summaryItems.textContent = String(summary.items);
  elements.summarySubtotal.textContent = formatCurrency(summary.subtotal);
  elements.summaryTax.textContent = formatCurrency(summary.tax);
  elements.summaryTotal.textContent = formatCurrency(summary.total);
  elements.summaryChange.textContent = formatCurrency(summary.change);
}

function buildReceiptSale() {
  const summary = getSummary();
  const now = new Date().toISOString();
  return {
    orderId: appState.lastReceipt?.orderId || `POS-${Date.now().toString().slice(-6)}`,
    createdAt: appState.lastReceipt?.createdAt || now,
    customerName: elements.customerName.value.trim(),
    paymentMethod: elements.paymentMethod.value,
    amountTendered: summary.amountTendered,
    change: summary.change,
    subtotal: summary.subtotal,
    tax: summary.tax,
    total: summary.total,
    items: appState.cart.map((item) => ({
      id: item.id,
      name: item.name,
      nameVi: item.nameVi,
      barcode: item.barcode,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

function renderReceiptPreview() {
  const sale = appState.lastReceipt || buildReceiptSale();
  const template = getSelectedReceiptTemplate();
  const paymentMethod = getPaymentMethods().find((method) => method.value === sale.paymentMethod);
  const shopContact = [
    appState.settings.storePhone,
    appState.settings.storeEmail,
    appState.settings.storeWebsite,
  ]
    .filter(Boolean)
    .join(" • ");

  const receiptHtml = `
    <div class="receipt-head">
      <h5>${appState.settings.storeName}</h5>
      <p>${appState.settings.storeAddress}</p>
      ${template?.showContact && shopContact ? `<p>${shopContact}</p>` : ""}
      ${template?.showTaxId && appState.settings.taxId ? `<p>${appState.language === "vi" ? "MST" : "Tax ID"}: ${appState.settings.taxId}</p>` : ""}
      ${template?.showOrderMeta ? `<p>${formatDate(sale.createdAt)}</p>` : ""}
      ${template?.showOrderMeta ? `<p>${sale.orderId}</p>` : ""}
    </div>
    <div class="receipt-lines">
      ${sale.items
        .map(
          (item) => `
            <div class="receipt-line">
              <div>
                <strong>${appState.language === "vi" ? item.nameVi : item.name}</strong>
                <div>${item.quantity} x ${formatCurrency(item.price)}</div>
              </div>
              <strong>${formatCurrency(item.quantity * item.price)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="receipt-total">
      <div class="receipt-total-row">
        <span>${appState.language === "vi" ? "Tạm tính" : "Subtotal"}</span>
        <span>${formatCurrency(sale.subtotal)}</span>
      </div>
      <div class="receipt-total-row">
        <span>${appState.language === "vi" ? "Thuế" : "Tax"}</span>
        <span>${formatCurrency(sale.tax)}</span>
      </div>
      <div class="receipt-total-row">
        <strong>${appState.language === "vi" ? "Tổng cộng" : "Total"}</strong>
        <strong>${formatCurrency(sale.total)}</strong>
      </div>
      ${
        template?.showPayment
          ? `
            <div class="receipt-total-row">
              <span>${appState.language === "vi" ? "Thanh toán" : "Payment"}</span>
              <span>${paymentMethod ? paymentMethod.label : sale.paymentMethod}</span>
            </div>
            <div class="receipt-total-row">
              <span>${appState.language === "vi" ? "Tiền thừa" : "Change"}</span>
              <span>${formatCurrency(sale.change)}</span>
            </div>
          `
          : ""
      }
    </div>
    <div class="receipt-footer">
      ${template?.showCustomer ? `<p>${sale.customerName || (appState.language === "vi" ? "Khách lẻ" : "Walk-in customer")}</p>` : ""}
      <p>${template?.[appState.language].name || ""}</p>
      ${template?.showFooter ? `<p>${appState.settings.receiptFooter}</p>` : ""}
    </div>
  `;

  elements.receiptPreview.className = `receipt-preview ${template?.theme || "compact"}`;
  elements.receiptPreview.innerHTML = receiptHtml;
}

function renderTemplates() {
  elements.templateGrid.innerHTML = appState.receiptTemplates
    .map((template) => {
      const content = template[appState.language];
      return `
        <article class="template-card ${appState.selectedTemplate === template.id ? "is-active" : ""}">
          <div class="product-meta">
            <h5>${content.name}</h5>
            <span class="tag">${template.id}</span>
          </div>
          <p class="muted">${content.description}</p>
          <button class="secondary-btn" data-template-select="${template.id}">
            ${appState.language === "vi" ? "Dùng mẫu này" : "Use this template"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderReceiptTemplateEditor() {
  const dictionary = getCurrentDictionary();
  const editingTemplate = getEditingReceiptTemplate();
  const form = elements.receiptTemplateForm;
  if (!form || !elements.receiptTemplateEditorSelect) {
    return;
  }

  elements.receiptTemplateEditorSelect.innerHTML = `
    <option value="">${dictionary.receiptTemplateDraftOption}</option>
    ${appState.receiptTemplates
      .map((template) => {
        const content = template[appState.language];
        return `<option value="${template.id}">${escapeHtml(content.name)}</option>`;
      })
      .join("")}
  `;

  if (editingTemplate) {
    elements.receiptTemplateEditorSelect.value = editingTemplate.id;
    form.elements.namedItem("name").value = editingTemplate.en.name;
    form.elements.namedItem("nameVi").value = editingTemplate.vi.name;
    form.elements.namedItem("description").value = editingTemplate.en.description;
    form.elements.namedItem("descriptionVi").value = editingTemplate.vi.description;
    form.elements.namedItem("theme").value = editingTemplate.theme;
    form.elements.namedItem("showContact").checked = editingTemplate.showContact;
    form.elements.namedItem("showTaxId").checked = editingTemplate.showTaxId;
    form.elements.namedItem("showOrderMeta").checked = editingTemplate.showOrderMeta;
    form.elements.namedItem("showPayment").checked = editingTemplate.showPayment;
    form.elements.namedItem("showCustomer").checked = editingTemplate.showCustomer;
    form.elements.namedItem("showFooter").checked = editingTemplate.showFooter;
  } else {
    elements.receiptTemplateEditorSelect.value = "";
    form.reset();
    form.elements.namedItem("theme").value = "compact";
    form.elements.namedItem("showContact").checked = true;
    form.elements.namedItem("showTaxId").checked = true;
    form.elements.namedItem("showOrderMeta").checked = true;
    form.elements.namedItem("showPayment").checked = true;
    form.elements.namedItem("showCustomer").checked = true;
    form.elements.namedItem("showFooter").checked = true;
  }
}

function renderBarcodeTemplateGrid() {
  const dictionary = getCurrentDictionary();
  elements.barcodeTemplateGrid.innerHTML = appState.barcodeTemplates
    .map((template) => {
      const name = appState.language === "vi" ? template.nameVi : template.name;
      const description = appState.language === "vi" ? template.descriptionVi : template.description;
      return `
        <article class="template-card ${appState.selectedBarcodeTemplate === template.id ? "is-active" : ""}">
          <div class="product-meta">
            <h5>${escapeHtml(name)}</h5>
            <span class="tag">${template.id}</span>
          </div>
          <p class="muted">${escapeHtml(description)}</p>
          <button class="secondary-btn" data-barcode-template-select="${template.id}">
            ${dictionary.barcodeUseTemplate}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderBarcodeTemplateEditor() {
  const dictionary = getCurrentDictionary();
  const editingTemplate = getEditingBarcodeTemplate();
  const form = elements.barcodeTemplateForm;
  if (!form || !elements.barcodeTemplateEditorSelect) {
    return;
  }

  elements.barcodeTemplateEditorSelect.innerHTML = `
    <option value="">${dictionary.templateDraftOption}</option>
    ${appState.barcodeTemplates
      .map((template) => {
        const name = appState.language === "vi" ? template.nameVi : template.name;
        return `<option value="${template.id}">${escapeHtml(name)}</option>`;
      })
      .join("")}
  `;

  if (editingTemplate) {
    elements.barcodeTemplateEditorSelect.value = editingTemplate.id;
    form.elements.namedItem("name").value = editingTemplate.name;
    form.elements.namedItem("nameVi").value = editingTemplate.nameVi;
    form.elements.namedItem("description").value = editingTemplate.description;
    form.elements.namedItem("descriptionVi").value = editingTemplate.descriptionVi;
    form.elements.namedItem("className").value = editingTemplate.className;
    form.elements.namedItem("showStore").checked = editingTemplate.showStore;
    form.elements.namedItem("showCategory").checked = editingTemplate.showCategory;
    form.elements.namedItem("showStock").checked = editingTemplate.showStock;
    form.elements.namedItem("showFooter").checked = editingTemplate.showFooter;
  } else {
    elements.barcodeTemplateEditorSelect.value = "";
    form.reset();
    form.elements.namedItem("className").value = "sticker";
    form.elements.namedItem("showStore").checked = true;
    form.elements.namedItem("showCategory").checked = true;
    form.elements.namedItem("showStock").checked = true;
    form.elements.namedItem("showFooter").checked = true;
  }
}

function renderBarcodeProductSelect() {
  const selectedProduct = ensureSelectedLabelProduct();
  elements.barcodeLabelProductSelect.innerHTML = appState.products
    .map(
      (product) =>
        `<option value="${product.id}">${escapeHtml(product.name)} • ${formatCurrency(product.price)} • ${product.barcode}</option>`,
    )
    .join("");

  if (selectedProduct) {
    elements.barcodeLabelProductSelect.value = selectedProduct.id;
  }
}

function buildEan13Pattern(barcode) {
  const normalizedBarcode = String(barcode).trim();
  if (!/^\d{13}$/.test(normalizedBarcode)) {
    return "";
  }

  const leftParityMap = {
    0: "LLLLLL",
    1: "LLGLGG",
    2: "LLGGLG",
    3: "LLGGGL",
    4: "LGLLGG",
    5: "LGGLLG",
    6: "LGGGLL",
    7: "LGLGLG",
    8: "LGLGGL",
    9: "LGGLGL",
  };

  const encodings = {
    L: {
      0: "0001101",
      1: "0011001",
      2: "0010011",
      3: "0111101",
      4: "0100011",
      5: "0110001",
      6: "0101111",
      7: "0111011",
      8: "0110111",
      9: "0001011",
    },
    G: {
      0: "0100111",
      1: "0110011",
      2: "0011011",
      3: "0100001",
      4: "0011101",
      5: "0111001",
      6: "0000101",
      7: "0010001",
      8: "0001001",
      9: "0010111",
    },
    R: {
      0: "1110010",
      1: "1100110",
      2: "1101100",
      3: "1000010",
      4: "1011100",
      5: "1001110",
      6: "1010000",
      7: "1000100",
      8: "1001000",
      9: "1110100",
    },
  };

  const leadingDigit = Number(normalizedBarcode[0]);
  const parity = leftParityMap[leadingDigit];
  const leftDigits = normalizedBarcode.slice(1, 7).split("");
  const rightDigits = normalizedBarcode.slice(7).split("");

  const leftPattern = leftDigits
    .map((digit, index) => encodings[parity[index]][digit])
    .join("");
  const rightPattern = rightDigits.map((digit) => encodings.R[digit]).join("");

  return `101${leftPattern}01010${rightPattern}101`;
}

function renderEan13BarcodeSvg(barcode) {
  const pattern = buildEan13Pattern(barcode);
  if (!pattern) {
    return `<div class="muted">${escapeHtml(barcode)}</div>`;
  }

  const moduleWidth = 2;
  const quietZone = 12;
  const barHeight = 72;
  const guardHeight = 84;
  const width = (pattern.length + quietZone * 2) * moduleWidth;
  const viewBoxHeight = 92;
  const guardIndexes = new Set([
    0, 1, 2,
    45, 46, 47, 48, 49,
    92, 93, 94,
  ]);

  const bars = pattern
    .split("")
    .map((bit, index) => {
      if (bit !== "1") {
        return "";
      }

      const x = (quietZone + index) * moduleWidth;
      const height = guardIndexes.has(index) ? guardHeight : barHeight;
      return `<rect x="${x}" y="0" width="${moduleWidth}" height="${height}" fill="#111111" />`;
    })
    .join("");

  return `
    <svg class="barcode-svg" viewBox="0 0 ${width} ${viewBoxHeight}" role="img" aria-label="EAN-13 barcode ${escapeHtml(barcode)}">
      <rect width="${width}" height="${viewBoxHeight}" fill="#ffffff" />
      ${bars}
    </svg>
  `;
}

function renderBarcodeLabelPreview() {
  const dictionary = getCurrentDictionary();
  const product = ensureSelectedLabelProduct();
  const template = getSelectedBarcodeTemplate();

  if (!product) {
    elements.barcodeLabelPreview.className = "barcode-label-preview";
    elements.barcodeLabelPreview.innerHTML = `<p class="muted">${dictionary.barcodeLabelEmpty}</p>`;
    return;
  }

  const barcodeSvg = renderEan13BarcodeSvg(product.barcode);
  const categoryLabel = appState.language === "vi" ? "Danh mục" : "Category";
  const stockLabel = appState.language === "vi" ? "Tồn kho" : "Stock";
  const websiteText = appState.settings.storeWebsite || appState.settings.storePhone || "";
  const templateMeta = [
    template.showCategory ? `<div>${categoryLabel}: ${escapeHtml(product.category)}</div>` : "",
    template.showStock ? `<div>${stockLabel}: ${product.stock}</div>` : "",
  ]
    .filter(Boolean)
    .join("");

  elements.barcodeLabelPreview.className = `barcode-label-preview ${template.className}`;
  elements.barcodeLabelPreview.innerHTML = `
    <div class="barcode-label-head">
      <div>
        ${template.showStore ? `<div class="barcode-label-store">${escapeHtml(appState.settings.storeName)}</div>` : ""}
        <h5>${escapeHtml(getProductDisplayName(product))}</h5>
      </div>
      <div class="barcode-label-price">${formatCurrency(product.price)}</div>
    </div>
    <div class="barcode-svg-wrap">
      ${barcodeSvg}
      <div class="barcode-code">${escapeHtml(product.barcode)}</div>
    </div>
    ${templateMeta ? `<div class="barcode-label-meta">${templateMeta}</div>` : ""}
    ${template.showFooter && websiteText ? `<div class="barcode-label-foot">${escapeHtml(websiteText)}</div>` : ""}
  `;
}

function renderSettingsForm() {
  elements.settingsForm.elements.namedItem("storeName").value = appState.settings.storeName;
  elements.settingsForm.elements.namedItem("storeAddress").value = appState.settings.storeAddress;
  elements.settingsForm.elements.namedItem("storePhone").value = appState.settings.storePhone;
  elements.settingsForm.elements.namedItem("storeEmail").value = appState.settings.storeEmail;
  elements.settingsForm.elements.namedItem("storeWebsite").value = appState.settings.storeWebsite;
  elements.settingsForm.elements.namedItem("taxId").value = appState.settings.taxId;
  elements.settingsForm.elements.namedItem("taxRate").value = appState.settings.taxRate;
  elements.settingsForm.elements.namedItem("receiptFooter").value = appState.settings.receiptFooter;
  elements.storeName.textContent = appState.settings.storeName;
  if (elements.settingsSaveState) {
    elements.settingsSaveState.textContent = getCurrentDictionary().settingsAutosaveReady;
  }
}

function renderSettingsPreview() {
  if (!elements.settingsPreview) {
    return;
  }

  const labels =
    appState.language === "vi"
      ? {
          address: "Địa chỉ",
          phone: "Số điện thoại",
          email: "Email",
          website: "Website",
          taxId: "Mã số thuế",
          taxRate: "Thuế",
        }
      : {
          address: "Address",
          phone: "Phone",
          email: "Email",
          website: "Website",
          taxId: "Tax ID",
          taxRate: "Tax",
        };

  elements.settingsPreview.innerHTML = `
    <article class="settings-preview-card">
      <h5>${appState.settings.storeName}</h5>
      <div class="settings-preview-grid">
        <div class="settings-preview-row"><span>${labels.address}</span><strong>${appState.settings.storeAddress}</strong></div>
        <div class="settings-preview-row"><span>${labels.phone}</span><strong>${appState.settings.storePhone || "-"}</strong></div>
        <div class="settings-preview-row"><span>${labels.email}</span><strong>${appState.settings.storeEmail || "-"}</strong></div>
        <div class="settings-preview-row"><span>${labels.website}</span><strong>${appState.settings.storeWebsite || "-"}</strong></div>
        <div class="settings-preview-row"><span>${labels.taxId}</span><strong>${appState.settings.taxId || "-"}</strong></div>
        <div class="settings-preview-row"><span>${labels.taxRate}</span><strong>${appState.settings.taxRate}%</strong></div>
      </div>
    </article>
  `;
}

function renderClock() {
  elements.clockText.textContent = new Intl.DateTimeFormat(
    appState.language === "vi" ? "vi-VN" : "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date());
}

function renderAll() {
  renderTranslations();
  renderLanguageButtons();
  renderNavigation();
  renderDashboard();
  renderProducts();
  renderProductForm();
  renderInventory();
  renderReceiptTemplateEditor();
  renderBarcodeTemplateGrid();
  renderBarcodeTemplateEditor();
  renderBarcodeProductSelect();
  renderBarcodeLabelPreview();
  renderPaymentOptions();
  renderQuickCashButtons();
  renderCart();
  renderTemplates();
  renderReceiptPreview();
  renderSettingsForm();
  renderSettingsPreview();
  renderClock();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

function setLanguage(language) {
  appState.language = language;
  localStorage.setItem(STORAGE_KEYS.language, language);
  renderAll();
}

function changeSection(section) {
  appState.activeSection = section;
  renderNavigation();
}

function invalidateDraftReceipt() {
  appState.lastReceipt = null;
}

function addProductToCart(productId) {
  const product = appState.products.find((entry) => entry.id === productId);
  if (!product) {
    return;
  }

  if (product.stock <= 0) {
    showToast(appState.language === "vi" ? "Sản phẩm đã hết hàng." : "This product is out of stock.");
    return;
  }

  const existing = appState.cart.find((item) => item.id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(appState.language === "vi" ? "Vượt quá tồn kho hiện có." : "Cannot exceed available stock.");
      return;
    }
    existing.quantity += 1;
  } else {
    appState.cart.push({ ...product, quantity: 1 });
  }

  invalidateDraftReceipt();
  renderAll();
}

function updateCartQuantity(productId, delta) {
  const item = appState.cart.find((entry) => entry.id === productId);
  if (!item) {
    return;
  }

  const product = appState.products.find((entry) => entry.id === productId);
  const nextQuantity = item.quantity + delta;

  if (nextQuantity <= 0) {
    appState.cart = appState.cart.filter((entry) => entry.id !== productId);
  } else if (product && nextQuantity <= product.stock) {
    item.quantity = nextQuantity;
  } else {
    showToast(appState.language === "vi" ? "Không đủ tồn kho." : "Not enough stock.");
  }

  invalidateDraftReceipt();
  renderAll();
}

function removeCartItem(productId) {
  appState.cart = appState.cart.filter((entry) => entry.id !== productId);
  invalidateDraftReceipt();
  renderAll();
}

function addByBarcode(code) {
  const normalized = code.trim();
  if (!normalized) {
    return;
  }

  const product = appState.products.find((entry) => entry.barcode === normalized);
  if (!product) {
    showToast(appState.language === "vi" ? "Không tìm thấy mã vạch." : "Barcode not found.");
    return;
  }

  addProductToCart(product.id);
  elements.barcodeInput.value = "";
  showToast(
    appState.language === "vi"
      ? `Đã thêm ${product.nameVi}`
      : `Added ${product.name}`,
  );
}

function handleCompleteSale() {
  if (appState.cart.length === 0) {
    showToast(appState.language === "vi" ? "Giỏ hàng đang trống." : "Your cart is empty.");
    return;
  }

  const summary = getSummary();
  if (summary.amountTendered < summary.total && elements.paymentMethod.value === "cash") {
    showToast(
      appState.language === "vi"
        ? "Tiền khách đưa chưa đủ để thanh toán."
        : "Tendered amount is not enough for this cash sale.",
    );
    return;
  }

  const sale = buildReceiptSale();
  appState.lastReceipt = sale;
  appState.sales.push(sale);

  appState.products = appState.products.map((product) => {
    const cartItem = appState.cart.find((item) => item.id === product.id);
    if (!cartItem) {
      return product;
    }
    return {
      ...product,
      stock: Math.max(product.stock - cartItem.quantity, 0),
    };
  });

  saveState(STORAGE_KEYS.products, appState.products);
  saveState(STORAGE_KEYS.sales, appState.sales);

  appState.cart = [];
  elements.amountTendered.value = "";
  elements.customerName.value = "";
  renderAll();
  changeSection("receipts");
  showToast(appState.language === "vi" ? "Đã hoàn tất bán hàng." : "Sale completed.");
}

function createProductFromForm(formData) {
  const price = Number(formData.get("price"));
  const editingProduct = getEditingProduct();
  const barcode =
    formData.get("barcode").trim() ||
    (editingProduct && editingProduct.price === price
      ? editingProduct.barcode
      : generateBarcodeForPrice(price, { ignoreProductId: editingProduct?.id || null }));

  if (!barcode) {
    showToast(getCurrentDictionary().barcodeGenerationFailed);
    return;
  }

  const nextProduct = {
    id: editingProduct?.id || crypto.randomUUID(),
    name: formData.get("name").trim(),
    nameVi: formData.get("nameVi").trim(),
    category: formData.get("category").trim(),
    barcode,
    price,
    stock: Number(formData.get("stock")),
  };

  if (editingProduct) {
    appState.products = appState.products.map((product) =>
      product.id === editingProduct.id ? nextProduct : product,
    );
    appState.cart = appState.cart
      .map((item) => {
        if (item.id !== editingProduct.id) {
          return item;
        }

        const quantity = Math.min(item.quantity, nextProduct.stock);
        return quantity > 0
          ? {
              ...item,
              ...nextProduct,
              quantity,
            }
          : null;
      })
      .filter(Boolean);
    appState.editingProductId = null;
  } else {
    appState.products.unshift(nextProduct);
  }

  appState.selectedLabelProductId = nextProduct.id;
  saveState(STORAGE_KEYS.products, appState.products);
  elements.productForm.reset();
  elements.inventoryBarcode.value = "";
  invalidateDraftReceipt();
  renderAll();
  showToast(getCurrentDictionary()[editingProduct ? "productUpdated" : "productCreated"]);
}

function saveSettingsFromForm(formData, options = {}) {
  appState.settings = normalizeSettings({
    storeName: formData.get("storeName").trim(),
    storeAddress: formData.get("storeAddress").trim(),
    storePhone: formData.get("storePhone").trim(),
    storeEmail: formData.get("storeEmail").trim(),
    storeWebsite: formData.get("storeWebsite").trim(),
    taxId: formData.get("taxId").trim(),
    taxRate: Number(formData.get("taxRate")),
    receiptFooter: formData.get("receiptFooter").trim(),
  });
  saveState(STORAGE_KEYS.settings, appState.settings);
  elements.storeName.textContent = appState.settings.storeName;
  renderSettingsPreview();
  renderReceiptPreview();

  if (elements.settingsSaveState) {
    elements.settingsSaveState.textContent = options.auto
      ? getCurrentDictionary().settingsAutosaveSaved
      : getCurrentDictionary().settingsAutosaveReady;
  }

  if (!options.silent) {
    showToast(appState.language === "vi" ? "Đã cập nhật cài đặt cửa hàng." : "Store settings updated.");
  }
}

function saveReceiptTemplatesState() {
  saveState(STORAGE_KEYS.receiptTemplates, appState.receiptTemplates);
  localStorage.setItem(STORAGE_KEYS.template, appState.selectedTemplate);
}

function saveBarcodeTemplatesState() {
  saveState(STORAGE_KEYS.barcodeTemplates, appState.barcodeTemplates);
  localStorage.setItem(STORAGE_KEYS.barcodeLabelTemplate, appState.selectedBarcodeTemplate);
}

function selectTemplate(templateId) {
  appState.selectedTemplate = templateId;
  appState.editingReceiptTemplateId = templateId;
  localStorage.setItem(STORAGE_KEYS.template, templateId);
  renderTemplates();
  renderReceiptTemplateEditor();
  renderReceiptPreview();
}

function selectBarcodeTemplate(templateId) {
  appState.selectedBarcodeTemplate = templateId;
  appState.editingBarcodeTemplateId = templateId;
  localStorage.setItem(STORAGE_KEYS.barcodeLabelTemplate, templateId);
  renderBarcodeTemplateGrid();
  renderBarcodeTemplateEditor();
  renderBarcodeLabelPreview();
}

function selectLabelProduct(productId) {
  appState.selectedLabelProductId = productId;
  renderInventory();
  renderBarcodeProductSelect();
  renderBarcodeLabelPreview();
}

function startEditingProduct(productId) {
  appState.editingProductId = productId;
  changeSection("inventory");
  renderProductForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetProductForm() {
  appState.editingProductId = null;
  elements.productForm.reset();
  elements.inventoryBarcode.value = "";
  renderProductForm();
}

function removeProduct(productId) {
  if (!window.confirm(getCurrentDictionary().productDeleteConfirm)) {
    return;
  }

  appState.products = appState.products.filter((product) => product.id !== productId);
  appState.cart = appState.cart.filter((item) => item.id !== productId);
  if (appState.editingProductId === productId) {
    appState.editingProductId = null;
  }
  if (appState.selectedLabelProductId === productId) {
    appState.selectedLabelProductId = null;
  }

  ensureSelectedLabelProduct();
  saveState(STORAGE_KEYS.products, appState.products);
  invalidateDraftReceipt();
  renderAll();
  showToast(getCurrentDictionary().productRemoved);
}

function startNewReceiptTemplate() {
  appState.editingReceiptTemplateId = null;
  renderReceiptTemplateEditor();
}

function saveReceiptTemplateFromForm(formData) {
  const templateId = appState.editingReceiptTemplateId || `receipt-${crypto.randomUUID().slice(0, 8)}`;
  const nextTemplate = normalizeReceiptTemplate(
    {
      id: templateId,
      theme: formData.get("theme"),
      en: {
        name: formData.get("name").trim(),
        description: formData.get("description").trim(),
      },
      vi: {
        name: formData.get("nameVi").trim(),
        description: formData.get("descriptionVi").trim(),
      },
      showContact: formData.get("showContact") === "on",
      showTaxId: formData.get("showTaxId") === "on",
      showOrderMeta: formData.get("showOrderMeta") === "on",
      showPayment: formData.get("showPayment") === "on",
      showCustomer: formData.get("showCustomer") === "on",
      showFooter: formData.get("showFooter") === "on",
    },
    0,
  );

  const existingIndex = appState.receiptTemplates.findIndex((template) => template.id === templateId);
  const isNewTemplate = existingIndex === -1;

  if (isNewTemplate) {
    appState.receiptTemplates.push(nextTemplate);
  } else {
    appState.receiptTemplates[existingIndex] = nextTemplate;
  }

  appState.selectedTemplate = templateId;
  appState.editingReceiptTemplateId = templateId;
  saveReceiptTemplatesState();
  renderAll();
  showToast(getCurrentDictionary()[isNewTemplate ? "receiptTemplateCreated" : "receiptTemplateUpdated"]);
}

function removeEditingReceiptTemplate() {
  if (!appState.editingReceiptTemplateId) {
    startNewReceiptTemplate();
    return;
  }

  if (appState.receiptTemplates.length <= 1) {
    showToast(getCurrentDictionary().receiptTemplateDeleteBlocked);
    return;
  }

  appState.receiptTemplates = appState.receiptTemplates.filter(
    (template) => template.id !== appState.editingReceiptTemplateId,
  );
  appState.selectedTemplate = appState.receiptTemplates[0].id;
  appState.editingReceiptTemplateId = appState.selectedTemplate;
  saveReceiptTemplatesState();
  renderAll();
  showToast(getCurrentDictionary().receiptTemplateRemoved);
}

function startNewBarcodeTemplate() {
  appState.editingBarcodeTemplateId = null;
  renderBarcodeTemplateEditor();
}

function saveBarcodeTemplateFromForm(formData) {
  const templateId = appState.editingBarcodeTemplateId || `barcode-${crypto.randomUUID().slice(0, 8)}`;
  const nextTemplate = normalizeBarcodeTemplate(
    {
      id: templateId,
      name: formData.get("name").trim(),
      nameVi: formData.get("nameVi").trim(),
      description: formData.get("description").trim(),
      descriptionVi: formData.get("descriptionVi").trim(),
      className: formData.get("className"),
      showStore: formData.get("showStore") === "on",
      showCategory: formData.get("showCategory") === "on",
      showStock: formData.get("showStock") === "on",
      showFooter: formData.get("showFooter") === "on",
    },
    0,
  );

  const existingIndex = appState.barcodeTemplates.findIndex((template) => template.id === templateId);
  const isNewTemplate = existingIndex === -1;

  if (isNewTemplate) {
    appState.barcodeTemplates.push(nextTemplate);
  } else {
    appState.barcodeTemplates[existingIndex] = nextTemplate;
  }

  appState.selectedBarcodeTemplate = templateId;
  appState.editingBarcodeTemplateId = templateId;
  saveBarcodeTemplatesState();
  renderAll();
  showToast(getCurrentDictionary()[isNewTemplate ? "templateCreated" : "templateUpdated"]);
}

function removeEditingBarcodeTemplate() {
  if (!appState.editingBarcodeTemplateId) {
    startNewBarcodeTemplate();
    return;
  }

  if (appState.barcodeTemplates.length <= 1) {
    showToast(getCurrentDictionary().templateDeleteBlocked);
    return;
  }

  appState.barcodeTemplates = appState.barcodeTemplates.filter(
    (template) => template.id !== appState.editingBarcodeTemplateId,
  );
  appState.selectedBarcodeTemplate = appState.barcodeTemplates[0].id;
  appState.editingBarcodeTemplateId = appState.selectedBarcodeTemplate;
  saveBarcodeTemplatesState();
  renderAll();
  showToast(getCurrentDictionary().templateRemoved);
}

async function startCameraScan() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast(appState.language === "vi" ? "Trình duyệt không hỗ trợ camera." : "Camera is not supported.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    appState.cameraStream = stream;
    elements.scannerVideo.srcObject = stream;
    await elements.scannerVideo.play();
    appState.scanLoopActive = true;
    elements.scannerStatus.textContent =
      appState.language === "vi" ? "Đang quét bằng camera" : "Camera scanning";

    if ("BarcodeDetector" in window) {
      scanWithBarcodeDetector(new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128"] }));
    } else {
      showToast(
        appState.language === "vi"
          ? "Camera đã mở, nhưng trình duyệt này không có BarcodeDetector."
          : "Camera started, but this browser does not provide BarcodeDetector.",
      );
    }
  } catch (error) {
    console.error(error);
    showToast(appState.language === "vi" ? "Không thể mở camera." : "Unable to access the camera.");
  }
}

async function scanWithBarcodeDetector(detector) {
  while (appState.scanLoopActive) {
    try {
      const detections = await detector.detect(elements.scannerVideo);
      if (detections.length > 0 && detections[0].rawValue) {
        addByBarcode(detections[0].rawValue);
        stopCameraScan();
        break;
      }
    } catch (error) {
      console.error("Barcode scan failed", error);
      break;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 240));
  }
}

function stopCameraScan() {
  appState.scanLoopActive = false;
  if (appState.cameraStream) {
    appState.cameraStream.getTracks().forEach((track) => track.stop());
  }
  appState.cameraStream = null;
  elements.scannerVideo.srcObject = null;
  elements.scannerStatus.textContent =
    appState.language === "vi" ? "Máy quét sẵn sàng" : "Scanner ready";
}

function handleScannerKeyboard(event) {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    return;
  }

  const now = Date.now();
  if (now - appState.scannerLastKeyAt > 120) {
    appState.scannerBuffer = "";
  }
  appState.scannerLastKeyAt = now;

  if (event.key === "Enter") {
    if (appState.scannerBuffer.length >= 8) {
      addByBarcode(appState.scannerBuffer);
    }
    appState.scannerBuffer = "";
    return;
  }

  if (/^[0-9A-Za-z]$/.test(event.key)) {
    appState.scannerBuffer += event.key;
  }
}

function printReceipt() {
  renderReceiptPreview();
  const template = document.getElementById("receipt-print-template");
  const clone = template.content.cloneNode(true);
  const printableReceipt = clone.querySelector("#printable-receipt");
  printableReceipt.className = elements.receiptPreview.className;
  printableReceipt.innerHTML = elements.receiptPreview.innerHTML;

  document.body.appendChild(clone);
  window.print();
  const printStage = document.querySelector(".print-stage");
  if (printStage) {
    printStage.remove();
  }
}

function printBarcodeLabel(productId = appState.selectedLabelProductId) {
  if (productId) {
    appState.selectedLabelProductId = productId;
  }

  const product = ensureSelectedLabelProduct();
  if (!product) {
    showToast(getCurrentDictionary().barcodeLabelEmpty);
    return;
  }

  renderInventory();
  renderBarcodeProductSelect();
  renderBarcodeLabelPreview();

  const printStage = document.createElement("div");
  printStage.className = "print-stage";
  const printableLabel = document.createElement("div");
  printableLabel.className = elements.barcodeLabelPreview.className;
  printableLabel.innerHTML = elements.barcodeLabelPreview.innerHTML;
  printStage.appendChild(printableLabel);
  document.body.appendChild(printStage);
  window.print();
  printStage.remove();
  showToast(getCurrentDictionary().barcodePrinted);
}

function createDemoSale() {
  if (appState.products.length === 0) {
    showToast(appState.language === "vi" ? "Hãy tạo sản phẩm trước." : "Add products first.");
    return;
  }

  appState.cart = [];
  appState.products.slice(0, 3).forEach((product) => {
    addProductToCart(product.id);
  });
  elements.customerName.value = appState.language === "vi" ? "Khách thử nghiệm" : "Demo customer";
  elements.amountTendered.value = "200000";
  changeSection("pos");
  renderAll();
}

function scheduleSettingsAutoSave() {
  window.clearTimeout(scheduleSettingsAutoSave.timer);
  scheduleSettingsAutoSave.timer = window.setTimeout(() => {
    if (!elements.settingsForm.reportValidity()) {
      return;
    }
    saveSettingsFromForm(new FormData(elements.settingsForm), { auto: true, silent: true });
  }, 420);
}

function bindEvents() {
  document.querySelectorAll(".nav-chip").forEach((button) => {
    button.addEventListener("click", () => changeSection(button.dataset.section));
  });

  document.querySelectorAll("[data-section-jump]").forEach((button) => {
    button.addEventListener("click", () => changeSection(button.dataset.sectionJump));
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  document.body.addEventListener("click", (event) => {
    const paymentTrigger = event.target.closest("[data-payment-method-toggle]");
    if (paymentTrigger) {
      if (appState.paymentMenuOpen) {
        closePaymentMethodMenu();
      } else {
        openPaymentMethodMenu();
      }
      return;
    }

    const paymentOptionTarget = event.target.closest("[data-payment-method-option]");
    if (paymentOptionTarget) {
      setPaymentMethod(paymentOptionTarget.dataset.paymentMethodOption, { notify: true });
      closePaymentMethodMenu();
      return;
    }

    if (appState.paymentMenuOpen && !event.target.closest("#payment-method-menu")) {
      closePaymentMethodMenu();
    }

    const addTarget = event.target.closest("[data-product-add]");
    if (addTarget) {
      addProductToCart(addTarget.dataset.productAdd);
    }

    const changeTarget = event.target.closest("[data-cart-change]");
    if (changeTarget) {
      updateCartQuantity(changeTarget.dataset.cartChange, Number(changeTarget.dataset.delta));
    }

    const removeTarget = event.target.closest("[data-cart-remove]");
    if (removeTarget) {
      removeCartItem(removeTarget.dataset.cartRemove);
    }

    const cashTarget = event.target.closest("[data-quick-cash]");
    if (cashTarget) {
      elements.amountTendered.value = cashTarget.dataset.quickCash;
      renderCart();
    }

    const templateTarget = event.target.closest("[data-template-select]");
    if (templateTarget) {
      selectTemplate(templateTarget.dataset.templateSelect);
    }

    const productEditTarget = event.target.closest("[data-product-edit]");
    if (productEditTarget) {
      startEditingProduct(productEditTarget.dataset.productEdit);
    }

    const productRemoveTarget = event.target.closest("[data-product-remove]");
    if (productRemoveTarget) {
      removeProduct(productRemoveTarget.dataset.productRemove);
    }

    const barcodeTemplateTarget = event.target.closest("[data-barcode-template-select]");
    if (barcodeTemplateTarget) {
      selectBarcodeTemplate(barcodeTemplateTarget.dataset.barcodeTemplateSelect);
    }

    const labelSelectTarget = event.target.closest("[data-label-select]");
    if (labelSelectTarget) {
      selectLabelProduct(labelSelectTarget.dataset.labelSelect);
      showToast(getCurrentDictionary().barcodeLabelReady);
    }

    const barcodePrintTarget = event.target.closest("[data-barcode-print]");
    if (barcodePrintTarget) {
      printBarcodeLabel(barcodePrintTarget.dataset.barcodePrint);
    }
  });

  elements.productSearch.addEventListener("input", (event) => {
    appState.productSearch = event.target.value;
    renderProducts();
  });

  document.getElementById("scan-submit").addEventListener("click", () => addByBarcode(elements.barcodeInput.value));
  elements.barcodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addByBarcode(elements.barcodeInput.value);
    }
  });

  document.getElementById("clear-cart").addEventListener("click", () => {
    appState.cart = [];
    invalidateDraftReceipt();
    renderAll();
  });
  elements.amountTendered.addEventListener("input", () => {
    invalidateDraftReceipt();
    renderCart();
    renderReceiptPreview();
  });
  elements.paymentMethod.addEventListener("change", () => {
    syncPaymentMethodDropdown();
    invalidateDraftReceipt();
    renderReceiptPreview();
  });
  elements.paymentMethodTrigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openPaymentMethodMenu();
    }
  });
  elements.customerName.addEventListener("input", () => {
    invalidateDraftReceipt();
    renderReceiptPreview();
  });
  document.getElementById("preview-bill").addEventListener("click", () => {
    appState.lastReceipt = buildReceiptSale();
    renderReceiptPreview();
    changeSection("receipts");
  });
  document.getElementById("complete-sale").addEventListener("click", handleCompleteSale);

  elements.productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createProductFromForm(new FormData(event.currentTarget));
  });
  elements.productFormCancel.addEventListener("click", resetProductForm);
  elements.productForm.elements.namedItem("price").addEventListener("input", updateInventoryBarcodePreview);
  document.getElementById("generate-barcode-btn").addEventListener("click", updateInventoryBarcodePreview);
  elements.receiptTemplateEditorSelect.addEventListener("change", (event) => {
    const templateId = event.target.value || null;
    appState.editingReceiptTemplateId = templateId;
    if (templateId) {
      appState.selectedTemplate = templateId;
      localStorage.setItem(STORAGE_KEYS.template, templateId);
      renderTemplates();
      renderReceiptPreview();
    }
    renderReceiptTemplateEditor();
  });
  elements.barcodeLabelProductSelect.addEventListener("change", (event) => {
    selectLabelProduct(event.target.value);
  });
  elements.barcodeTemplateEditorSelect.addEventListener("change", (event) => {
    const templateId = event.target.value || null;
    appState.editingBarcodeTemplateId = templateId;
    if (templateId) {
      appState.selectedBarcodeTemplate = templateId;
      localStorage.setItem(STORAGE_KEYS.barcodeLabelTemplate, templateId);
      renderBarcodeTemplateGrid();
      renderBarcodeLabelPreview();
    }
    renderBarcodeTemplateEditor();
  });

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettingsFromForm(new FormData(event.currentTarget));
  });
  elements.settingsForm.addEventListener("input", scheduleSettingsAutoSave);
  elements.settingsForm.addEventListener("change", scheduleSettingsAutoSave);
  elements.receiptTemplateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveReceiptTemplateFromForm(new FormData(event.currentTarget));
  });
  elements.barcodeTemplateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveBarcodeTemplateFromForm(new FormData(event.currentTarget));
  });
  document.getElementById("receipt-template-new-btn").addEventListener("click", startNewReceiptTemplate);
  document.getElementById("receipt-template-remove-btn").addEventListener("click", removeEditingReceiptTemplate);
  document.getElementById("barcode-template-new-btn").addEventListener("click", startNewBarcodeTemplate);
  document.getElementById("barcode-template-remove-btn").addEventListener("click", removeEditingBarcodeTemplate);

  document.getElementById("print-receipt-btn").addEventListener("click", printReceipt);
  document.getElementById("print-barcode-btn").addEventListener("click", () => {
    printBarcodeLabel();
  });
  document.getElementById("open-print-preview").addEventListener("click", () => {
    changeSection("receipts");
    renderReceiptPreview();
  });
  document.getElementById("focus-scan").addEventListener("click", () => {
    changeSection("pos");
    elements.barcodeInput.focus();
  });
  document.getElementById("start-demo-sale").addEventListener("click", createDemoSale);
  document.getElementById("start-camera-scan").addEventListener("click", startCameraScan);
  document.getElementById("stop-camera-scan").addEventListener("click", stopCameraScan);

  window.addEventListener("keydown", handleScannerKeyboard);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && appState.paymentMenuOpen) {
      closePaymentMethodMenu();
      elements.paymentMethodTrigger.focus();
    }
  });
}

function init() {
  appState.products = normalizeProducts(appState.products);
  appState.settings = normalizeSettings(appState.settings);
  appState.receiptTemplates = normalizeReceiptTemplates(
    loadState(STORAGE_KEYS.receiptTemplates, defaultReceiptTemplates),
  );
  appState.selectedTemplate = getSelectedReceiptTemplate().id;
  appState.editingReceiptTemplateId = appState.selectedTemplate;
  appState.barcodeTemplates = normalizeBarcodeTemplates(
    loadState(STORAGE_KEYS.barcodeTemplates, defaultBarcodeLabelTemplates),
  );
  appState.selectedBarcodeTemplate = getSelectedBarcodeTemplate().id;
  appState.editingBarcodeTemplateId = appState.selectedBarcodeTemplate;
  ensureSelectedLabelProduct();
  saveState(STORAGE_KEYS.products, appState.products);
  saveState(STORAGE_KEYS.settings, appState.settings);
  saveState(STORAGE_KEYS.receiptTemplates, appState.receiptTemplates);
  saveState(STORAGE_KEYS.barcodeTemplates, appState.barcodeTemplates);
  bindEvents();
  renderAll();
  updateInventoryBarcodePreview();
  window.setInterval(renderClock, 60000);
}

init();
