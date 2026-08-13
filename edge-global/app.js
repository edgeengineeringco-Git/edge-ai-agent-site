/* EDGE Global Solutions — App */
let currentLang = localStorage.getItem('edge-lang') || 'en';
function t(key) {
    if (translations && translations[key] && translations[key][currentLang]) return translations[key][currentLang];
    if (translations && translations[key] && translations[key]['en']) return translations[key]['en'];
    return key;
}
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const translated = t(el.getAttribute('data-i18n'));
        if (translated) el.innerHTML = translated;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
}
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('edge-lang', lang);
    const isRTL = lang === 'ar' || lang === 'fa';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    applyTranslations();
    document.getElementById('navLinks').classList.remove('open');
}
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
});
function handleSubmit(e) {
    e.preventDefault();
    const msgs = {
        en:{t:'Inquiry Sent!',d:'AI agents will respond within 24 hours.'},
        fr:{t:'Demande Envoyée!',d:'Nos agents IA répondront dans les 24 heures.'},
        es:{t:'¡Consulta Enviada!',d:'Nuestros agentes IA responderán en 24 horas.'},
        ar:{t:'تم إرسال الاستفسار!',d:'سيرد وكلاء الذكاء الاصطناعي خلال 24 ساعة.'},
        tr:{t:'Sorgu Gönderildi!',d:'Yapay zeka ajanları 24 saat içinde yanıt verecek.'},
        fa:{t:'درخواست ارسال شد!',d:'عامل‌های هوش مصنوعی ظرف ۲۴ ساعت پاسخ می‌دهند.'}
    };
    const m = msgs[currentLang] || msgs.en;
    e.target.innerHTML = `<div class="form-success"><div class="success-icon">✅</div><h3>${m.t}</h3><p>${m.d}</p></div>`;
}
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });
document.addEventListener('DOMContentLoaded', () => {
    if (currentLang !== 'en') {
        const isRTL = currentLang === 'ar' || currentLang === 'fa';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLang;
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim() === currentLang.toUpperCase() ||
                (currentLang === 'ar' && btn.textContent.includes('عربي')) ||
                (currentLang === 'fa' && btn.textContent.includes('فارسی'))) btn.classList.add('active');
        });
    }
    applyTranslations();
    document.querySelectorAll('.service-card,.market-card,.advantage-item,.service-detail').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
