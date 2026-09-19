export interface ComparisonFeature {
  name: string;
  category: string;
  gudform: string | boolean;
  competitor: string | boolean;
}

export interface ComparisonData {
  slug: string;
  competitorName: string;
  competitorTagline: string;
  heroTitle: string;
  heroDescription: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  competitorStrengths: string[];
  competitorWeaknesses: string[];
  gudformAdvantages: string[];
  features: ComparisonFeature[];
  pricingComparison: {
    gudform: { plan: string; price: string; note: string }[];
    competitor: { plan: string; price: string; note: string }[];
  };
  faq: { question: string; answer: string }[];
  ctaTitle: string;
  ctaDescription: string;
}

export const COMPARISONS: Record<string, ComparisonData> = {
  typeform: {
    slug: "typeform",
    competitorName: "Typeform",
    competitorTagline: "Typeform is known for beautiful, conversational forms — but it comes at a premium price.",
    heroTitle: "GudForm vs Typeform",
    heroDescription:
      "Both GudForm and Typeform create conversational, one-question-at-a-time forms. But GudForm is open-source, dramatically more affordable, and just as powerful.",
    metaTitle: "GudForm vs Typeform: Free Open-Source Alternative (2025 Comparison)",
    metaDescription:
      "Compare GudForm and Typeform side by side. See how GudForm offers the same conversational form experience with unlimited submissions, open-source code, and lower pricing.",
    intro:
      "Typeform pioneered the conversational form experience — showing one question at a time with slick animations. GudForm delivers the exact same experience with a crucial difference: it's open-source and offers unlimited forms and submissions on every plan, including the free tier. If you've been paying Typeform's premium pricing for basic form functionality, GudForm is the alternative you've been waiting for.",
    competitorStrengths: [
      "Pioneer of conversational form UX — polished and well-known brand",
      "Large ecosystem of native integrations (100+)",
      "VideoAsk product for video-based forms",
      "Enterprise features like SSO and advanced compliance",
    ],
    competitorWeaknesses: [
      "Free plan limited to just 10 responses/month — essentially unusable",
      "Basic plan starts at $25/month with only 100 responses",
      "Response limits on every plan, even the most expensive",
      "Closed-source — no ability to self-host or audit the code",
      "No built-in payment collection without third-party add-ons",
    ],
    gudformAdvantages: [
      "Unlimited forms and submissions on every plan, including free",
      "Open-source — inspect the code, self-host, contribute",
      "Built-in payment collection via Stripe Connect",
      "Conditional logic and branching on all plans",
      "Template marketplace for quick starts",
      "Integration marketplace with developer API",
      "Custom branding on paid plans",
      "No response caps — ever",
    ],
    features: [
      { name: "Conversational one-question-at-a-time UX", category: "Form Experience", gudform: true, competitor: true },
      { name: "Conditional logic / branching", category: "Form Experience", gudform: true, competitor: true },
      { name: "Custom themes & branding", category: "Form Experience", gudform: true, competitor: true },
      { name: "Progress bar", category: "Form Experience", gudform: true, competitor: true },
      { name: "Welcome & Thank You screens", category: "Form Experience", gudform: true, competitor: true },
      { name: "File uploads", category: "Question Types", gudform: true, competitor: true },
      { name: "Rating & Scale questions", category: "Question Types", gudform: true, competitor: true },
      { name: "Date picker", category: "Question Types", gudform: true, competitor: true },
      { name: "Payment collection (Stripe)", category: "Payments", gudform: "Built-in", competitor: "Add-on" },
      { name: "Multiple payment options/tiers", category: "Payments", gudform: true, competitor: false },
      { name: "Unlimited forms", category: "Limits", gudform: "All plans", competitor: "All plans" },
      { name: "Unlimited submissions", category: "Limits", gudform: "All plans", competitor: "None (capped)" },
      { name: "Response limit per plan", category: "Limits", gudform: "No limit", competitor: "10–10,000/mo" },
      { name: "Webhooks", category: "Integrations", gudform: true, competitor: true },
      { name: "REST API", category: "Integrations", gudform: true, competitor: true },
      { name: "Integration marketplace", category: "Integrations", gudform: true, competitor: true },
      { name: "Template marketplace", category: "Templates", gudform: true, competitor: true },
      { name: "Team collaboration", category: "Collaboration", gudform: true, competitor: true },
      { name: "Real-time analytics", category: "Analytics", gudform: true, competitor: true },
      { name: "Open-source", category: "Platform", gudform: true, competitor: false },
      { name: "Self-hostable", category: "Platform", gudform: true, competitor: false },
      { name: "Auto-responder emails", category: "Automation", gudform: true, competitor: "Add-on" },
    ],
    pricingComparison: {
      gudform: [
        { plan: "Free", price: "$0/mo", note: "Unlimited forms & submissions" },
        { plan: "Starter", price: "$5/mo", note: "Collections, all question types" },
        { plan: "Pro", price: "$19/mo", note: "Teams, API, webhooks, payments" },
        { plan: "Business", price: "$49/mo", note: "Everything + priority support" },
      ],
      competitor: [
        { plan: "Free", price: "$0/mo", note: "10 responses/month limit" },
        { plan: "Basic", price: "$25/mo", note: "100 responses/month" },
        { plan: "Plus", price: "$50/mo", note: "1,000 responses/month" },
        { plan: "Business", price: "$83/mo", note: "10,000 responses/month" },
      ],
    },
    faq: [
      {
        question: "Is GudForm really a Typeform alternative?",
        answer: "Yes. GudForm offers the same conversational, one-question-at-a-time experience that Typeform is known for. The core UX — conditional logic, custom branding, progress bars, and beautiful themes — is equivalent. The key differences are that GudForm is open-source, has no response limits, and costs dramatically less.",
      },
      {
        question: "Can I migrate my Typeform forms to GudForm?",
        answer: "While there's no automatic import tool yet, recreating forms in GudForm is quick thanks to our template marketplace and component blocks. Most users report building their forms faster in GudForm than in Typeform.",
      },
      {
        question: "Does GudForm support the same integrations as Typeform?",
        answer: "GudForm has a growing integration marketplace plus webhooks and a REST API, so you can connect to any tool. Native integrations include Google Sheets, Slack, Mailchimp, HubSpot, Zapier, and Google Drive — with more being added by our developer community.",
      },
      {
        question: "Why is GudForm so much cheaper?",
        answer: "GudForm is open-source and community-driven, which keeps overhead low. We believe form infrastructure shouldn't be gated behind expensive per-response pricing. Our model is based on feature tiers, not response caps.",
      },
    ],
    ctaTitle: "Ready to switch from Typeform?",
    ctaDescription: "Start collecting unlimited responses today. No credit card required.",
  },

  jotform: {
    slug: "jotform",
    competitorName: "Jotform",
    competitorTagline: "Jotform offers a wide range of form templates and a drag-and-drop builder, but its pricing scales quickly.",
    heroTitle: "GudForm vs Jotform",
    heroDescription:
      "Jotform is a feature-packed form builder with thousands of templates. GudForm matches the core features with a modern conversational UX, open-source transparency, and more generous limits.",
    metaTitle: "GudForm vs Jotform: Modern Open-Source Form Builder (2025 Comparison)",
    metaDescription:
      "Compare GudForm and Jotform. See why GudForm's conversational forms, unlimited submissions, and open-source approach make it the best Jotform alternative.",
    intro:
      "Jotform has been around since 2006 and has built an impressive library of 10,000+ templates and a traditional drag-and-drop form builder. However, its forms use a traditional all-questions-on-one-page layout that leads to lower completion rates. GudForm takes a modern approach with conversational, one-question-at-a-time forms that feel engaging rather than overwhelming. Plus, GudForm is open-source with no submission limits on any plan.",
    competitorStrengths: [
      "Massive template library (10,000+ templates)",
      "PDF form generation and e-signatures",
      "Kiosk mode for in-person data collection",
      "Long-established platform with extensive documentation",
    ],
    competitorWeaknesses: [
      "Traditional form layout — all questions on one page, lower completion rates",
      "Free plan limited to 100 submissions/month and 5 forms",
      "Storage limits on all plans (100MB–100GB)",
      "Cluttered interface with too many options",
      "Forms can feel dated compared to modern conversational UX",
    ],
    gudformAdvantages: [
      "Conversational one-question-at-a-time UX — higher completion rates",
      "Unlimited forms and submissions on every plan",
      "Open-source — full code transparency",
      "Clean, modern builder with conditional logic",
      "Built-in payment collection via Stripe Connect",
      "Template & integration marketplaces",
      "No storage limits for form data",
      "Developer-friendly API and webhooks",
    ],
    features: [
      { name: "Conversational form UX", category: "Form Experience", gudform: true, competitor: false },
      { name: "Traditional multi-question pages", category: "Form Experience", gudform: false, competitor: true },
      { name: "Conditional logic", category: "Form Experience", gudform: true, competitor: true },
      { name: "Custom themes & branding", category: "Form Experience", gudform: true, competitor: true },
      { name: "Drag & drop builder", category: "Form Experience", gudform: true, competitor: true },
      { name: "File uploads", category: "Question Types", gudform: true, competitor: true },
      { name: "Rating & Scale questions", category: "Question Types", gudform: true, competitor: true },
      { name: "E-signatures", category: "Question Types", gudform: false, competitor: true },
      { name: "Payment collection", category: "Payments", gudform: "Stripe Connect", competitor: "Multiple gateways" },
      { name: "Unlimited forms", category: "Limits", gudform: "All plans", competitor: "5 on free" },
      { name: "Unlimited submissions", category: "Limits", gudform: "All plans", competitor: "100–unlimited (paid)" },
      { name: "Storage limits", category: "Limits", gudform: "None", competitor: "100MB–100GB" },
      { name: "Webhooks", category: "Integrations", gudform: true, competitor: true },
      { name: "REST API", category: "Integrations", gudform: true, competitor: true },
      { name: "Integration marketplace", category: "Integrations", gudform: true, competitor: true },
      { name: "Template marketplace", category: "Templates", gudform: true, competitor: "10,000+ templates" },
      { name: "Team collaboration", category: "Collaboration", gudform: true, competitor: true },
      { name: "PDF generation", category: "Features", gudform: false, competitor: true },
      { name: "Open-source", category: "Platform", gudform: true, competitor: false },
      { name: "Self-hostable", category: "Platform", gudform: true, competitor: false },
      { name: "Auto-responder emails", category: "Automation", gudform: true, competitor: true },
    ],
    pricingComparison: {
      gudform: [
        { plan: "Free", price: "$0/mo", note: "Unlimited forms & submissions" },
        { plan: "Starter", price: "$5/mo", note: "Collections, all question types" },
        { plan: "Pro", price: "$19/mo", note: "Teams, API, webhooks, payments" },
        { plan: "Business", price: "$49/mo", note: "Everything + priority support" },
      ],
      competitor: [
        { plan: "Starter", price: "$0/mo", note: "5 forms, 100 submissions/month" },
        { plan: "Bronze", price: "$34/mo", note: "25 forms, 1,000 submissions/month" },
        { plan: "Silver", price: "$39/mo", note: "50 forms, 2,500 submissions/month" },
        { plan: "Gold", price: "$99/mo", note: "100 forms, 10,000 submissions/month" },
      ],
    },
    faq: [
      {
        question: "How is GudForm different from Jotform?",
        answer: "The biggest difference is the form experience. Jotform uses traditional all-questions-on-one-page forms, while GudForm uses a modern conversational approach — one question at a time. This leads to significantly higher completion rates. GudForm is also open-source with no submission limits.",
      },
      {
        question: "Does GudForm have as many templates as Jotform?",
        answer: "Jotform has 10,000+ templates built over many years. GudForm has a growing template marketplace with professionally designed templates, plus the ability for anyone to publish their own. Quality over quantity — our templates are designed for the conversational format.",
      },
      {
        question: "Can GudForm generate PDFs like Jotform?",
        answer: "PDF generation is not currently a built-in feature, but you can use our webhook and API integrations to connect to PDF generation services. This is on our roadmap for future development.",
      },
      {
        question: "Is GudForm suitable for enterprise use?",
        answer: "Yes. GudForm offers team collaboration, API access, webhooks, and custom branding. Being open-source also means you can self-host for maximum control and compliance.",
      },
    ],
    ctaTitle: "Ready for a modern form experience?",
    ctaDescription: "Build conversational forms that people actually want to complete. Free forever.",
  },

  "google-forms": {
    slug: "google-forms",
    competitorName: "Google Forms",
    competitorTagline: "Google Forms is free and simple — but that simplicity comes with significant limitations.",
    heroTitle: "GudForm vs Google Forms",
    heroDescription:
      "Google Forms is the go-to for quick, free forms. But when you need beautiful design, conversational UX, conditional logic, payment collection, or integrations — GudForm is the upgrade.",
    metaTitle: "GudForm vs Google Forms: Beautiful Form Builder Alternative (2025 Comparison)",
    metaDescription:
      "Compare GudForm and Google Forms. Discover why GudForm's conversational UX, custom branding, payment collection, and integrations make it the best Google Forms upgrade.",
    intro:
      "Google Forms is ubiquitous — it's free, simple, and works with Google Workspace. For basic data collection, it gets the job done. But Google Forms has significant limitations: no conversational UX, minimal design customization, no payment collection, limited conditional logic, and no integration marketplace. GudForm is the perfect upgrade when you've outgrown Google Forms — keeping the simplicity while adding everything Google Forms lacks.",
    competitorStrengths: [
      "Completely free with unlimited responses",
      "Deep Google Workspace integration (Sheets, Drive, etc.)",
      "Familiar interface for Google users",
      "Collaborative editing via Google accounts",
      "Quiz mode with auto-grading",
    ],
    competitorWeaknesses: [
      "No conversational UX — all questions dumped on one page",
      "Very limited design customization (basic colors only)",
      "No payment collection built-in",
      "Basic conditional logic — limited to \"go to section\"",
      "No branding removal (always says \"Google Forms\")",
      "No webhooks or developer API",
      "No integration marketplace",
      "Forms look generic — not suitable for professional brands",
    ],
    gudformAdvantages: [
      "Conversational one-question-at-a-time UX — dramatically better completion rates",
      "Beautiful themes, custom colors, and full brand customization",
      "Built-in payment collection via Stripe Connect",
      "Advanced conditional logic with jump-to-question branching",
      "Webhooks, REST API, and integration marketplace",
      "Template marketplace for professional form designs",
      "Auto-responder emails to respondents",
      "Team collaboration with role-based access",
      "Open-source with self-hosting option",
    ],
    features: [
      { name: "Conversational form UX", category: "Form Experience", gudform: true, competitor: false },
      { name: "Custom themes & brand colors", category: "Form Experience", gudform: "Full control", competitor: "Basic colors only" },
      { name: "Remove branding", category: "Form Experience", gudform: true, competitor: false },
      { name: "Progress bar", category: "Form Experience", gudform: true, competitor: true },
      { name: "Advanced conditional logic", category: "Form Experience", gudform: true, competitor: "Basic (sections)" },
      { name: "Welcome & Thank You screens", category: "Form Experience", gudform: true, competitor: false },
      { name: "File uploads", category: "Question Types", gudform: true, competitor: true },
      { name: "Rating & Scale questions", category: "Question Types", gudform: true, competitor: "Linear scale only" },
      { name: "Quiz auto-grading", category: "Question Types", gudform: false, competitor: true },
      { name: "Payment collection", category: "Payments", gudform: "Stripe Connect", competitor: false },
      { name: "Unlimited forms", category: "Limits", gudform: true, competitor: true },
      { name: "Unlimited submissions", category: "Limits", gudform: true, competitor: true },
      { name: "Webhooks", category: "Integrations", gudform: true, competitor: false },
      { name: "REST API", category: "Integrations", gudform: true, competitor: false },
      { name: "Integration marketplace", category: "Integrations", gudform: true, competitor: false },
      { name: "Google Sheets sync", category: "Integrations", gudform: "Via integration", competitor: "Native" },
      { name: "Template marketplace", category: "Templates", gudform: true, competitor: "Basic templates" },
      { name: "Team collaboration", category: "Collaboration", gudform: true, competitor: true },
      { name: "Real-time analytics", category: "Analytics", gudform: true, competitor: "Basic charts" },
      { name: "Auto-responder emails", category: "Automation", gudform: true, competitor: false },
      { name: "Open-source", category: "Platform", gudform: true, competitor: false },
    ],
    pricingComparison: {
      gudform: [
        { plan: "Free", price: "$0/mo", note: "Unlimited forms & submissions" },
        { plan: "Starter", price: "$5/mo", note: "Collections, all question types" },
        { plan: "Pro", price: "$19/mo", note: "Teams, API, webhooks, payments" },
        { plan: "Business", price: "$49/mo", note: "Everything + priority support" },
      ],
      competitor: [
        { plan: "Free", price: "$0/mo", note: "Unlimited (with Google account)" },
        { plan: "Google Workspace", price: "$7/mo", note: "Per user, minor form additions" },
      ],
    },
    faq: [
      {
        question: "Why switch from Google Forms if it's free?",
        answer: "Google Forms is great for quick internal surveys, but it falls short for anything customer-facing. No conversational UX, minimal branding, no payment collection, and no real integrations. GudForm's free plan also offers unlimited forms and submissions — with dramatically better forms.",
      },
      {
        question: "Can GudForm connect to Google Sheets like Google Forms?",
        answer: "Yes! GudForm has a native Google Sheets integration in our marketplace. Connect it once and all form responses automatically sync to your spreadsheet, just like Google Forms.",
      },
      {
        question: "Does GudForm support quiz auto-grading?",
        answer: "Quiz auto-grading is not yet a built-in feature, though you can create quiz-style forms with multiple choice and scoring logic. Full quiz grading is on our roadmap.",
      },
      {
        question: "Is GudForm's free plan really unlimited?",
        answer: "Yes. GudForm's free plan gives you unlimited forms and unlimited submissions. No response caps, no hidden limits. We believe basic form functionality should be free for everyone.",
      },
    ],
    ctaTitle: "Upgrade from Google Forms — for free",
    ctaDescription: "Beautiful conversational forms with unlimited submissions. No Google account required.",
  },
};
