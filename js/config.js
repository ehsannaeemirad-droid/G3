export const APP_VERSION = 2;

export const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
export const faNum = (n) => String(n).replace(/\d/g, d => faDigits[+d]);
