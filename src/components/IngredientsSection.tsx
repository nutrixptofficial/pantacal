const ingredients = [
  {
    img: "/images/calcium.png",
    title: "Calcium 1200mg",
    desc: "Builds & maintains strong bones and teeth",
  },
  {
    img: "/images/vitamin-d3.png",
    title: "Vitamin D3 400 IU",
    desc: "Maximizes calcium absorption",
  },
  {
    img: "/images/vitamin-k2.png",
    title: "Vitamin K2 90mcg",
    desc: "Locks calcium into bones, not arteries",
  },
  {
    img: "/images/magnesium.png",
    title: "Magnesium 120mg",
    desc: "Activates vitamin D, supports muscles & heart",
  },
  {
    img: "/images/zinc.png",
    title: "Zinc",
    desc: "Builds bone cells, boosts immunity",
  },
];

const IngredientsSection = () => {
  return (
    <section className="py-10 md:py-16 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="section-heading mb-10">
          Why Choose Pantacal (Pakistan's No. 1 Tablets)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {ingredients.map((item, i) => (
            <div key={i} className="ingredient-card">
              <img
                src={item.img}
                alt={item.title}
                className="w-20 h-20 md:w-24 md:h-24 object-contain mb-3"
              />
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                {item.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IngredientsSection;
