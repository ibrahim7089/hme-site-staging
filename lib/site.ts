export const site = {
  name: "HME",
  legalName: "Hasani Munawarah Exchange Sdn Bhd",
  brand: "HM eRemit",
  domain: "https://hmeremit.com.my",
  phone: "+604 421 3811",
  klPhone: "+603 4131 9639",
  whatsapp: "https://wa.me/60444213811",
  email: "info@hmeremit.com.my",
  hqAddress1: "No. 25C, Bangunan Ban Bee, Jalan Kampung Baru",
  hqAddress2: "08000 Sungai Petani, Kedah",
  licenceLine:
    "Licensed Money Services Business regulated in Malaysia under the Money Services Business Act 2011.",
  regNo: "1428497-M",
  msbNo: "202101028197",
  social: {
    facebook: "https://www.facebook.com/hmeremit",
    instagram: "https://www.instagram.com/hme_remit/",
    tiktok: "https://www.tiktok.com/@hmemoneychanger",
    linkedin: "https://www.linkedin.com/company/hasani-munawarah-exchange-sdn-bhd/",
  },
};

export const nav = [
  { label: "About Us", href: "/about" },
  {
    label: "Services", href: "/currency-exchange",
    children: [
      { label: "Foreign Currency Exchange", href: "/currency-exchange" },
      { label: "International Money Transfer", href: "/money-transfer" },
      { label: "Currency Booking", href: "/currency-booking" },
      { label: "Be Our Agent", href: "/be-our-agent" },
      { label: "Exchange Rates", href: "/rates" },
      { label: "Money Transfer Rates", href: "/money-transfer-rates" },
    ],
  },
  { label: "Branches", href: "/locate-us" },
  { label: "Corporate", href: "/corporate" },
  { label: "Careers", href: "/career" },
  {
    label: "Media", href: "/media/news",
    children: [
      { label: "News", href: "/media/news" },
      { label: "Blog", href: "/media/blog" },
    ],
  },
  { label: "Promotions", href: "/promotions" },
];

export const legalLinks = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/career" },
  { label: "Contact", href: "/contact" },
  { label: "Corporate Sustainability", href: "/compliance/corporate-sustainability" },
  { label: "FAQs", href: "/faq" },
  { label: "Fees & Charges", href: "/compliance/fees-charges" },
  { label: "Fraud Prevention", href: "/compliance/fraud-prevention" },
  { label: "Terms and Conditions", href: "/compliance/terms" },
  { label: "Privacy Policy", href: "/compliance/privacy-policy" },
  { label: "AML Policy", href: "/compliance/aml-policy" },
  { label: "Customer Charter", href: "/compliance/customer-charter" },
  { label: "Communication Channels", href: "/compliance/communication-channels" },
];

export const disclaimer =
  "Rates are indicative and subject to change. Please confirm final rates at the branch before transaction.";
