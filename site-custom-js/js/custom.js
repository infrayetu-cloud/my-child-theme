(function () {
  const CONFIG = {
    API_BASE: "https://api.markiti.laheri.co.ke/api/v1",
    ENDPOINTS: {
      warehouses: "/public/warehouse",
      types: "/public/producttype",
      products: "/public/product",
      placeOrder: "/public/order",
      stkPush: "/public/order/{orderId}/stk",
      agentLookup: "/public/organisation/lookup",
    },
    TITLE: "Markiti Express",
    TAGLINE: "Keep it Cool. Deliver While Still Fresh!",
    LOGO_URL:
      "https://portal.markiti.laheri.co.ke/static/media/new_logo_colored2.a5355583.png",
    PAYBILL_NUMBER: "4015545",
    PRIMARY_COLOR: "#1BB5A6",
    SECONDARY_COLOR: "#6B46C1",
    SUCCESS_COLOR: "#10B981",
    WARNING_COLOR: "#F59E0B",
    ERROR_COLOR: "#EF4444",
    WIDGET_WIDTH: 380,
    WIDGET_HEIGHT: 640,
    FREE_DELIVERY_THRESHOLD: 4000,
    // Cooking prep options + fees (KSh per unit).
    COOKING_METHODS: [
      { id: "none", label: "No preparation", fee: 0 },
      { id: "deep_fried", label: "Deep Fried", fee: 50 },
      { id: "grilled", label: "Grilled", fee: 70 },
    ],
    // Product type names (substring match, case-insensitive) that offer
    // cooking prep. Everything else skips that step.
    COOKING_METHOD_TYPE_MATCHES: ["tilapia", "chicken"],
  };

  // -------------- UTILS --------------
  const $ = (s, r = document) => r.querySelector(s);

  function el(t, a = {}, ...c) {
    const e = document.createElement(t);
    Object.entries(a).forEach(([k, v]) => {
      if (k === "style") {
        Object.assign(e.style, v);
      } else if (k === "class") {
        e.className = v;
      } else if (k === "onclick") {
        e.onclick = new Function(v);
      } else {
        e.setAttribute(k, v);
      }
    });
    c.forEach((x) =>
      e.appendChild(typeof x === "string" ? document.createTextNode(x) : x),
    );
    return e;
  }

  async function api(path, opts = {}) {
    try {
      const h = { Accept: "application/json" };
      if (opts.body) {
        h["Content-Type"] = "application/json";
        opts.body = JSON.stringify(opts.body);
      }
      const r = await fetch(CONFIG.API_BASE + path, { ...opts, headers: h });
      if (!r.ok) throw new Error(r.status + " " + (await r.text()));
      return r.json();
    } catch (e) {
      console.error("API Error:", e);
      throw e;
    }
  }

  function toast(m, t = "info") {
    const colors = {
      info: CONFIG.PRIMARY_COLOR,
      success: CONFIG.SUCCESS_COLOR,
      warning: CONFIG.WARNING_COLOR,
      error: CONFIG.ERROR_COLOR,
    };
    const n = el(
      "div",
      { class: "fw-toast", style: { backgroundColor: colors[t] || CONFIG.PRIMARY_COLOR } },
      m,
    );
    document.body.appendChild(n);
    setTimeout(() => n.classList.add("v"), 10);
    setTimeout(() => {
      n.classList.remove("v");
      setTimeout(() => n.remove(), 300);
    }, 4000);
  }

  function isCompletePhone(raw) {
    const v = (raw || "").trim();
    return /^07\d{8}$/.test(v) || /^\+2547\d{8}$/.test(v) || /^2547\d{8}$/.test(v);
  }

  function normalizePhone(raw) {
    let v = (raw || "").trim();
    if (v.startsWith("07")) v = "254" + v.substring(1);
    if (v.startsWith("+254")) v = v.substring(1);
    return v; // 2547XXXXXXXX
  }

  const FULL_NAME_REGEX = /^[A-Za-z'-]+(\s+[A-Za-z'-]+)+$/;
  function isValidFullName(name) {
    return FULL_NAME_REGEX.test((name || "").trim());
  }

  // -------------- DATE UTILS --------------
  function getMinDeliveryDate(isCollection) {
    const d = new Date();
    if (!isCollection) d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  function todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function isValidDeliveryDate(dateString, isCollection) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate.getDay() === 0) return false;
    if (isCollection) {
      return selectedDate >= today;
    }
    return selectedDate > today;
  }

  const icons = {
    warehouse: "🏢",
    fish: "🐟",
    meat: "🥩",
    vegetables: "🥬",
    fruits: "🍎",
    dairy: "🥛",
    grains: "🌾",
    spices: "🌶️",
    cart: "🛒",
    location: "📍",
    phone: "📱",
    user: "👤",
    business: "🏢",
    notes: "📝",
    calendar: "📅",
    clock: "🕐",
    back: "◀",
    next: "▶",
    close: "✕",
    check: "✓",
    chicken: "🐔",
    tilapia: "🐟",
    nileperch: "🐠",
    bulk: "📦",
    others: "🥘",
    plus: "➕",
    minus: "➖",
    home: "🏠",
    pickup: "🏪",
    grill: "🍢",
    trash: "🗑️",
  };

  // -------------- STYLES --------------
  const css = `
.fw-root{position:fixed;right:20px;bottom:20px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
.fw-btn{width:70px;height:70px;border-radius:50%;background:#5142A6;color:#fff;display:flex;align-items:center;justify-content:center;position:fixed;right:20px;bottom:20px;cursor:pointer;border:3px solid #fff;box-shadow:0 12px 30px rgba(81,66,166,0.28),0 6px 18px rgba(0,0,0,0.18);transition:transform 320ms cubic-bezier(.2,.9,.3,1),box-shadow 320ms cubic-bezier(.2,.9,.3,1);animation:float 3s ease-in-out infinite;z-index:99999;}
.fw-btn{
    position:relative;      /* anchor for the floating label */
    display:flex;
    flex-direction:column;
    align-items:center;
    background:transparent;
    border:none;
    cursor:pointer;
}

.fw-btn-label{
    position:absolute;
    top:-28px;
    left:50%;
    transform:translateX(-50%);
   background: #5f0c9a;
    color:#fff;
    font-size:12px;
    font-weight:600;
    padding:4px 10px;
    border-radius:12px;
    white-space:nowrap;
    box-shadow:0 2px 6px rgba(12, 12, 12, 0.15);
}
.fw-btn-icon {
    width: 66px;
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 50%;
}

.fw-btn-icon img {
    width: 115%;
    height: 115%;
    max-width: none;
    max-height: none;
    object-fit: contain;
    display: block;
}
.fw-btn:hover{transform:translateY(-8px) scale(1.15) rotate(-6deg);box-shadow:0 30px 80px rgba(81,66,166,0.36),0 12px 30px rgba(16,189,183,0.12);}
.fw-btn:active{transform:translateY(-2px) scale(0.98);transition:transform 120ms ease;}
.fw-btn::before{content:"";position:absolute;left:50%;top:50%;width:70px;height:70px;border-radius:50%;transform:translate(-50%,-50%);background:rgba(81,66,166,0.08);z-index:-1;animation:pulse-ring 2.4s infinite cubic-bezier(.4,0,.2,1);}
@keyframes pulse-ring{0%{transform:translate(-50%,-50%) scale(0.9);opacity:0.6;}50%{transform:translate(-50%,-50%) scale(1.05);opacity:0.18;}100%{transform:translate(-50%,-50%) scale(1.3);opacity:0;}}
@keyframes float{0%,100%{transform:translateY(0px);}50%{transform:translateY(-10px);}}
.fw-panel{position:fixed;right:20px;bottom:20px;width:${CONFIG.WIDGET_WIDTH}px;height:${CONFIG.WIDGET_HEIGHT}px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;display:flex;flex-direction:column;transform:translateY(20px);opacity:0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);display:none;}
.fw-panel.show{transform:translateY(0);opacity:1;}
.fw-head{padding:20px;background:linear-gradient(135deg,${CONFIG.PRIMARY_COLOR},${CONFIG.SECONDARY_COLOR});color:#fff;display:flex;align-items:center;box-shadow:0 4px 20px rgba(27,181,166,0.3);}
.fw-logo{width:40px;height:40px;border-radius:8px;background:#fff;padding:4px;margin-right:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
.fw-logo img{width:100%;height:100%;object-fit:contain;}
.fw-title-group{flex:1;}
.fw-title{font-weight:700;font-size:18px;margin:0;line-height:1.2;}
.fw-tag{font-size:12px;opacity:0.9;margin:2px 0 0 0;font-weight:400;}
.fw-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;}
.fw-close:hover{background:rgba(255,255,255,0.1);border-radius:4px;}
.fw-body{flex:1;overflow:auto;padding:20px;background:#fafbfc;scrollbar-width:thin;scrollbar-color:${CONFIG.PRIMARY_COLOR} #f1f1f1;}
.fw-body::-webkit-scrollbar{width:6px;}
.fw-body::-webkit-scrollbar-track{background:#f1f1f1;border-radius:3px;}
.fw-body::-webkit-scrollbar-thumb{background:${CONFIG.PRIMARY_COLOR};border-radius:3px;}
.fw-footer{padding:20px;border-top:1px solid #e5e7eb;display:flex;gap:12px;background:#fff;}
.fw-btn2{flex:1;padding:14px;border-radius:12px;border:none;cursor:pointer;font-weight:600;font-size:14px;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;gap:8px;}
.fw-btn2.main{background:linear-gradient(135deg,${CONFIG.PRIMARY_COLOR},#16a085);color:#fff;box-shadow:0 4px 12px rgba(27,181,166,0.3);}
.fw-btn2.main:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(27,181,166,0.4);}
.fw-btn2.ghost{background:#f8fafc;color:#475569;border:2px solid #e2e8f0;}
.fw-btn2.ghost:hover{background:#f1f5f9;border-color:#cbd5e1;}
.fw-btn2.text{flex:0;background:none;color:${CONFIG.PRIMARY_COLOR};padding:8px;font-size:13px;text-decoration:underline;box-shadow:none;}
.fw-section{margin-bottom:24px;}
.fw-section-title{font-size:16px;font-weight:600;color:#1e293b;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.fw-grid{display:grid;grid-template-columns:1fr;gap:12px;}
.fw-card{background:#fff;border-radius:12px;border:2px solid #e2e8f0;padding:16px;cursor:pointer;transition:all 0.2s ease;position:relative;overflow:hidden;}
.fw-card:hover{border-color:${CONFIG.PRIMARY_COLOR};box-shadow:0 8px 25px rgba(27,181,166,0.15);transform:translateY(-2px);}
.fw-card.selected{border-color:${CONFIG.PRIMARY_COLOR};background:linear-gradient(135deg,rgba(27,181,166,0.05),rgba(107,70,193,0.05));box-shadow:0 4px 20px rgba(27,181,166,0.2);}
.fw-card-icon{font-size:24px;margin-bottom:8px;}
.fw-card-title{font-weight:600;color:#1e293b;margin-bottom:4px;font-size:14px;}
.fw-card-desc{color:#64748b;font-size:12px;line-height:1.4;}
.fw-product-card{background:#fff;border-radius:16px;border:2px solid #e2e8f0;overflow:hidden;transition:all 0.3s ease;position:relative;}
.fw-product-card.out-of-stock{opacity:0.6;cursor:not-allowed;}
.fw-product-card:hover:not(.out-of-stock){border-color:${CONFIG.PRIMARY_COLOR};box-shadow:0 12px 35px rgba(27,181,166,0.2);transform:translateY(-4px);}
.fw-product-card.selected{border-color:${CONFIG.PRIMARY_COLOR};box-shadow:0 8px 30px rgba(27,181,166,0.25);}
.fw-product-image{width:100%;height:120px;object-fit:cover;background:linear-gradient(135deg,#f8fafc,#e2e8f0);}
.fw-product-info{padding:12px;}
.fw-product-name{font-weight:600;color:#1e293b;margin-bottom:4px;font-size:13px;line-height:1.3;}
.fw-product-price{color:${CONFIG.PRIMARY_COLOR};font-weight:700;font-size:16px;}
.fw-product-status{color:#EF4444;font-weight:600;font-size:12px;margin-top:4px;}
.fw-product-desc{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);color:#fff;padding:16px;opacity:0;transition:opacity 0.3s ease;display:flex;flex-direction:column;justify-content:center;font-size:12px;line-height:1.5;}
.fw-product-card:hover:not(.out-of-stock) .fw-product-desc{opacity:1;}
.fw-quantity-controls{display:flex;align-items:center;gap:12px;margin:16px 0;justify-content:center;}
.fw-quantity-btn{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,${CONFIG.PRIMARY_COLOR},${CONFIG.SECONDARY_COLOR});color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;transition:all 0.2s ease;}
.fw-quantity-btn:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(27,181,166,0.3);}
.fw-quantity-btn:disabled{background:#cbd5e1;cursor:not-allowed;transform:none;box-shadow:none;}
.fw-quantity-display{background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:8px 16px;font-weight:600;color:#1e293b;min-width:60px;text-align:center;}
.fw-input{width:100%;padding:14px 16px;border-radius:10px;border:2px solid #e2e8f0;margin-bottom:16px;font-size:14px;transition:all 0.2s ease;background:#fff;box-sizing:border-box;}
.fw-input:focus{outline:none;border-color:${CONFIG.PRIMARY_COLOR};box-shadow:0 0 0 3px rgba(27,181,166,0.1);}
.fw-input::placeholder{color:#94a3b8;}
.fw-input:disabled{background:#f1f5f9;color:#475569;}
.fw-form-group{margin-bottom:20px;}
.fw-label{display:block;font-weight:600;color:#374151;margin-bottom:8px;font-size:14px;}
.fw-radio-group{display:flex;gap:12px;margin-bottom:16px;}
.fw-radio{flex:1;padding:12px;border:2px solid #e2e8f0;border-radius:10px;text-align:center;cursor:pointer;transition:all 0.2s ease;background:#fff;font-size:13px;}
.fw-radio.selected{border-color:${CONFIG.PRIMARY_COLOR};background:rgba(27,181,166,0.05);color:${CONFIG.PRIMARY_COLOR};font-weight:600;}
.fw-checkbox-group{display:flex;align-items:center;margin-bottom:16px;cursor:pointer;padding:12px;border:2px solid #e2e8f0;border-radius:10px;transition:all 0.2s ease;}
.fw-checkbox-group:hover{border-color:${CONFIG.PRIMARY_COLOR};}
.fw-checkbox-group.selected{border-color:${CONFIG.PRIMARY_COLOR};background:rgba(27,181,166,0.05);}
.fw-checkbox{width:20px;height:20px;border:2px solid #e2e8f0;border-radius:4px;margin-right:12px;display:flex;align-items:center;justify-content:center;background:#fff;transition:all 0.2s ease;}
.fw-checkbox.checked{background:${CONFIG.PRIMARY_COLOR};border-color:${CONFIG.PRIMARY_COLOR};color:#fff;}
.fw-checkbox-label{flex:1;font-weight:600;color:#374151;}
.fw-date-warning{background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;margin-bottom:16px;font-size:12px;color:#92400e;}
.fw-checkout-summary{background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #e2e8f0;}
.fw-summary-item{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:14px;}
.fw-summary-total{border-top:1px solid #e2e8f0;padding-top:8px;font-weight:700;color:#1e293b;font-size:16px;}
.fw-free-delivery-badge{background:linear-gradient(135deg,${CONFIG.SUCCESS_COLOR},#059669);color:#fff;padding:4px 8px;border-radius:6px;font-size:10px;font-weight:600;animation:pulse 2s infinite;}
.fw-no-delivery-badge{background:linear-gradient(135deg,${CONFIG.PRIMARY_COLOR},${CONFIG.SECONDARY_COLOR});color:#fff;padding:4px 8px;border-radius:6px;font-size:10px;font-weight:600;}
.fw-hidden{display:none !important;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.7;}}
.fw-toast{position:fixed;right:20px;bottom:100px;color:#fff;padding:12px 16px;border-radius:10px;opacity:0;transform:translateY(10px);transition:all 0.3s ease;font-weight:500;box-shadow:0 8px 25px rgba(0,0,0,0.2);z-index:100000;}
.fw-toast.v{opacity:1;transform:none;}
.fw-success{background:linear-gradient(135deg,${CONFIG.SUCCESS_COLOR},#059669);padding:32px 24px;text-align:center;border-radius:20px;color:#fff;box-shadow:0 10px 30px rgba(16,185,129,0.3);border:1px solid rgba(255,255,255,0.2);}
.fw-success-icon{font-size:56px;margin-bottom:20px;text-shadow:0 2px 10px rgba(0,0,0,0.2);}
.fw-success-title{font-size:20px;font-weight:700;margin-bottom:12px;text-shadow:0 2px 8px rgba(0,0,0,0.1);}
.fw-success-order{background:rgba(255,255,255,0.15);padding:12px 20px;border-radius:12px;margin:16px 0;font-weight:600;font-size:16px;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);}
.fw-success-text{font-size:14px;opacity:0.9;line-height:1.5;}
.fw-agent-match{display:flex;align-items:center;gap:10px;background:rgba(16,185,129,0.08);border:2px solid ${CONFIG.SUCCESS_COLOR};border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#065f46;}
.fw-agent-match strong{color:#065f46;}
.fw-guest-note{font-size:12px;color:#64748b;text-align:center;margin:4px 0 16px;line-height:1.5;}
.fw-cart-item{display:flex;align-items:center;gap:12px;background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:10px;}
.fw-cart-item-info{flex:1;}
.fw-cart-item-name{font-weight:600;font-size:13px;color:#1e293b;}
.fw-cart-item-meta{font-size:12px;color:#64748b;margin-top:2px;}
.fw-cart-item-price{font-weight:700;color:${CONFIG.PRIMARY_COLOR};font-size:14px;white-space:nowrap;}
.fw-cart-remove{background:none;border:none;color:${CONFIG.ERROR_COLOR};cursor:pointer;font-size:16px;padding:6px;}
.fw-cooking-option{display:flex;justify-content:space-between;align-items:center;padding:12px;border:2px solid #e2e8f0;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:all 0.2s ease;}
.fw-cooking-option.selected{border-color:${CONFIG.PRIMARY_COLOR};background:rgba(27,181,166,0.05);}
.fw-cooking-option-fee{font-size:12px;color:#64748b;}
.fw-empty-cart{text-align:center;color:#64748b;padding:30px 10px;font-size:14px;}
@media (max-width: 420px) {
  .fw-root{right:10px;bottom:10px;}
  .fw-btn{right:10px;bottom:10px;}
  .fw-panel{right:10px;bottom:10px;width:calc(100vw - 20px);height:calc(100vh - 20px);max-width:380px;max-height:640px;}
}
`;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // -------------- STATE --------------
  function freshState() {
    return {
      step: "details",
      customer: {
        name: "",
        phone: "",
        type: "individual",
        isGuest: false,
        matchedOrganisationId: null,
        matchedOrganisationName: null,
      },
      // Item currently being configured, before it's pushed into cart.
      selection: {
        warehouse: null,
        productType: null,
        product: null,
        quantity: 1,
        cookingMethod: "none",
      },
      cart: [], // { key, warehouse, productType, product, quantity, cookingMethod }
      delivery: {
        type: "collection", // walk-in default per requirement 4
        address: "",
        building: "",
        landmark: "",
        notes: "",
        date: todayStr(),
        time: "late_morning",
      },
      order: null,
      paymentPhone: "",
    };
  }

  let S = freshState();
  let lookupTimer = null;

  // -------------- CART HELPERS --------------
  function cookingFee(methodId) {
    const m = CONFIG.COOKING_METHODS.find((x) => x.id === methodId);
    return m ? m.fee : 0;
  }

  function cookingLabel(methodId) {
    const m = CONFIG.COOKING_METHODS.find((x) => x.id === methodId);
    return m ? m.label : "No preparation";
  }

  function supportsCookingMethod(productTypeName) {
    const name = (productTypeName || "").toLowerCase();
    return CONFIG.COOKING_METHOD_TYPE_MATCHES.some((m) => name.includes(m));
  }

  function cartItemLineTotal(item) {
    const unit = item.product.discounted_price + cookingFee(item.cookingMethod);
    return unit * item.quantity;
  }

  function cartSubtotal() {
    return S.cart.reduce((sum, item) => sum + cartItemLineTotal(item), 0);
  }

  // Same product can appear as several cart lines (one per cooking
  // method). Stock checks need the sum across all of them.
  function cartQuantityForProduct(productId) {
    return S.cart
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function deliveryFeeFor(subtotal) {
    if (S.delivery.type === "collection") return 0;
    return subtotal >= CONFIG.FREE_DELIVERY_THRESHOLD ? 0 : 400;
  }

  function cartTotal() {
    const subtotal = cartSubtotal();
    return subtotal + deliveryFeeFor(subtotal);
  }

  // -------------- ICONS/IMAGES HELPERS --------------
  function getTypeIcon(typeName) {
    const name = typeName.toLowerCase();
    if (name.includes("tilapia")) return icons.tilapia;
    if (name.includes("nile perch")) return icons.nileperch;
    if (name.includes("chicken")) return icons.chicken;
    if (name.includes("bulk")) return icons.bulk;
    if (name.includes("others")) return icons.others;
    if (name.includes("fish")) return icons.fish;
    if (name.includes("meat") || name.includes("beef")) return icons.meat;
    if (name.includes("vegetable")) return icons.vegetables;
    if (name.includes("fruit")) return icons.fruits;
    if (name.includes("dairy") || name.includes("milk")) return icons.dairy;
    if (name.includes("grain") || name.includes("rice")) return icons.grains;
    if (name.includes("spice")) return icons.spices;
    return icons.fish;
  }

  function getFallbackImage(typeName) {
    const name = typeName.toLowerCase();
    if (name.includes("tilapia"))
      return "https://api.beta.markiti.laheri.co.ke/upload/52c70178-f863-11ed-aba4-b526e0ab41d1-Tilapia-001_copy.jpg";
    if (name.includes("nile perch"))
      return "https://api.beta.markiti.laheri.co.ke/upload/e3fd1e14-f865-11ed-aba4-b526e0ab41d1-Nile_perch_Whole.jpg";
    if (name.includes("chicken"))
      return "https://api.beta.markiti.laheri.co.ke/upload/69919d72-f864-11ed-aba4-b526e0ab41d1-Chicken-001.jpg";
    if (name.includes("bulk"))
      return "https://api.beta.markiti.laheri.co.ke/upload/bb41d628-4bed-11ee-b6c9-6ff270ceea6b-20230307_105843.jpg";
    if (name.includes("others"))
      return "https://portal.markiti.laheri.co.ke/static/media/omena.535e93d6.jpeg";
    return "https://api.beta.markiti.laheri.co.ke/upload/52c70178-f863-11ed-aba4-b526e0ab41d1-Tilapia-001_copy.jpg";
  }

  // -------------- RENDER: DETAILS (with optional guest + safe lookup) --------------
  function renderCustomerDetails() {
    body.innerHTML = "";
    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, icons.user, " Your Details (optional)"));
    {
      const radioGroup = el("div", { class: "fw-radio-group" });
      const businessRadio = el(
        "div",
        { class: "fw-radio" + (S.customer.type === "business" ? " selected" : "") },
        icons.business,
        " Business",
      );
      businessRadio.onclick = () => {
        S.customer.type = "business";
        renderCustomerDetails();
      };
      const individualRadio = el(
        "div",
        { class: "fw-radio" + (S.customer.type === "individual" ? " selected" : "") },
        icons.user,
        " Individual",
      );
      individualRadio.onclick = () => {
        S.customer.type = "individual";
        renderCustomerDetails();
      };
      radioGroup.appendChild(businessRadio);
      radioGroup.appendChild(individualRadio);
      section.appendChild(radioGroup);

      const phoneInput = el("input", {
        class: "fw-input",
        id: "customerPhone",
        placeholder:
          (S.customer.type === "business" ? "Business Contact Number" : "Phone Number") +
          " (07XX XXX XXX) — optional",
        value: S.customer.phone,
      });
      // Debounced, exact-match-only lookup. Never fires on partial input,
      // and never renders a list — only a single yes/no confirmation.
      phoneInput.addEventListener("input", (e) => {
        S.customer.phone = e.target.value;
        clearTimeout(lookupTimer);
        if (!isCompletePhone(e.target.value)) return;
        lookupTimer = setTimeout(() => lookupAgentByPhone(e.target.value), 400);
      });

      const nameInput = el("input", {
        class: "fw-input",
        id: "customerName",
        placeholder: (S.customer.type === "business" ? "Business Name" : "Full Name") + " — optional",
        value: S.customer.name,
      });
      nameInput.addEventListener("input", (e) => {
        S.customer.name = e.target.value;
      });

      section.appendChild(nameInput);
      section.appendChild(phoneInput);
      section.appendChild(
        el(
          "div",
          { class: "fw-guest-note" },
          "Prefer not to share this? You can continue without it — a phone number just lets us text you order updates.",
        ),
      );
    }
    body.appendChild(section);
    foot.innerHTML = "";
    const continueBtn = el("button", { class: "fw-btn2 main" }, icons.next, " Continue");
    continueBtn.onclick = nextStep;
    foot.appendChild(continueBtn);
  }

  async function lookupAgentByPhone(rawPhone) {
    const normalized = normalizePhone(rawPhone);
    try {
      const resp = await api(CONFIG.ENDPOINTS.agentLookup + "?phone=" + encodeURIComponent(normalized));
      if (resp && resp.found && resp.organisation) {
        S.customer.matchedOrganisationId = resp.organisation.id;
        S.customer.matchedOrganisationName = resp.organisation.name;
        S.customer.name = resp.organisation.name;
        S.customer.phone = rawPhone;
        // Existing customer — skip any confirmation and go straight
        // into the ordering flow. The backend is told the matched
        // agent_id later so it reuses this record instead of creating
        // a new one.
        if (S.step === "details") {
          S.step = "warehouses";
          render();
        }
      }
      // No match: say and show nothing. Never list alternatives.
    } catch (e) {
      // Silently ignore — lookup is a convenience, not a requirement.
      console.warn("Agent lookup skipped:", e.message);
    }
  }

  // -------------- RENDER: WAREHOUSES / TYPES / PRODUCTS --------------
  async function renderWarehouses() {
    body.innerHTML = '<div style="text-align: center; color: #64748b">Loading warehouses...</div>';
    try {
      const resp = await api(CONFIG.ENDPOINTS.warehouses);
      const warehouses = resp.returned_resultset || resp;
      body.innerHTML = "";
      const section = el("div", { class: "fw-section" });
      section.appendChild(el("div", { class: "fw-section-title" }, icons.warehouse, " Select Warehouse/Branch"));
      const grid = el("div", { class: "fw-grid" });
      warehouses.forEach((wh) => {
        const card = el("div", {
          class: "fw-card" + (S.selection.warehouse?.id === wh.id ? " selected" : ""),
        });
        card.appendChild(el("div", { class: "fw-card-icon" }, icons.warehouse));
        card.appendChild(el("div", { class: "fw-card-title" }, wh.name));
        card.appendChild(el("div", { class: "fw-card-desc" }, "Fresh products available"));
        card.onclick = () => {
          S.selection.warehouse = wh;
          S.step = "productType";
          render();
        };
        grid.appendChild(card);
      });
      section.appendChild(grid);
      body.appendChild(section);
      foot.innerHTML = "";
      const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
      backBtn.onclick = backStep;
      foot.appendChild(backBtn);
    } catch (e) {
      body.innerHTML = '<div style="text-align: center; color: #ef4444">Error loading warehouses</div>';
    }
  }

  async function renderProductTypes() {
    body.innerHTML = '<div style="text-align: center; color: #64748b">Loading product types...</div>';
    try {
      const resp = await api(CONFIG.ENDPOINTS.types);
      const allTypes = resp.returned_resultset || [];
      const types = allTypes.filter((t) => t.name.toLowerCase() !== "delivery fee");
      body.innerHTML = "";
      const section = el("div", { class: "fw-section" });
      section.appendChild(el("div", { class: "fw-section-title" }, icons.fish, " Select Product Type"));
      const grid = el("div", { class: "fw-grid" });
      types.forEach((type) => {
        const card = el("div", {
          class: "fw-card" + (S.selection.productType?.id === type.id ? " selected" : ""),
        });
        card.appendChild(el("div", { class: "fw-card-icon" }, getTypeIcon(type.name)));
        card.appendChild(el("div", { class: "fw-card-title" }, type.name));
        card.appendChild(el("div", { class: "fw-card-desc" }, "Fresh " + type.name.toLowerCase() + " products"));
        card.onclick = () => {
          S.selection.productType = type;
          S.step = "products";
          render();
        };
        grid.appendChild(card);
      });
      section.appendChild(grid);
      body.appendChild(section);
      foot.innerHTML = "";
      const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
      backBtn.onclick = backStep;
      foot.appendChild(backBtn);
    } catch (e) {
      body.innerHTML = '<div style="text-align: center; color: #ef4444">Error loading product types</div>';
    }
  }

  async function renderProducts() {
    body.innerHTML = '<div style="text-align: center; color: #64748b">Loading products...</div>';
    try {
      const qs = `?warehouse_id=${S.selection.warehouse.id}&product_type_id=${S.selection.productType.id}`;
      const resp = await api(CONFIG.ENDPOINTS.products + qs);
      const products = resp.returned_resultset || [];
      body.innerHTML = "";
      if (!products.length) {
        body.appendChild(el("div", { style: { textAlign: "center", color: "#64748b" } }, "No products available"));
        foot.innerHTML = "";
        const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
        backBtn.onclick = backStep;
        foot.appendChild(backBtn);
        return;
      }
      const section = el("div", { class: "fw-section" });
      section.appendChild(el("div", { class: "fw-section-title" }, icons.fish, " Select Product"));
      const grid = el("div", {
        class: "fw-grid",
        style: { gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" },
      });
      products.forEach((product) => {
        const isOutOfStock = product.quantity_available_for_sale <= 0;
        const card = el("div", {
          class:
            "fw-product-card" +
            (isOutOfStock ? " out-of-stock" : S.selection.product?.id === product.id ? " selected" : ""),
        });
        const productImage =
          product.product_images && product.product_images.length > 0
            ? product.product_images[0].url
            : null;
        const img = el("img", {
          class: "fw-product-image",
          src: productImage || getFallbackImage(S.selection.productType.name),
          alt: product.display_name || product.name,
        });
        img.onerror = function () {
          const iconDiv = el(
            "div",
            {
              class: "fw-product-image",
              style: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", backgroundColor: "#f8fafc" },
            },
            getTypeIcon(S.selection.productType.name),
          );
          this.parentNode.replaceChild(iconDiv, this);
        };
        card.appendChild(img);
        const info = el("div", { class: "fw-product-info" });
        info.appendChild(el("div", { class: "fw-product-name" }, product.display_name || product.name));
        info.appendChild(el("div", { class: "fw-product-price" }, "KSh " + product.discounted_price));
        if (isOutOfStock) info.appendChild(el("div", { class: "fw-product-status" }, "Out of Stock (OOS)"));
        card.appendChild(info);
        if (product.description) {
          const desc = el("div", { class: "fw-product-desc" });
          desc.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "8px" } }, "Description"));
          desc.appendChild(el("div", {}, product.description));
          card.appendChild(desc);
        }
        if (!isOutOfStock) {
          card.onclick = () => {
            S.selection.product = product;
            S.selection.quantity = 1;
            S.selection.cookingMethod = "none";
            // One quantity per cooking method, so e.g. 3 tilapia can be
            // split 1 fresh / 1 deep fried / 1 grilled in a single pass.
            S.selection.methodQuantities = {};
            CONFIG.COOKING_METHODS.forEach((m) => {
              S.selection.methodQuantities[m.id] = 0;
            });
            S.step = "quantity";
            render();
          };
        }
        grid.appendChild(card);
      });
      section.appendChild(grid);
      body.appendChild(section);
      foot.innerHTML = "";
      const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
      backBtn.onclick = backStep;
      foot.appendChild(backBtn);
    } catch (e) {
      body.innerHTML = '<div style="text-align: center; color: #ef4444">Error loading products</div>';
    }
  }

  // -------------- RENDER: QUANTITY + COOKING METHOD --------------
  function renderQuantity() {
    body.innerHTML = "";
    const sel = S.selection;
    const alreadyInCart = cartQuantityForProduct(sel.product.id);
    const remainingStock = Math.max(0, sel.product.quantity_available_for_sale - alreadyInCart);
    const cooks = supportsCookingMethod(sel.product.name);

    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, icons.cart, " Configure Item"));

    const productCard = el("div", { class: "fw-card", style: { marginBottom: "16px" } });
    productCard.appendChild(el("div", { class: "fw-card-title" }, sel.product.display_name || sel.product.name));
    productCard.appendChild(el("div", { class: "fw-card-desc" }, "KSh " + sel.product.discounted_price + " per unit"));
    if (alreadyInCart > 0) {
      productCard.appendChild(
        el("div", { class: "fw-card-desc" }, `${alreadyInCart} already in your cart · ${remainingStock} left available`),
      );
    }
    section.appendChild(productCard);

    const totalSelected = cooks
      ? CONFIG.COOKING_METHODS.reduce((sum, m) => sum + (sel.methodQuantities[m.id] || 0), 0)
      : sel.quantity;

    if (cooks) {
      // Split quantity per preparation — e.g. of 3 tilapia, 1 fresh,
      // 1 deep fried, 1 grilled — all in this one step.
      section.appendChild(
        el(
          "div",
          { class: "fw-section-title", style: { marginTop: "8px", fontSize: "14px" } },
          "How would you like each one prepared?",
        ),
      );
      CONFIG.COOKING_METHODS.forEach((m) => {
        const qty = sel.methodQuantities[m.id] || 0;
        const row = el("div", { class: "fw-cooking-option" + (qty > 0 ? " selected" : "") });
        const labelCol = el("div", {});
        labelCol.appendChild(el("div", {}, m.label));
        labelCol.appendChild(
          el(
            "div",
            { class: "fw-cooking-option-fee" },
            m.fee > 0
              ? `KSh ${sel.product.discounted_price + m.fee}/unit (+${m.fee} prep fee)`
              : `KSh ${sel.product.discounted_price}/unit`,
          ),
        );
        row.appendChild(labelCol);

        const stepper = el("div", { class: "fw-quantity-controls", style: { margin: "0" } });
        const minus = el("button", { class: "fw-quantity-btn" });
        minus.innerHTML = icons.minus;
        minus.onclick = () => {
          sel.methodQuantities[m.id] = Math.max(0, qty - 1);
          renderQuantity();
        };
        if (qty <= 0) minus.disabled = true;

        const display = el("div", { class: "fw-quantity-display" }, qty.toString());

        const plus = el("button", { class: "fw-quantity-btn" });
        plus.innerHTML = icons.plus;
        plus.onclick = () => {
          if (totalSelected < remainingStock) {
            sel.methodQuantities[m.id] = qty + 1;
            renderQuantity();
          } else toast("Cannot exceed available stock", "warning");
        };
        if (totalSelected >= remainingStock) plus.disabled = true;

        stepper.appendChild(minus);
        stepper.appendChild(display);
        stepper.appendChild(plus);
        row.appendChild(stepper);
        section.appendChild(row);
      });
    } else {
      const quantityControls = el("div", { class: "fw-quantity-controls" });
      const minusBtn = el("button", { class: "fw-quantity-btn" });
      minusBtn.innerHTML = icons.minus;
      minusBtn.onclick = () => {
        if (sel.quantity > 1) {
          sel.quantity--;
          renderQuantity();
        }
      };
      if (sel.quantity <= 1) minusBtn.disabled = true;

      const quantityDisplay = el("div", { class: "fw-quantity-display" }, sel.quantity.toString());

      const plusBtn = el("button", { class: "fw-quantity-btn" });
      plusBtn.innerHTML = icons.plus;
      plusBtn.onclick = () => {
        if (sel.quantity < remainingStock) {
          sel.quantity++;
          renderQuantity();
        } else toast("Cannot exceed available stock", "warning");
      };
      if (sel.quantity >= remainingStock) plusBtn.disabled = true;

      quantityControls.appendChild(minusBtn);
      quantityControls.appendChild(quantityDisplay);
      quantityControls.appendChild(plusBtn);
      section.appendChild(quantityControls);
    }

    // Clear, itemized cost breakdown — one line per prep method in use,
    // plus a running total, so the math is never a mystery.
    const priceSection = el("div", { class: "fw-checkout-summary" });
    priceSection.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "10px" } }, "Cost for this item"));
    let lineTotal = 0;
    if (cooks) {
      CONFIG.COOKING_METHODS.forEach((m) => {
        const qty = sel.methodQuantities[m.id] || 0;
        if (qty <= 0) return;
        const unit = sel.product.discounted_price + m.fee;
        const rowTotal = unit * qty;
        lineTotal += rowTotal;
        priceSection.appendChild(
          el(
            "div",
            { class: "fw-summary-item" },
            el("span", {}, `${qty} × ${m.label} (KSh ${unit})`),
            el("span", {}, "KSh " + rowTotal),
          ),
        );
      });
      if (lineTotal === 0) {
        priceSection.appendChild(
          el("div", { class: "fw-summary-item" }, el("span", { style: { color: "#94a3b8" } }, "Choose a quantity above")),
        );
      }
    } else {
      lineTotal = sel.product.discounted_price * sel.quantity;
      priceSection.appendChild(
        el(
          "div",
          { class: "fw-summary-item" },
          el("span", {}, `${sel.quantity} × KSh ${sel.product.discounted_price}`),
          el("span", {}, "KSh " + lineTotal),
        ),
      );
    }
    priceSection.appendChild(
      el("div", { class: "fw-summary-item fw-summary-total" }, el("span", {}, "Item total"), el("span", {}, "KSh " + lineTotal)),
    );
    section.appendChild(priceSection);
    body.appendChild(section);

    foot.innerHTML = "";
    const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
    backBtn.onclick = backStep;
    foot.appendChild(backBtn);
    const addBtn = el("button", { class: "fw-btn2 main" }, icons.cart, " Add to Cart");
    addBtn.onclick = () => {
      if (totalSelected <= 0) return toast("Choose at least one unit first", "warning");
      if (cooks) {
        // One cart line per prep method actually used.
        CONFIG.COOKING_METHODS.forEach((m) => {
          const qty = sel.methodQuantities[m.id] || 0;
          if (qty <= 0) return;
          S.cart.push({
            key: `${sel.product.id}-${m.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            warehouse: sel.warehouse,
            productType: sel.productType,
            product: sel.product,
            quantity: qty,
            cookingMethod: m.id,
          });
        });
      } else {
        S.cart.push({
          key: `${sel.product.id}-none-${Date.now()}`,
          warehouse: sel.warehouse,
          productType: sel.productType,
          product: sel.product,
          quantity: sel.quantity,
          cookingMethod: "none",
        });
      }
      toast("Added to cart", "success");
      S.step = "cart";
      render();
    };
    foot.appendChild(addBtn);
  }

  // -------------- RENDER: CART --------------
  function renderCart() {
    body.innerHTML = "";
    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, icons.cart, ` Your Cart (${S.cart.length})`));

    if (!S.cart.length) {
      section.appendChild(el("div", { class: "fw-empty-cart" }, "Your cart is empty. Add a product to get started."));
    } else {
      S.cart.forEach((item, idx) => {
        const row = el("div", { class: "fw-cart-item" });
        const info = el("div", { class: "fw-cart-item-info" });
        info.appendChild(el("div", { class: "fw-cart-item-name" }, item.product.display_name || item.product.name));
        const metaParts = [`x${item.quantity}`];
        if (item.cookingMethod !== "none") metaParts.push(cookingLabel(item.cookingMethod));
        info.appendChild(el("div", { class: "fw-cart-item-meta" }, metaParts.join(" · ")));
        row.appendChild(info);
        row.appendChild(el("div", { class: "fw-cart-item-price" }, "KSh " + cartItemLineTotal(item)));
        const removeBtn = el("button", { class: "fw-cart-remove" }, icons.trash);
        removeBtn.onclick = () => {
          S.cart.splice(idx, 1);
          renderCart();
        };
        row.appendChild(removeBtn);
        section.appendChild(row);
      });
      const subtotal = cartSubtotal();
      const summary = el("div", { class: "fw-checkout-summary" });
      summary.appendChild(
        el("div", { class: "fw-summary-item fw-summary-total" }, el("span", {}, "Subtotal"), el("span", {}, "KSh " + subtotal)),
      );
      section.appendChild(summary);
    }
    body.appendChild(section);

    foot.innerHTML = "";
    const addMoreBtn = el("button", { class: "fw-btn2 ghost" }, icons.plus, " Add Another Item");
    addMoreBtn.onclick = () => {
      S.step = "productType";
      render();
    };
    foot.appendChild(addMoreBtn);
    if (S.cart.length) {
      const checkoutBtn = el("button", { class: "fw-btn2 main" }, icons.next, " Checkout");
      checkoutBtn.onclick = () => {
        S.step = "checkout";
        render();
      };
      foot.appendChild(checkoutBtn);
    }
  }

  // -------------- RENDER: CHECKOUT --------------
  function renderCheckout() {
    body.innerHTML = "";
    const subtotal = cartSubtotal();
    const deliveryFee = deliveryFeeFor(subtotal);
    const total = subtotal + deliveryFee;
    const isCollection = S.delivery.type === "collection";

    const summary = el("div", { class: "fw-checkout-summary" });
    summary.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "12px" } }, "Order Summary"));
    S.cart.forEach((item) => {
      const metaParts = [`x${item.quantity}`];
      if (item.cookingMethod !== "none") metaParts.push(cookingLabel(item.cookingMethod));
      summary.appendChild(
        el(
          "div",
          { class: "fw-summary-item" },
          el("span", {}, `${item.product.display_name || item.product.name} (${metaParts.join(", ")})`),
          el("span", {}, "KSh " + cartItemLineTotal(item)),
        ),
      );
    });
    const deliveryRow = el("div", { class: "fw-summary-item" });
    deliveryRow.appendChild(el("span", {}, "Delivery Fee"));
    if (isCollection) {
      deliveryRow.appendChild(el("span", { class: "fw-no-delivery-badge" }, "PICKUP — FREE"));
    } else if (deliveryFee === 0) {
      deliveryRow.appendChild(el("span", { class: "fw-free-delivery-badge" }, "FREE"));
    } else {
      deliveryRow.appendChild(el("span", {}, "KSh " + deliveryFee));
    }
    summary.appendChild(deliveryRow);
    summary.appendChild(
      el("div", { class: "fw-summary-item fw-summary-total" }, el("span", {}, "Total"), el("span", {}, "KSh " + total)),
    );
    body.appendChild(summary);

    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, "Delivery Option"));

    const collectionGroup = el("div", { class: "fw-checkbox-group" + (isCollection ? " selected" : "") });
    const checkbox = el("div", { class: "fw-checkbox" + (isCollection ? " checked" : "") });
    if (isCollection) checkbox.innerHTML = icons.check;
    const checkboxLabel = el("div", { class: "fw-checkbox-label" });
    checkboxLabel.innerHTML = icons.pickup + " Self Collection";
    collectionGroup.appendChild(checkbox);
    collectionGroup.appendChild(checkboxLabel);
    collectionGroup.onclick = () => {
      const newType = S.delivery.type === "collection" ? "delivery" : "collection";
      S.delivery.type = newType;
      // Requirement 4: switching to collection auto-fills today and drops
      // the delivery-only fields; switching back clears the pickup default.
      if (newType === "collection") {
        S.delivery.date = todayStr();
      } else if (S.delivery.date === todayStr()) {
        S.delivery.date = "";
      }
      renderCheckout();
    };
    section.appendChild(collectionGroup);

    section.appendChild(
      el("div", { class: "fw-section-title", style: { marginTop: "24px" } }, isCollection ? "" : "Delivery Information"),
    );

    if (!isCollection) {
      section.appendChild(el("input", { class: "fw-input", id: "address", placeholder: "Address *", value: S.delivery.address }));
      section.appendChild(el("input", { class: "fw-input", id: "building", placeholder: "Building *", value: S.delivery.building }));
    }
    // For collection we don't ask for address/building at all — it's
    // auto-filled from the chosen warehouse when the order is placed.

    const minDate = getMinDeliveryDate(isCollection);
    const dateInput = el("input", { class: "fw-input", id: "deliveryDate", type: "date", min: minDate, value: S.delivery.date });
    dateInput.addEventListener("change", function (e) {
      if (!isValidDeliveryDate(e.target.value, isCollection)) {
        const selectedDate = new Date(e.target.value);
        if (selectedDate.getDay() === 0) {
          toast("Sunday deliveries/pickups are not available. Please select another date.", "warning");
        } else {
          toast("Please select a valid date.", "warning");
        }
        e.target.value = "";
        S.delivery.date = "";
      } else {
        S.delivery.date = e.target.value;
      }
    });
    section.appendChild(el("div", { class: "fw-label" }, (isCollection ? "Collection" : "Delivery") + " Date *"));
    section.appendChild(dateInput);

    if (!isCollection) {
      const dateWarning = el("div", { class: "fw-date-warning" });
      dateWarning.innerHTML = "⚠️ Same-day orders and Sunday deliveries are not available.";
      section.appendChild(dateWarning);

      const timeOptions = el("div", { class: "fw-form-group" });
      timeOptions.appendChild(el("div", { class: "fw-label" }, "Preferred delivery time"));
      const timeRadio = el("div", { class: "fw-radio-group" });
      [
        ["morning", "Morning"],
        ["late_morning", "Late Morning"],
        ["afternoon", "Afternoon"],
      ].forEach(([id, label]) => {
        const r = el("div", { class: "fw-radio" + (S.delivery.time === id ? " selected" : "") }, label);
        r.onclick = () => {
          S.delivery.time = id;
          renderCheckout();
        };
        timeRadio.appendChild(r);
      });
      timeOptions.appendChild(timeRadio);
      section.appendChild(timeOptions);
    } else {
      section.appendChild(
        el(
          "div",
          { class: "fw-guest-note", style: { textAlign: "left" } },
          icons.pickup +
            " Pickup defaults to today at " +
            (S.selection.warehouse?.name || "the selected warehouse") +
            ". Change the date above if you'd rather collect later.",
        ),
      );
    }

    section.appendChild(
      el("textarea", {
        class: "fw-input",
        id: "notes",
        placeholder: "Notes - Enter any instructions for your order",
        style: { minHeight: "80px", resize: "vertical" },
        value: S.delivery.notes,
      }),
    );

    body.appendChild(section);
    foot.innerHTML = "";
    const backBtn = el("button", { class: "fw-btn2 ghost" }, icons.back, " Back");
    backBtn.onclick = backStep;
    foot.appendChild(backBtn);
    const orderBtn = el("button", { class: "fw-btn2 main" }, icons.check, " Complete Order");
    orderBtn.onclick = placeOrder;
    foot.appendChild(orderBtn);
  }

  // -------------- RENDER: SUCCESS / PAYMENT / COMPLETE --------------
  function renderSuccess() {
    body.innerHTML = "";
    const success = el("div", { class: "fw-success" });
    success.appendChild(el("div", { class: "fw-success-icon" }, "🎉"));
    success.appendChild(el("div", { class: "fw-success-title" }, "Order placed successfully!"));
    success.appendChild(el("div", { class: "fw-success-order" }, "Order Number: " + S.order.order_number));
    body.appendChild(success);
    foot.innerHTML = "";
    const continueBtn = el("button", { class: "fw-btn2 main" }, "Continue to Payment");
    continueBtn.onclick = () => {
      S.step = "payment";
      render();
    };
    foot.appendChild(continueBtn);
  }

  function renderPayment() {
    body.innerHTML = "";
    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, "💳 Complete Payment"));
    const subtotal = cartSubtotal();
    const deliveryFee = deliveryFeeFor(subtotal);
    const total = subtotal + deliveryFee;
    const orderInfo = el("div", { class: "fw-checkout-summary" });
    orderInfo.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "8px" } }, "Order: " + S.order.order_number));
    orderInfo.appendChild(el("div", { class: "fw-summary-item" }, el("span", {}, "Items"), el("span", {}, "KSh " + subtotal)));
    orderInfo.appendChild(el("div", { class: "fw-summary-item" }, el("span", {}, "Delivery Fee"), el("span", {}, "KSh " + deliveryFee)));
    orderInfo.appendChild(
      el("div", { class: "fw-summary-item fw-summary-total" }, el("span", {}, "Total"), el("span", {}, "KSh " + total)),
    );
    section.appendChild(orderInfo);
    section.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "8px" } }, "Phone number for M-PESA payment:"));
    let phonePrefill = S.paymentPhone || "";
    if (!phonePrefill && S.customer.phone)
      phonePrefill = normalizePhone(S.customer.phone) ? "+" + normalizePhone(S.customer.phone) : S.customer.phone;
    section.appendChild(el("input", { class: "fw-input", id: "paymentPhone", placeholder: "+2547XX XXX XXX", value: phonePrefill }));
    body.appendChild(section);

    foot.innerHTML = "";
    const payNowBtn = el("button", { class: "fw-btn2 main" }, "💳 Pay Now");
    payNowBtn.onclick = payNow;
    foot.appendChild(payNowBtn);
    const payLaterBtn = el(
      "button",
      { class: "fw-btn2 ghost" },
      "📦 Pay on " + (S.delivery.type === "collection" ? "Collection" : "Delivery"),
    );
    payLaterBtn.onclick = payOnDelivery;
    foot.appendChild(payLaterBtn);
  }

  function renderPaymentInstructions() {
    body.innerHTML = "";
    const section = el("div", { class: "fw-section" });
    section.appendChild(el("div", { class: "fw-section-title" }, "📱 Payment Instructions"));
    const instructions = el("div", { class: "fw-card", style: { padding: "20px" } });
    instructions.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "12px" } }, "Pay directly to our M-PESA paybill"));
    const steps = el("div", { style: { marginTop: "16px" } });
    steps.appendChild(el("div", { style: { margin: "8px 0" } }, "1. Select 'Pay Bill' from your M-PESA"));
    const bizStep = el("div", { style: { margin: "8px 0" } });
    bizStep.appendChild(document.createTextNode("2. Enter Business Number: "));
    bizStep.appendChild(el("strong", {}, CONFIG.PAYBILL_NUMBER));
    steps.appendChild(bizStep);
    const acctStep = el("div", { style: { margin: "8px 0" } });
    acctStep.appendChild(document.createTextNode("3. Enter Account Number: "));
    acctStep.appendChild(el("strong", {}, S.order.order_number));
    steps.appendChild(acctStep);
    const amtStep = el("div", { style: { margin: "8px 0" } });
    amtStep.appendChild(document.createTextNode("4. Enter Amount: "));
    amtStep.appendChild(el("strong", {}, "KSh " + S.order.total_value));
    steps.appendChild(amtStep);
    instructions.appendChild(steps);
    section.appendChild(instructions);
    body.appendChild(section);

    foot.innerHTML = "";
    const confirmBtn = el("button", { class: "fw-btn2 main" }, "✓ Confirm Payment");
    confirmBtn.onclick = () => {
      S.step = "complete";
      render();
    };
    foot.appendChild(confirmBtn);
  }

  function renderComplete() {
    body.innerHTML = "";
    const success = el("div", { class: "fw-success" });
    success.appendChild(el("div", { class: "fw-success-icon" }, "🎉"));
    success.appendChild(el("div", { class: "fw-success-text" }, "Thank you for your order!"));
    body.appendChild(success);
    foot.innerHTML = "";
    const homeBtn = el("button", { class: "fw-btn2 main" }, icons.home, " Complete");
    homeBtn.onclick = () => {
      S = freshState();
      closePanel();
    };
    foot.appendChild(homeBtn);
  }

  // -------------- NAVIGATION --------------
  async function render() {
    switch (S.step) {
      case "details":
        renderCustomerDetails();
        break;
      case "warehouses":
        await renderWarehouses();
        break;
      case "productType":
        await renderProductTypes();
        break;
      case "products":
        await renderProducts();
        break;
      case "quantity":
        renderQuantity();
        break;
      case "cart":
        renderCart();
        break;
      case "checkout":
        renderCheckout();
        break;
      case "success":
        renderSuccess();
        break;
      case "payment":
        renderPayment();
        break;
      case "paymentInstructions":
        renderPaymentInstructions();
        break;
      case "complete":
        renderComplete();
        break;
    }
  }

  function nextStep() {
    if (S.step !== "details") return;
    const phone = ($("#customerPhone")?.value || S.customer.phone || "").trim();
    const name = ($("#customerName")?.value || S.customer.name || "").trim();
    if (phone && !(isCompletePhone(phone) || /^\+?254?7\d{8}$/.test(phone))) {
      return toast("That phone number doesn't look right — you can also leave it blank.", "error");
    }
    // Individuals need a first AND last name if they give one at all —
    // businesses can be a single name. Guests (blank) skip this.
    if (name && S.customer.type === "individual" && !S.customer.matchedOrganisationId && !isValidFullName(name)) {
      return toast("Please enter your first and last name, or leave it blank.", "error");
    }
    S.customer.phone = phone;
    S.customer.name = name;
    S.customer.isGuest = !phone && !name && !S.customer.matchedOrganisationId;
    S.step = "warehouses";
    render();
  }

  function backStep() {
    const flow = ["details", "warehouses", "productType", "products", "quantity", "cart", "checkout"];
    const current = flow.indexOf(S.step);
    if (current > 0) {
      S.step = flow[current - 1];
      render();
    }
  }

  async function placeOrder() {
    const isCollection = S.delivery.type === "collection";
    if (!isCollection) {
      S.delivery.address = $("#address")?.value.trim() || "";
      S.delivery.building = $("#building")?.value.trim() || "";
      if (!S.delivery.address || !S.delivery.building) {
        return toast("Address and building are required for delivery", "error");
      }
    } else {
      const wh = S.cart[0]?.warehouse;
      S.delivery.address = "Self Collection" + (wh ? " - " + wh.name : "");
      S.delivery.building = wh ? wh.name : "Self Collection";
    }
    S.delivery.date = $("#deliveryDate")?.value || S.delivery.date || "";
    S.delivery.notes = $("#notes")?.value.trim() || "";
    if (!S.delivery.date) {
      return toast((isCollection ? "Collection" : "Delivery") + " date is required", "error");
    }
    if (!isValidDeliveryDate(S.delivery.date, isCollection)) {
      return toast("Please select a valid date (no Sunday orders)", "error");
    }
    if (!S.cart.length) {
      return toast("Your cart is empty", "error");
    }
    try {
      const cartItems = S.cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        // NOTE: send whichever key your backend's cart_item_type expects —
        // this assumes the `cooking_method` string field (deep_fried /
        // grilled / none) from the storefront cart migration. If your
        // deployed schema is still on the legacy boolean, swap this for
        // `deep_fried: item.cookingMethod === 'deep_fried'` instead.
        cooking_method: item.cookingMethod,
      }));
      const orderData = {
        address: S.delivery.address,
        building: S.delivery.building,
        cart_items: cartItems,
        first_name: S.customer.name || undefined,
        notes: S.delivery.notes,
        notification_consent: false,
        phone_number: S.customer.phone || undefined,
        warehouse_id: S.cart[0].warehouse.id,
        self_collect: isCollection,
        order_source: "markiti_express",
        agent_id: S.customer.matchedOrganisationId || undefined,
      };
      if (!isCollection) {
        orderData.delivery_time = `${S.delivery.date}, ${
          S.delivery.time === "morning" ? "Morning" : S.delivery.time === "late_morning" ? "Late Morning" : "Afternoon"
        }`;
      }
      const response = await api(CONFIG.ENDPOINTS.placeOrder, { method: "POST", body: orderData });
      S.order = response.returned_resultset ? response.returned_resultset[0] : response;
      S.step = "success";
      render();
      toast("Order placed successfully!", "success");
    } catch (e) {
      console.error("Order placement error:", e);
      toast("Order failed: " + (e.message || "Unknown error"), "error");
    }
  }

  async function payNow() {
    const paymentPhoneRaw = $("#paymentPhone")?.value.trim();
    if (!paymentPhoneRaw) return toast("Please enter a valid phone number (+2547XX XXX XXX or 07XX XXX XXX)", "error");
    let normalizedPhone = paymentPhoneRaw;
    if (normalizedPhone.startsWith("07")) normalizedPhone = "+254" + normalizedPhone.substring(1);
    if (normalizedPhone.startsWith("7") && normalizedPhone.length === 9) normalizedPhone = "+254" + normalizedPhone;
    if (normalizedPhone.startsWith("+254+254")) normalizedPhone = normalizedPhone.replace("+254+254", "+254");
    if (!/^\+2547\d{8}$/.test(normalizedPhone)) {
      return toast("Please enter a valid phone number (+2547XX XXX XXX or 07XX XXX XXX)", "error");
    }
    S.paymentPhone = normalizedPhone;
    try {
      const stkEndpoint = CONFIG.ENDPOINTS.stkPush.replace("{orderId}", S.order.id);
      const subtotal = cartSubtotal();
      const deliveryFee = deliveryFeeFor(subtotal);
      const amountToCharge = subtotal + deliveryFee || parseInt(S.order.total_value);
      await api(stkEndpoint, { method: "POST", body: { phonenumber: S.paymentPhone, amount: parseInt(amountToCharge) } });
      toast("M-PESA payment initiated! Check your phone", "success");
      S.step = "complete";
      render();
    } catch (e) {
      console.error("STK Push error:", e);
      toast("Payment initiation failed: " + (e.message || "Unknown error"), "error");
    }
  }

  async function payOnDelivery() {
    try {
      await api(CONFIG.ENDPOINTS.placeOrder + "/" + S.order.id, { method: "PUT", body: { payment_mode: "ondelivery" } });
      S.step = "paymentInstructions";
      render();
      toast("Order confirmed for pay on " + (S.delivery.type === "collection" ? "collection" : "delivery"), "success");
    } catch (e) {
      console.error("Pay on delivery error:", e);
      S.step = "paymentInstructions";
      render();
      toast("Order confirmed - please see payment instructions", "info");
    }
  }

  // -------------- DOM CREATION --------------
  const root = el("div", { class: "fw-root" });
  const btn = el("button", { class: "fw-btn", title: "Open Markiti Express", "aria-label": "n ordering panel" });

  const btnLabel = el("span", { class: "fw-btn-label" }, "Order Now");

  const btnIcon = el("span", { class: "fw-btn-icon" });

  const btnLogo = el("img", {
    src: "images/KIC-BOT.png",
    alt: "KIC Bot"
  });

  btnIcon.appendChild(btnLogo);
  btn.appendChild(btnLabel);
  btn.appendChild(btnIcon);
  const panel = el("div", { class: "fw-panel" });
  const head = el("div", { class: "fw-head" });
  const logo = el("div", { class: "fw-logo" });
  logo.appendChild(el("img", { src: CONFIG.LOGO_URL, alt: "Markiti Logo" }));
  const titleGroup = el("div", { class: "fw-title-group" });
  titleGroup.appendChild(el("div", { class: "fw-title" }, CONFIG.TITLE));
  titleGroup.appendChild(el("div", { class: "fw-tag" }, CONFIG.TAGLINE));
  const closeBtn = el("button", { class: "fw-close" }, icons.close);
  head.appendChild(logo);
  head.appendChild(titleGroup);
  head.appendChild(closeBtn);

  const body = el("div", { class: "fw-body" }, "Loading...");
  const foot = el("div", { class: "fw-footer" });

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);
  root.appendChild(btn);
  root.appendChild(panel);
  document.body.appendChild(root);

  function openPanel() {
    panel.style.display = "flex";
    btn.style.display = "none";
    setTimeout(() => panel.classList.add("show"), 10);
    render();
  }

  function closePanel() {
    panel.classList.remove("show");
    setTimeout(() => {
      panel.style.display = "none";
      btn.style.display = "flex";
    }, 300);
  }

  btn.onclick = openPanel;
  closeBtn.onclick = closePanel;

  render();
})();