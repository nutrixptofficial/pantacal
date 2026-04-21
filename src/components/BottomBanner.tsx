const BottomBanner = () => {
  return (
    <section className="w-full">
      <picture>
        <source media="(max-width: 768px)" srcSet="/images/bottom-banner-mobile.webp" />
        <img
          src="/images/bottom-banner-desktop.webp"
          alt="Pantacal Bone Health"
          className="w-full h-auto"
        />
      </picture>
    </section>
  );
};

export default BottomBanner;
