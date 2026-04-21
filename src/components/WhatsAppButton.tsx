import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/923292777707?text=Can%20I%20get%20more%20info%20about%20Pantacal%20by%20Nutrix%20Health%20Care?"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-brand-green p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 text-accent-foreground" />
    </a>
  );
};

export default WhatsAppButton;
