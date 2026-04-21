import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What Is The Price Of Pantacal Bone Health Tablets In Pakistan?",
    a: "Pantacal is priced at just Rs. 1,150 for a 30-tablet supply. We also offer free home delivery nationwide, making it easy and affordable to support your bone health from the comfort of your home.",
  },
  {
    q: "Which Vitamins Are Essential For Strong Bones?",
    a: "Strong bones require a combination of key nutrients including Calcium, Vitamin D3, Vitamin K2, and Magnesium. Pantacal contains a clinically balanced blend of these essential vitamins and minerals to support optimal bone density and strength.",
  },
  {
    q: "What Is The Recommended Dosage?",
    a: "The recommended dosage is 1-2 tablets daily with a meal, or as directed by your healthcare provider. For best results, take consistently and pair with adequate hydration and a balanced diet.",
  },
  {
    q: "Is There Any Side Effect Of Nutrix Health Care's Pantacal?",
    a: "Pantacal is formulated with natural, high-quality ingredients and is generally well tolerated. As with any supplement, consult your physician before use if you are pregnant, nursing, or have a pre-existing medical condition.",
  },
  {
    q: "Where Can I Buy Nutrix Health Care's Pantacal?",
    a: "Pantacal is available exclusively on our official website with free nationwide home delivery. Simply add to cart and place your order — we'll deliver right to your doorstep across Pakistan.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-10 md:py-16 bg-section-light">
      <div className="container mx-auto px-4">
        <h2 className="section-heading mb-10">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center">
            <img
              src="/images/faq-image.png"
              alt="Pantacal - Best Calcium Tablets in Pakistan"
              className="max-w-xs md:max-w-sm rounded-xl"
            />
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item bg-card">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-foreground text-sm md:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
