export const servicesSeedData = [
  // Government & Citizen Services
  { name: "Aadhaar Update Assistance", category: "Government & Citizen Services", price: 100, commission: 20, description: "Assistance with Aadhaar updates and corrections.", processing_time: "1-2 Days" },
  { name: "PAN New / Correction", category: "Government & Citizen Services", price: 200, commission: 50, description: "Apply for a new PAN card or correct existing details.", processing_time: "3-5 Days" },
  { name: "Passport Registration / Renewal", category: "Government & Citizen Services", price: 500, commission: 100, description: "Assistance with new passport application or renewal.", processing_time: "10-15 Days" },
  { name: "Voter ID Registration / Update", category: "Government & Citizen Services", price: 100, commission: 20, description: "Register for a new Voter ID or update details.", processing_time: "7-10 Days" },
  { name: "Driving License Support", category: "Government & Citizen Services", price: 300, commission: 80, description: "Assistance with driving license applications.", processing_time: "7-14 Days" },
  { name: "Birth / Death Certificates", category: "Government & Citizen Services", price: 150, commission: 40, description: "Apply for birth or death certificates.", processing_time: "5-7 Days" },
  { name: "Marriage Certificate", category: "Government & Citizen Services", price: 300, commission: 80, description: "Assistance with marriage certificate registration.", processing_time: "7-10 Days" },
  { name: "Caste, Domicile, Income Certificates", category: "Government & Citizen Services", price: 150, commission: 40, description: "Apply for caste, domicile, or income certificates.", processing_time: "5-7 Days" },
  { name: "Residential, Senior Citizen, Life Certificate", category: "Government & Citizen Services", price: 150, commission: 40, description: "Apply for residential, senior citizen, or life certificates.", processing_time: "5-7 Days" },
  { name: "Ration Card Services", category: "Government & Citizen Services", price: 100, commission: 25, description: "Apply for a new ration card or update details.", processing_time: "7-10 Days" },
  { name: "Online Rent Agreement", category: "Government & Citizen Services", price: 400, commission: 100, description: "Create and register an online rent agreement.", processing_time: "1-2 Days" },
  { name: "E-Shram Card", category: "Government & Citizen Services", price: 50, commission: 15, description: "Registration for E-Shram card.", processing_time: "Instant" },
  { name: "Ayushman Bharat Card", category: "Government & Citizen Services", price: 50, commission: 15, description: "Registration for Ayushman Bharat health card.", processing_time: "Instant" },

  // Banking & Finance
  { name: "AEPS Cash Withdrawal", category: "Banking & Finance", price: 0, commission: 10, description: "Aadhaar Enabled Payment System cash withdrawal.", processing_time: "Instant" },
  { name: "Money Transfer", category: "Banking & Finance", price: 10, commission: 5, description: "Domestic money transfer services.", processing_time: "Instant" },
  { name: "Mini ATM Services", category: "Banking & Finance", price: 0, commission: 10, description: "Cash withdrawal using debit cards.", processing_time: "Instant" },
  { name: "Insurance Enrollment (Life / Health / Motor)", category: "Banking & Finance", price: 500, commission: 150, description: "Enrollment for various insurance policies.", processing_time: "1-2 Days" },
  { name: "PMJJBY / PMSBY Assistance", category: "Banking & Finance", price: 50, commission: 10, description: "Assistance with PMJJBY and PMSBY schemes.", processing_time: "1-2 Days" },

  // Utilities
  { name: "Electricity / Water Bill Payment", category: "Utilities", price: 0, commission: 5, description: "Pay electricity and water bills.", processing_time: "Instant" },
  { name: "Gas Booking", category: "Utilities", price: 0, commission: 5, description: "Book LPG gas cylinders.", processing_time: "Instant" },
  { name: "Mobile & DTH Recharge", category: "Utilities", price: 0, commission: 2, description: "Recharge mobile phones and DTH connections.", processing_time: "Instant" },

  // Education & Rural Services
  { name: "Scholarships", category: "Education & Rural Services", price: 100, commission: 30, description: "Assistance with scholarship applications.", processing_time: "3-5 Days" },
  { name: "Exam Form Filling", category: "Education & Rural Services", price: 100, commission: 30, description: "Assistance with filling online exam forms.", processing_time: "1 Day" },
  { name: "Digital Literacy Assistance", category: "Education & Rural Services", price: 200, commission: 50, description: "Basic digital literacy training and assistance.", processing_time: "Ongoing" },
  { name: "Farmer Services", category: "Education & Rural Services", price: 100, commission: 25, description: "Assistance with various farmer schemes and services.", processing_time: "2-3 Days" },
  { name: "Land Record Assistance (State-Specific)", category: "Education & Rural Services", price: 150, commission: 40, description: "Access and print land records (Bhulekh/Khatauni).", processing_time: "Instant" },

  // Udyam & Business Compliance
  { name: "GEM Registration", category: "Udyam & Business Compliance", price: 1500, commission: 300, description: "Registration on Government e-Marketplace.", processing_time: "3-5 Days" },
  { name: "Startup India Registration", category: "Udyam & Business Compliance", price: 2500, commission: 500, description: "Registration under Startup India scheme.", processing_time: "7-10 Days" },
  { name: "PMEGP Application", category: "Udyam & Business Compliance", price: 1000, commission: 200, description: "Assistance with PMEGP loan application.", processing_time: "5-7 Days" },
  { name: "Mudra Loan Facilitation", category: "Udyam & Business Compliance", price: 1000, commission: 200, description: "Assistance with Mudra loan application.", processing_time: "5-7 Days" },
  { name: "Government Scheme Filings", category: "Udyam & Business Compliance", price: 500, commission: 100, description: "Filing applications for various government schemes.", processing_time: "3-5 Days" },
  { name: "Udyam Registration", category: "Udyam & Business Compliance", price: 300, commission: 100, description: "MSME Udyam registration.", processing_time: "1-2 Days" },
  { name: "Udyam KYC Update", category: "Udyam & Business Compliance", price: 200, commission: 50, description: "Update KYC details in Udyam portal.", processing_time: "1-2 Days" },
  { name: "MSME Subsidy Support", category: "Udyam & Business Compliance", price: 2000, commission: 400, description: "Assistance with claiming MSME subsidies.", processing_time: "15-30 Days" },
  { name: "FSSAI License & Renewal", category: "Udyam & Business Compliance", price: 1000, commission: 200, description: "Food safety license registration and renewal.", processing_time: "7-10 Days" },
  { name: "Shop & Establishment Registration", category: "Udyam & Business Compliance", price: 1500, commission: 300, description: "Registration under Shop & Establishment Act.", processing_time: "5-7 Days" },
  { name: "GST-linked MSME benefits", category: "Udyam & Business Compliance", price: 500, commission: 100, description: "Consultation and filing for GST-linked MSME benefits.", processing_time: "3-5 Days" },

  // Business Registrations
  { name: "LLP Formation", category: "Business Registrations", price: 5000, commission: 1000, description: "Incorporation of Limited Liability Partnership.", processing_time: "10-15 Days" },
  { name: "Pvt Ltd / Public Ltd Registration", category: "Business Registrations", price: 8000, commission: 1500, description: "Incorporation of Private or Public Limited Company.", processing_time: "10-15 Days" },
  { name: "OPC Registration", category: "Business Registrations", price: 6000, commission: 1200, description: "Incorporation of One Person Company.", processing_time: "10-15 Days" },
  { name: "Partnership Firm Registration", category: "Business Registrations", price: 3000, commission: 600, description: "Registration of Partnership Firm.", processing_time: "5-7 Days" },
  { name: "Section 8 Company", category: "Business Registrations", price: 10000, commission: 2000, description: "Incorporation of Section 8 (NGO) Company.", processing_time: "15-20 Days" },
  { name: "Trust / NGO Formation", category: "Business Registrations", price: 8000, commission: 1500, description: "Registration of Trust or Society.", processing_time: "15-20 Days" },
  { name: "TAN / DIN Application", category: "Business Registrations", price: 500, commission: 100, description: "Application for TAN or DIN.", processing_time: "3-5 Days" },
  { name: "DIR-3 KYC / INC-22 Filing", category: "Business Registrations", price: 1000, commission: 200, description: "Filing of DIR-3 KYC or INC-22 forms.", processing_time: "2-3 Days" },

  // Business Documentation
  { name: "CMA Report", category: "Business Documentation", price: 3000, commission: 600, description: "Preparation of Credit Monitoring Arrangement report.", processing_time: "3-5 Days" },
  { name: "Project Report Preparation", category: "Business Documentation", price: 5000, commission: 1000, description: "Preparation of detailed project reports for bank loans.", processing_time: "5-7 Days" },
  { name: "Net Worth Certificate", category: "Business Documentation", price: 1500, commission: 300, description: "Issuance of Net Worth Certificate by CA.", processing_time: "2-3 Days" },
  { name: "Business Profile Creation", category: "Business Documentation", price: 1000, commission: 200, description: "Professional business profile writing and design.", processing_time: "3-5 Days" },

  // GST Registration Services
  { name: "New GST Registration", category: "GST Registration Services", price: 1000, commission: 250, description: "Application for new GST registration.", processing_time: "3-7 Days" },
  { name: "Composition Scheme Enrollment", category: "GST Registration Services", price: 500, commission: 100, description: "Enrollment into GST Composition Scheme.", processing_time: "1-2 Days" },
  { name: "Migration from Composition to Regular", category: "GST Registration Services", price: 800, commission: 150, description: "Migration from Composition to Regular GST scheme.", processing_time: "2-3 Days" },
  { name: "GST Surrender / Cancellation", category: "GST Registration Services", price: 1000, commission: 200, description: "Cancellation or surrender of GST registration.", processing_time: "5-7 Days" },

  // GST Return Filing
  { name: "GSTR-1 Monthly / Quarterly", category: "GST Return Filing", price: 500, commission: 100, description: "Filing of GSTR-1 returns.", processing_time: "1-2 Days" },
  { name: "GSTR-3B Monthly Filing", category: "GST Return Filing", price: 500, commission: 100, description: "Filing of GSTR-3B returns.", processing_time: "1-2 Days" },
  { name: "GSTR-9 / GSTR-9A Annual Return", category: "GST Return Filing", price: 2000, commission: 400, description: "Filing of GST Annual Returns.", processing_time: "3-5 Days" },
  { name: "GST Reconciliation for Books & Portal", category: "GST Return Filing", price: 1500, commission: 300, description: "Reconciliation of GST data.", processing_time: "2-4 Days" },
  { name: "GSTR-2B Reconciliation Support", category: "GST Return Filing", price: 1000, commission: 200, description: "Support for GSTR-2B reconciliation.", processing_time: "2-3 Days" },

  // GST Compliance & Advisory
  { name: "GST Notice Reply", category: "GST Compliance & Advisory", price: 2000, commission: 400, description: "Drafting and filing replies to GST notices.", processing_time: "3-5 Days" },
  { name: "GST Audit Support", category: "GST Compliance & Advisory", price: 5000, commission: 1000, description: "Support and representation during GST audits.", processing_time: "7-10 Days" },
  { name: "GST Input Tax Credit Evaluation", category: "GST Compliance & Advisory", price: 1500, commission: 300, description: "Evaluation and optimization of ITC.", processing_time: "2-4 Days" },
  { name: "Revocation of GST Cancellation", category: "GST Compliance & Advisory", price: 2500, commission: 500, description: "Application for revocation of GST cancellation.", processing_time: "5-7 Days" },
  { name: "Amendments in GST Registration", category: "GST Compliance & Advisory", price: 800, commission: 150, description: "Filing amendments in GST registration details.", processing_time: "2-3 Days" },
  { name: "E-Way Bill Assistance", category: "GST Compliance & Advisory", price: 200, commission: 50, description: "Assistance with generating E-Way bills.", processing_time: "Instant" },

  // ITR Filing (All Categories)
  { name: "ITR-1 (Salaried)", category: "ITR Filing", price: 500, commission: 100, description: "Income Tax Return filing for salaried individuals.", processing_time: "1-2 Days" },
  { name: "ITR-2 (Capital Gains / Multiple Houses)", category: "ITR Filing", price: 1500, commission: 300, description: "ITR filing with capital gains or multiple house properties.", processing_time: "2-3 Days" },
  { name: "ITR-3 (Proprietorship / Freelancers)", category: "ITR Filing", price: 2500, commission: 500, description: "ITR filing for proprietorship businesses and freelancers.", processing_time: "3-5 Days" },
  { name: "ITR-4 (Presumptive Taxation)", category: "ITR Filing", price: 1500, commission: 300, description: "ITR filing under presumptive taxation scheme.", processing_time: "2-3 Days" },
  { name: "ITR-5 / ITR-6 / ITR-7", category: "ITR Filing", price: 5000, commission: 1000, description: "ITR filing for firms, companies, and trusts.", processing_time: "5-7 Days" },
  { name: "Updated Return Filing (ITR-U)", category: "ITR Filing", price: 2000, commission: 400, description: "Filing of updated income tax returns.", processing_time: "3-5 Days" },

  // Tax Compliance
  { name: "Advance Tax Calculation", category: "Tax Compliance", price: 500, commission: 100, description: "Calculation and payment of advance tax.", processing_time: "1 Day" },
  { name: "Form 10E Filing (Salary Arrears)", category: "Tax Compliance", price: 800, commission: 150, description: "Filing Form 10E for salary arrears relief.", processing_time: "1-2 Days" },
  { name: "Income Computation Statements", category: "Tax Compliance", price: 1000, commission: 200, description: "Preparation of detailed income computation statements.", processing_time: "2-3 Days" },
  { name: "Books & Ledger Support", category: "Tax Compliance", price: 2000, commission: 400, description: "Accounting and bookkeeping support.", processing_time: "Ongoing" },
  { name: "HUF Tax Filing", category: "Tax Compliance", price: 1500, commission: 300, description: "Tax filing for Hindu Undivided Family.", processing_time: "2-3 Days" },
  { name: "Notice Reply & Assessment Assistance", category: "Tax Compliance", price: 3000, commission: 600, description: "Assistance with income tax notices and assessments.", processing_time: "5-7 Days" },

  // Audits & Certifications
  { name: "Tax Audit Support", category: "Audits & Certifications", price: 10000, commission: 2000, description: "Support for income tax audits.", processing_time: "10-15 Days" },
  { name: "Statutory Audit Support", category: "Audits & Certifications", price: 15000, commission: 3000, description: "Support for statutory company audits.", processing_time: "15-20 Days" },
  { name: "Net Worth Certificate", category: "Audits & Certifications", price: 1500, commission: 300, description: "Issuance of Net Worth Certificate.", processing_time: "2-3 Days" },
  { name: "Capital Gain Computation Report", category: "Audits & Certifications", price: 2000, commission: 400, description: "Detailed report on capital gains computation.", processing_time: "3-5 Days" },
  { name: "Stock/Inventory Certification", category: "Audits & Certifications", price: 3000, commission: 600, description: "Certification of stock and inventory.", processing_time: "3-5 Days" },

  // Other Important Tax Services
  { name: "TDS Return Filing", category: "Other Important Tax Services", price: 1000, commission: 200, description: "Filing of quarterly TDS returns.", processing_time: "2-3 Days" },
  { name: "PAN & TAN Applications", category: "Other Important Tax Services", price: 300, commission: 60, description: "Applications for PAN and TAN.", processing_time: "3-5 Days" },
  { name: "Professional Tax Filings", category: "Other Important Tax Services", price: 800, commission: 150, description: "Filing of professional tax returns.", processing_time: "2-3 Days" },

  // Website Development
  { name: "Single-Page Business Website", category: "Website Development", price: 5000, commission: 1000, description: "Design and development of a single-page website.", processing_time: "5-7 Days" },
  { name: "Multi-Page Business Website", category: "Website Development", price: 15000, commission: 3000, description: "Design and development of a multi-page corporate website.", processing_time: "10-15 Days" },
  { name: "E-Commerce Store", category: "Website Development", price: 25000, commission: 5000, description: "Development of a fully functional e-commerce store.", processing_time: "20-30 Days" },
  { name: "Hosting + Domain Package", category: "Website Development", price: 3000, commission: 500, description: "Annual web hosting and domain registration.", processing_time: "1 Day" },
  { name: "SSL Certificate Setup", category: "Website Development", price: 1500, commission: 300, description: "Installation and setup of SSL certificate.", processing_time: "1 Day" },
  { name: "Business Email Setup", category: "Website Development", price: 1000, commission: 200, description: "Setup of professional business email accounts.", processing_time: "1-2 Days" },

  // Digital Identity Setup
  { name: "Google Business Listing", category: "Digital Identity Setup", price: 1000, commission: 200, description: "Creation and optimization of Google My Business profile.", processing_time: "2-3 Days" },
  { name: "SEO (Local & City Wise)", category: "Digital Identity Setup", price: 5000, commission: 1000, description: "Local SEO services to improve search rankings.", processing_time: "Ongoing" },
  { name: "WhatsApp Business Setup", category: "Digital Identity Setup", price: 1000, commission: 200, description: "Setup and configuration of WhatsApp Business.", processing_time: "1-2 Days" },
  { name: "Online Review Optimization", category: "Digital Identity Setup", price: 2000, commission: 400, description: "Strategies and tools to improve online reviews.", processing_time: "Ongoing" },

  // Graphic Design Services
  { name: "Logo Designing", category: "Graphic Design Services", price: 2000, commission: 400, description: "Professional logo design for businesses.", processing_time: "3-5 Days" },
  { name: "Visiting Card Design", category: "Graphic Design Services", price: 500, commission: 100, description: "Custom visiting card design.", processing_time: "1-2 Days" },
  { name: "Brochure / Pamphlet Design", category: "Graphic Design Services", price: 1500, commission: 300, description: "Design of marketing brochures and pamphlets.", processing_time: "3-5 Days" },
  { name: "Social Media Graphics", category: "Graphic Design Services", price: 1000, commission: 200, description: "Design of graphics for social media posts.", processing_time: "2-3 Days" },
  { name: "MSME Branding Kits", category: "Graphic Design Services", price: 5000, commission: 1000, description: "Comprehensive branding kit for MSMEs.", processing_time: "7-10 Days" },

  // Digital Marketing Services
  { name: "Google Ads Campaign Setup", category: "Digital Marketing Services", price: 3000, commission: 600, description: "Setup and management of Google Ads campaigns.", processing_time: "3-5 Days" },
  { name: "Facebook & Instagram Ads", category: "Digital Marketing Services", price: 3000, commission: 600, description: "Setup and management of social media ad campaigns.", processing_time: "3-5 Days" },
  { name: "Social Media Page Creation", category: "Digital Marketing Services", price: 1500, commission: 300, description: "Creation and optimization of social media pages.", processing_time: "2-3 Days" },
  { name: "City-Wise SEO Promotion", category: "Digital Marketing Services", price: 5000, commission: 1000, description: "Targeted SEO promotion for specific cities.", processing_time: "Ongoing" },
  { name: "Digital Ads & Flyer Design", category: "Digital Marketing Services", price: 1500, commission: 300, description: "Design of digital advertisements and flyers.", processing_time: "2-3 Days" }
];
