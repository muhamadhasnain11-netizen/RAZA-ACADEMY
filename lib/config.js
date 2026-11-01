export const BRAND = "Raza Theory & Driving Academy";
export const PHONE_DISPLAY = "07312 876242";
export const WHATSAPP = "447312876242";
export const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
export const BOOK_MSG = "Hi Raza Theory & Driving Academy, I\u2019d like to book a theory course.";
// Fill these in before launch: they appear on the privacy policy page.
export const CONTACT_EMAIL = "[add contact email]";
export const BUSINESS_ADDRESS = "[add business address]";
// Stripe Payment Links: create one for each course in the Stripe dashboard (Payments > Payment links) and paste the links here.
export const STRIPE_GROUP_LINK = "";
export const STRIPE_ONE_LINK = "";
export const payLinkFor = (type) => (/1-to-1/i.test(type) ? STRIPE_ONE_LINK : /group/i.test(type) ? STRIPE_GROUP_LINK : "");
