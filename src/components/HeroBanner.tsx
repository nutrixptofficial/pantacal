const HeroBanner = () => {
  return (
    <section className="w-full">
      <picture>
        <source media="(max-width: 768px)" srcSet="/images/hero-mobile.webp" />
        <img
          src="/images/hero-desktop.webp"
          alt="Pantacal - Pakistan's No.1 Power Formula for Stronger Bones"
          className="w-full h-auto"
        />
      </picture>
    </section>
  );
};

export default HeroBanner;
