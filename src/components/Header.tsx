const Header = () => {
  return (
    <header className="bg-card py-3 px-4 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex justify-center">
        <img
          src="/images/logo.png"
          alt="Nutrix Health Care Logo"
          className="h-10 md:h-12 object-contain"
        />
      </div>
    </header>
  );
};

export default Header;
